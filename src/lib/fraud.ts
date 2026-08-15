import "server-only";

import { prisma } from "@/lib/db";

/**
 * Fake-rating detection (§11).
 *
 * Suspicious ratings are never deleted and never shown to the rated user
 * as "someone tried to cheat" — they are simply down-weighted and marked
 * protected, which also removes them from Gold's identity view (§15).
 */

export const FRAUD_FLAGS = {
  NEW_ACCOUNT: {
    key: "NEW_ACCOUNT",
    label: "Hesap çok yeni",
    penalty: 0.6,
  },
  NO_REPUTATION: {
    key: "NO_REPUTATION",
    label: "Değerlendiren kişinin kendi itibar geçmişi yok",
    penalty: 0.85,
  },
  BURST: {
    key: "BURST",
    label: "Kısa sürede çok sayıda değerlendirme",
    penalty: 0.5,
  },
  MUTUAL_MAX: {
    key: "MUTUAL_MAX",
    label: "Karşılıklı tam puan alışverişi",
    penalty: 0.55,
  },
  FLAT_PATTERN: {
    key: "FLAT_PATTERN",
    label: "Her değerlendirmede aynı tekdüze puan",
    penalty: 0.7,
  },
} as const;

export type FraudFlagKey = keyof typeof FRAUD_FLAGS;

const MIN_WEIGHT = 0.15;
const PROTECT_BELOW = 0.55;

export type FraudVerdict = {
  flags: FraudFlagKey[];
  weight: number;
  isProtected: boolean;
};

type EvaluateArgs = {
  raterUserId: string;
  ratedUserId: string;
  scores: number[];
};

export async function evaluateRating({
  raterUserId,
  ratedUserId,
  scores,
}: EvaluateArgs): Promise<FraudVerdict> {
  const flags: FraudFlagKey[] = [];

  const [rater, givenLastHour, givenAll, reverse, receivedCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: raterUserId },
        select: { createdAt: true, isVerified: true },
      }),
      prisma.rating.count({
        where: {
          raterUserId,
          createdAt: { gte: new Date(Date.now() - 3_600_000) },
        },
      }),
      prisma.rating.findMany({
        where: { raterUserId },
        select: { traits: { select: { score: true } } },
        take: 50,
      }),
      prisma.rating.findFirst({
        where: { raterUserId: ratedUserId, ratedUserId: raterUserId },
        select: { traits: { select: { score: true } } },
      }),
      prisma.rating.count({ where: { ratedUserId: raterUserId } }),
    ]);

  const accountAgeMs = rater ? Date.now() - rater.createdAt.getTime() : 0;
  if (!rater?.isVerified && accountAgeMs < 24 * 3_600_000) {
    flags.push("NEW_ACCOUNT");
  }

  if (!rater?.isVerified && receivedCount === 0) {
    flags.push("NO_REPUTATION");
  }

  if (givenLastHour >= 6) {
    flags.push("BURST");
  }

  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

  const thisAvg = avg(scores);
  if (reverse) {
    const reverseAvg = avg(reverse.traits.map((t) => t.score));
    if (thisAvg >= 4.9 && reverseAvg >= 4.9) flags.push("MUTUAL_MAX");
  }

  // Someone who gives literally the same maxed-out rating to everyone
  // carries less signal than someone who differentiates.
  const priorFlat = givenAll.filter(
    (r) => r.traits.length > 0 && r.traits.every((t) => t.score === 5),
  ).length;
  if (
    givenAll.length >= 3 &&
    priorFlat === givenAll.length &&
    scores.every((s) => s === 5)
  ) {
    flags.push("FLAT_PATTERN");
  }

  let weight = 1;
  for (const f of flags) weight *= FRAUD_FLAGS[f].penalty;
  weight = Math.max(MIN_WEIGHT, Math.round(weight * 100) / 100);

  return { flags, weight, isProtected: weight < PROTECT_BELOW };
}

export function describeFlags(json: string): string[] {
  try {
    const keys = JSON.parse(json) as FraudFlagKey[];
    return keys.filter((k) => k in FRAUD_FLAGS).map((k) => FRAUD_FLAGS[k].label);
  } catch {
    return [];
  }
}

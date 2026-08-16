import "server-only";

import { prisma } from "@/lib/db";
import { FRAUD_FLAGS, type FraudFlagKey } from "@/lib/fraud-flags";

/**
 * Fake-rating detection (§11).
 *
 * Suspicious ratings are never deleted and never shown to the rated user
 * as "someone tried to cheat" — they are simply down-weighted and marked
 * protected, which also removes them from Gold's identity view (§15).
 */

export { FRAUD_FLAGS, parseFlags, type FraudFlagKey } from "@/lib/fraud-flags";

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

/**
 * Re-score one rating against today's evidence.
 *
 * The live check only sees the moment a rating is written, which misses every
 * pattern that only becomes visible later — the reciprocal ring that closes a
 * week after the first vote, the account that turns out to rate nobody but its
 * own circle. Returns whether anything actually changed, so a sweep can report
 * real work rather than a row count.
 */
export async function recomputeRating(ratingId: string): Promise<boolean> {
  const rating = await prisma.rating.findUnique({
    where: { id: ratingId },
    select: {
      id: true,
      raterUserId: true,
      ratedUserId: true,
      weight: true,
      isProtected: true,
      traits: { select: { score: true } },
    },
  });
  if (!rating) return false;

  const verdict = await evaluateRating({
    raterUserId: rating.raterUserId,
    ratedUserId: rating.ratedUserId,
    scores: rating.traits.map((t) => t.score),
  });

  const changed =
    verdict.weight !== rating.weight ||
    verdict.isProtected !== rating.isProtected;
  if (!changed) return false;

  await prisma.rating.update({
    where: { id: rating.id },
    data: {
      weight: verdict.weight,
      isProtected: verdict.isProtected,
      fraudFlags: JSON.stringify(verdict.flags),
    },
  });
  return true;
}

export type SweepResult = { scanned: number; changed: number };

/**
 * Re-score every rating. Cheap enough to run whole at this size; when it stops
 * being cheap, the `where` clause is the seam — scan by `updatedAt` window.
 */
export async function recomputeAllRatings(limit = 5000): Promise<SweepResult> {
  const ids = await prisma.rating.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let changed = 0;
  for (const { id } of ids) {
    if (await recomputeRating(id)) changed += 1;
  }
  return { scanned: ids.length, changed };
}

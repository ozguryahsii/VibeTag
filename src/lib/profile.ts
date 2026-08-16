import "server-only";

import { prisma } from "@/lib/db";
import { buildVibeProfile, type RatingInput, type VibeProfile } from "@/lib/vibe";
import type { RelationshipKey, TraitKey, VibeTagKey } from "@/lib/taxonomy";

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  plan: string;
  isVerified: boolean;
  createdAt: Date;
};

export async function getUserByUsername(
  username: string,
): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      avatarColor: true,
      plan: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

export async function getRatingsFor(userId: string): Promise<RatingInput[]> {
  const rows = await prisma.rating.findMany({
    // Ratings hidden by moderation stop counting the moment a report is
    // upheld. The row survives for the appeal trail; the score must not.
    where: { ratedUserId: userId, hiddenAt: null },
    select: {
      id: true,
      relationship: true,
      weight: true,
      createdAt: true,
      traits: { select: { traitKey: true, score: true } },
      vibeTags: { select: { tagKey: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    relationship: r.relationship as RelationshipKey,
    weight: r.weight,
    createdAt: r.createdAt,
    traits: r.traits.map((t) => ({
      traitKey: t.traitKey as TraitKey,
      score: t.score,
    })),
    vibeTags: r.vibeTags.map((t) => ({ tagKey: t.tagKey as VibeTagKey })),
  }));
}

export async function getVibeProfile(userId: string): Promise<VibeProfile> {
  return buildVibeProfile(await getRatingsFor(userId));
}

/**
 * "Top X% of users" — computed against everyone who has at least 3
 * ratings, so a brand new profile never claims a rank it did not earn.
 */
export async function getPercentile(
  userId: string,
  score: number,
): Promise<number | null> {
  const counts = await prisma.rating.groupBy({
    by: ["ratedUserId"],
    _count: { _all: true },
    having: { ratedUserId: { _count: { gte: 3 } } },
  });
  const eligible = new Set(counts.map((c) => c.ratedUserId));
  if (eligible.size < 5 || !eligible.has(userId)) return null;

  // One query for the whole cohort — scoring every profile with its own
  // round-trip turns a leaderboard into an N+1 stampede.
  const rows = await prisma.rating.findMany({
    where: { ratedUserId: { in: [...eligible] }, hiddenAt: null },
    select: {
      ratedUserId: true,
      relationship: true,
      weight: true,
      createdAt: true,
      traits: { select: { traitKey: true, score: true } },
      vibeTags: { select: { tagKey: true } },
    },
  });

  const byUser = new Map<string, RatingInput[]>();
  for (const r of rows) {
    const list = byUser.get(r.ratedUserId) ?? [];
    list.push({
      id: "",
      relationship: r.relationship as RelationshipKey,
      weight: r.weight,
      createdAt: r.createdAt,
      traits: r.traits.map((t) => ({
        traitKey: t.traitKey as TraitKey,
        score: t.score,
      })),
      vibeTags: r.vibeTags.map((t) => ({ tagKey: t.tagKey as VibeTagKey })),
    });
    byUser.set(r.ratedUserId, list);
  }

  const scores = [...byUser.values()].map((rs) => buildVibeProfile(rs).score);
  const better = scores.filter((s) => s > score).length;
  return Math.max(1, Math.round(((better + 1) / scores.length) * 100));
}

export type ExistingRating = {
  id: string;
  relationship: RelationshipKey;
  comment: string | null;
  hideIdentity: boolean;
  updateCount: number;
  lastUpdatedAt: Date | null;
  createdAt: Date;
  traits: Record<string, number>;
  tags: string[];
};

export async function getMyRatingOf(
  raterUserId: string,
  ratedUserId: string,
): Promise<ExistingRating | null> {
  const r = await prisma.rating.findUnique({
    where: { ratedUserId_raterUserId: { ratedUserId, raterUserId } },
    include: { traits: true, vibeTags: true },
  });
  if (!r) return null;

  return {
    id: r.id,
    relationship: r.relationship as RelationshipKey,
    comment: r.comment,
    hideIdentity: r.hideIdentity,
    updateCount: r.updateCount,
    lastUpdatedAt: r.lastUpdatedAt,
    createdAt: r.createdAt,
    traits: Object.fromEntries(r.traits.map((t) => [t.traitKey, t.score])),
    tags: r.vibeTags.map((t) => t.tagKey),
  };
}

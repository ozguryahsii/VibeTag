import "server-only";

import { prisma } from "@/lib/db";
import { earnedBadges, type BadgeTier } from "@/lib/badges";
import { getVibeProfile } from "@/lib/profile";
import { notify } from "@/lib/notifications";

/** A badge somebody owns: the family, and which tier of it. */
export type HeldBadge = { key: string; tier: BadgeTier };

/**
 * Award any badge a profile now qualifies for.
 *
 * Earning is an event, not a calculation. `computeBadges` re-derives the whole
 * set on every render, which is right for showing progress but wrong for
 * ownership: a badge would silently vanish the week someone's score dipped,
 * and there would never be a moment to congratulate them for. So the first
 * time a threshold is crossed it is written down, and it stays written down.
 *
 * Returns the keys that were awarded just now, so the caller can decide
 * whether that deserves a notification.
 */
export async function awardBadges(userId: string): Promise<HeldBadge[]> {
  const profile = await getVibeProfile(userId);
  const qualifies = earnedBadges(profile).map((b) => ({
    key: b.key,
    tier: b.tier,
  }));
  if (qualifies.length === 0) return [];

  const held = await prisma.earnedBadge.findMany({
    where: { userId },
    select: { key: true, tier: true },
  });
  const heldIds = new Set(held.map((b) => `${b.key}:${b.tier}`));
  const fresh = qualifies.filter((b) => !heldIds.has(`${b.key}:${b.tier}`));
  if (fresh.length === 0) return [];

  await prisma.earnedBadge.createMany({
    data: fresh.map((b) => ({ userId, key: b.key, tier: b.tier })),
  });
  return fresh;
}

/**
 * Award and tell them about it.
 *
 * The badge key travels in the notification's variables rather than its text,
 * so the congratulation arrives in whatever language they are reading.
 */
export async function awardAndNotify(userId: string): Promise<void> {
  const fresh = await awardBadges(userId);
  for (const badge of fresh) {
    await notify(userId, "BADGE_EARNED", {
      vars: { badgeKey: badge.key, tier: badge.tier },
      href: "/badges",
    });
  }
}

/** Badges this user has actually been awarded, newest first. */
export async function heldBadges(userId: string): Promise<HeldBadge[]> {
  const rows = await prisma.earnedBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    select: { key: true, tier: true },
  });
  return rows.map((r) => ({ key: r.key, tier: r.tier as BadgeTier }));
}

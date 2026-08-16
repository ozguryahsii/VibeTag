import "server-only";

import { prisma } from "@/lib/db";
import { earnedBadges } from "@/lib/badges";
import { getVibeProfile } from "@/lib/profile";
import { notify } from "@/lib/notifications";

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
export async function awardBadges(userId: string): Promise<string[]> {
  const profile = await getVibeProfile(userId);
  const qualifies = earnedBadges(profile).map((b) => b.key);
  if (qualifies.length === 0) return [];

  const held = await prisma.earnedBadge.findMany({
    where: { userId },
    select: { key: true },
  });
  const heldKeys = new Set(held.map((b) => b.key));
  const fresh = qualifies.filter((k) => !heldKeys.has(k));
  if (fresh.length === 0) return [];

  await prisma.earnedBadge.createMany({
    data: fresh.map((key) => ({ userId, key })),
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
  for (const key of fresh) {
    await notify(userId, "BADGE_EARNED", {
      vars: { badgeKey: key },
      href: "/home",
    });
  }
}

/** Badge keys this user has actually been awarded, newest first. */
export async function heldBadgeKeys(userId: string): Promise<string[]> {
  const rows = await prisma.earnedBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    select: { key: true },
  });
  return rows.map((r) => r.key);
}

import { RATING_UPDATE_COOLDOWN_DAYS } from "@/lib/taxonomy";

const DAY_MS = 86_400_000;

/** Days left before this rater may revise their rating again (0 = now). */
export function cooldownDaysLeft(lastUpdatedAt: Date | null): number {
  if (!lastUpdatedAt) return 0;
  const elapsed = Date.now() - lastUpdatedAt.getTime();
  const left = RATING_UPDATE_COOLDOWN_DAYS * DAY_MS - elapsed;
  return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

export function nextUpdateDate(lastUpdatedAt: Date | null): Date | null {
  if (!lastUpdatedAt) return null;
  return new Date(lastUpdatedAt.getTime() + RATING_UPDATE_COOLDOWN_DAYS * DAY_MS);
}

/**
 * §15 — may this viewer see who wrote a rating they received?
 *
 * Gold buys attribution, but two things override it: a rating the fraud
 * detector protected, and a rater who explicitly asked to stay hidden. Both
 * outrank the plan, always.
 *
 * This lives here rather than inline because it is asked in two places — the
 * insights list and the "message them" thread — and the two drifting apart is
 * exactly how a Gold member ends up staring at a rater's name on one screen
 * and "Anonymous rater" on the next.
 */
export function canSeeRaterIdentity(
  viewerPlan: string,
  rating: { isProtected: boolean; hideIdentity: boolean },
): boolean {
  return viewerPlan === "GOLD" && !rating.isProtected && !rating.hideIdentity;
}

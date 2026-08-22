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
 * Who may write a free-text note when rating this person.
 *
 * Ratings themselves are open to everyone; the note is where harassment
 * actually happens, so it is the note the rated person controls. Unknown
 * policy values fall back to EVERYONE rather than throwing — a bad row must
 * not make a profile unratable.
 */
export type CommentPolicy = "EVERYONE" | "INVITED" | "FRIENDS";

export function commentAllowed(
  policy: string,
  ctx: { invited: boolean; friends: boolean },
): boolean {
  if (policy === "INVITED") return ctx.invited;
  if (policy === "FRIENDS") return ctx.friends;
  return true;
}

/**
 * §15 — may this viewer see who wrote a rating they received?
 *
 * Gold buys attribution, but two things override it: a rating the fraud
 * detector protected, and a rater who chose to stay hidden back when that
 * option existed. The choice was removed from the rate flow — identity
 * visibility now belongs to the rated person's plan, not the rater — but
 * ratings written under the old promise keep it. Both outrank the plan,
 * always.
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

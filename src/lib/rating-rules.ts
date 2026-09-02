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
 * Who may rate this person — score, tags and note alike.
 *
 * Three choices: open; "my circle" — the people they invited and their
 * friends, as one group; or nobody, which pauses the profile. Paused means
 * nothing new comes in and nothing already there changes: an existing
 * rater may not revise either. What they already received keeps counting.
 *
 * Until 2026-09-02 this gated only the written note, on the theory that
 * harassment lives in prose. App Review (guideline 1.2) read "anyone may
 * score a real person" as objectifying them, and a score somebody never
 * asked for is not that different from a note they never asked for. So the
 * whole rating is now the rated person's to open or close.
 *
 * INVITED and FRIENDS are the pre-merge spellings of the circle; rows are
 * migrated, but a stray value must still deny the way its owner meant.
 * Unknown values fall back to EVERYONE rather than throwing — a bad row
 * must not make a profile unratable.
 */
export type RatingPolicy = "EVERYONE" | "CIRCLE" | "NOBODY";

export const RATING_POLICIES: readonly RatingPolicy[] = ["EVERYONE", "CIRCLE", "NOBODY"];

export function ratingAllowed(
  policy: string,
  ctx: { invited: boolean; friends: boolean },
): boolean {
  if (policy === "NOBODY") return false;
  if (policy === "CIRCLE") return ctx.invited || ctx.friends;
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

/**
 * The visibility ladder under identity (decided 2026-08-26).
 *
 * Everyone sees the ratings they received in full detail — the scores, the
 * tags, the comment. What the plan buys is knowing more about the person
 * behind one: Silver adds the relationship it came from ("work colleague"),
 * Gold adds the name. Free sees neither, only "Anonymous".
 *
 * Pure and string-typed like `canSeeRaterIdentity`, and for the same reason:
 * these are asked wherever a rating row renders, and an inline `plan !==`
 * check in one of those places drifting is how a Free member quietly starts
 * reading relationships they did not pay to see.
 */
export function canSeeRatingContext(viewerPlan: string): boolean {
  return viewerPlan === "SILVER" || viewerPlan === "GOLD";
}

/**
 * May this viewer open a message thread to an anonymous rater?
 *
 * Silver and up. The thread stays anonymous either way — `anonymousSide` is
 * sealed by `canSeeRaterIdentity` when the conversation is created — this
 * rule only decides who gets the door at all. It is enforced server-side in
 * `openRatingThreadAction`; the button the page shows must agree with it,
 * which is why both read the same function.
 */
export function canMessageRater(viewerPlan: string): boolean {
  return viewerPlan === "SILVER" || viewerPlan === "GOLD";
}

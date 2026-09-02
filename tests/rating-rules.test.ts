import { describe, expect, it } from "vitest";
import {
  canMessageRater,
  canSeeRaterIdentity,
  canSeeRatingContext,
  ratingAllowed,
  RATING_POLICIES,
  cooldownDaysLeft,
  nextUpdateDate,
} from "@/lib/rating-rules";
import { RATING_UPDATE_COOLDOWN_DAYS } from "@/lib/taxonomy";

const DAY = 86_400_000;

/**
 * §8 — one revision per 30 days.
 *
 * The cooldown is what stops a rating from becoming a running argument. It is
 * also invisible: nothing on screen goes wrong if it quietly stops applying,
 * which is exactly why it needs a test.
 */
describe("update cooldown", () => {
  it("lets a rating that has never been updated through", () => {
    expect(cooldownDaysLeft(null)).toBe(0);
  });

  it("locks a rating updated just now", () => {
    expect(cooldownDaysLeft(new Date())).toBe(RATING_UPDATE_COOLDOWN_DAYS);
  });

  it("counts down as the window passes", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * DAY);
    expect(cooldownDaysLeft(tenDaysAgo)).toBe(RATING_UPDATE_COOLDOWN_DAYS - 10);
  });

  it("opens again exactly at the boundary", () => {
    const exactly = new Date(Date.now() - RATING_UPDATE_COOLDOWN_DAYS * DAY);
    expect(cooldownDaysLeft(exactly)).toBe(0);
  });

  it("stays open once the window is long past", () => {
    const ages = new Date(Date.now() - 400 * DAY);
    expect(cooldownDaysLeft(ages)).toBe(0);
  });

  it("reports when the next update is due", () => {
    const at = new Date("2026-01-01T00:00:00Z");
    expect(nextUpdateDate(at)?.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(nextUpdateDate(null)).toBeNull();
  });
});

/**
 * §15 — who may see who rated them.
 *
 * This one has already been broken once: the message thread told a Gold member
 * "anonymous rater" about someone whose name they were reading on the previous
 * screen. Both overrides outrank the plan, always.
 */
describe("rater identity visibility", () => {
  const plain = { isProtected: false, hideIdentity: false };

  it("is hidden on Free and Silver", () => {
    expect(canSeeRaterIdentity("FREE", plain)).toBe(false);
    expect(canSeeRaterIdentity("SILVER", plain)).toBe(false);
  });

  it("is visible on Gold for an ordinary rating", () => {
    expect(canSeeRaterIdentity("GOLD", plain)).toBe(true);
  });

  // The self-hide option is gone from the rate flow, but ratings written
  // while it existed keep the promise they were written under.
  it("stays hidden on Gold for a legacy self-hidden rating", () => {
    expect(
      canSeeRaterIdentity("GOLD", { isProtected: false, hideIdentity: true }),
    ).toBe(false);
  });

  it("stays hidden on Gold when the detector protected the rating", () => {
    expect(
      canSeeRaterIdentity("GOLD", { isProtected: true, hideIdentity: false }),
    ).toBe(false);
  });
});

/**
 * Who may rate me at all (decided 2026-09-02, after App Review 1.2).
 *
 * The rated person's door: open, my circle, or closed. This used to close
 * only the written note while anyone could still score; now it closes the
 * whole rating. Like the other two rules it breaks silently — a paused
 * profile that still receives ratings looks perfectly normal on screen —
 * so the values and the fallback are pinned here.
 */
describe("who may rate me", () => {
  const nobody = { invited: false, friends: false };
  const circle = { invited: true, friends: false };

  it("is open to everyone by default", () => {
    expect(ratingAllowed("EVERYONE", nobody)).toBe(true);
  });

  it("lets either half of the circle through in CIRCLE mode", () => {
    expect(ratingAllowed("CIRCLE", nobody)).toBe(false);
    expect(ratingAllowed("CIRCLE", circle)).toBe(true);
    expect(ratingAllowed("CIRCLE", { invited: false, friends: true })).toBe(true);
  });

  it("closes the door to everyone in NOBODY mode — the circle included", () => {
    expect(ratingAllowed("NOBODY", nobody)).toBe(false);
    expect(ratingAllowed("NOBODY", circle)).toBe(false);
    expect(ratingAllowed("NOBODY", { invited: true, friends: true })).toBe(false);
  });

  // Pre-merge spellings. Rows are migrated, but a stray value must still
  // deny the way its owner meant, not fall open.
  it("honours the legacy INVITED and FRIENDS values", () => {
    expect(ratingAllowed("INVITED", circle)).toBe(true);
    expect(ratingAllowed("INVITED", { invited: false, friends: true })).toBe(false);
    expect(ratingAllowed("FRIENDS", { invited: false, friends: true })).toBe(true);
    expect(ratingAllowed("FRIENDS", nobody)).toBe(false);
  });

  it("falls back to open on an unknown value rather than locking a profile", () => {
    expect(ratingAllowed("WHATEVER", nobody)).toBe(true);
  });

  // The settings screen offers exactly these; the action accepts exactly
  // these. A fourth value in one place and not the other is a silent no-op.
  it("offers exactly the three doors", () => {
    expect([...RATING_POLICIES]).toEqual(["EVERYONE", "CIRCLE", "NOBODY"]);
  });
});

/**
 * The ladder under identity (decided 2026-08-26).
 *
 * Everyone reads the ratings they received in full detail; the plans buy
 * knowledge about the person behind one. Silver adds the relationship and
 * the right to message the anonymous rater; Gold adds the name (§15 above).
 * Like anonymity itself, this breaks silently — a Free member shown a
 * relationship line looks perfectly normal on screen — so the rules live in
 * one place and are pinned here.
 */
describe("what each plan knows about a rating's author", () => {
  it("hides the relationship from Free", () => {
    expect(canSeeRatingContext("FREE")).toBe(false);
  });

  it("shows the relationship from Silver up", () => {
    expect(canSeeRatingContext("SILVER")).toBe(true);
    expect(canSeeRatingContext("GOLD")).toBe(true);
  });

  it("reserves messaging the anonymous rater for Silver and Gold", () => {
    expect(canMessageRater("FREE")).toBe(false);
    expect(canMessageRater("SILVER")).toBe(true);
    expect(canMessageRater("GOLD")).toBe(true);
  });

  it("treats an unknown plan value as Free", () => {
    expect(canSeeRatingContext("")).toBe(false);
    expect(canMessageRater("PLATINUM")).toBe(false);
  });
});

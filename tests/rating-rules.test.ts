import { describe, expect, it } from "vitest";
import { canSeeRaterIdentity, commentAllowed, cooldownDaysLeft, nextUpdateDate } from "@/lib/rating-rules";
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

describe("who may write a note", () => {
  const nobody = { invited: false, friends: false };

  it("is open to everyone by default", () => {
    expect(commentAllowed("EVERYONE", nobody)).toBe(true);
  });

  it("lets either half of the circle through in CIRCLE mode", () => {
    expect(commentAllowed("CIRCLE", nobody)).toBe(false);
    expect(commentAllowed("CIRCLE", { invited: true, friends: false })).toBe(true);
    expect(commentAllowed("CIRCLE", { invited: false, friends: true })).toBe(true);
  });

  // Pre-merge spellings. Rows are migrated, but a stray value must still
  // deny the way its owner meant, not fall open.
  it("honours the legacy INVITED and FRIENDS values", () => {
    expect(commentAllowed("INVITED", { invited: true, friends: false })).toBe(true);
    expect(commentAllowed("INVITED", { invited: false, friends: true })).toBe(false);
    expect(commentAllowed("FRIENDS", { invited: false, friends: true })).toBe(true);
    expect(commentAllowed("FRIENDS", nobody)).toBe(false);
  });

  it("falls back to open on an unknown value rather than locking a profile", () => {
    expect(commentAllowed("WHATEVER", nobody)).toBe(true);
  });
});

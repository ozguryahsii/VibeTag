import { describe, expect, it } from "vitest";
import { canSeeRaterIdentity, cooldownDaysLeft, nextUpdateDate } from "@/lib/rating-rules";
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

  it("stays hidden on Gold when the rater asked to be hidden", () => {
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

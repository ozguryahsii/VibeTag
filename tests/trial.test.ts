import { describe, expect, it } from "vitest";
import {
  TRIAL_PLANS,
  canStartTrial,
  trialStateFor,
  trialWriteFor,
} from "@/lib/trial";

const NOW = new Date("2026-08-25T12:00:00Z");
const EARLIER = new Date("2026-07-01T09:00:00Z");

const fresh = { trialConsumedAt: null, trialPlan: null };
const usedOnSilver = { trialConsumedAt: EARLIER, trialPlan: "SILVER" };
const usedOnGold = { trialConsumedAt: EARLIER, trialPlan: "GOLD" };

/**
 * One trial per person, ever — not one per plan.
 *
 * The whole rule is here because it is worth exactly one free week to break
 * it, and nothing on screen looks wrong when it stops holding: a second
 * "first week free" badge is indistinguishable from the first.
 */
describe("trial eligibility", () => {
  it("offers the trial to somebody who has never used one", () => {
    expect(canStartTrial(fresh)).toBe(true);
    expect(trialStateFor(fresh, "SILVER")).toEqual({ kind: "OFFER" });
    expect(trialStateFor(fresh, "GOLD")).toEqual({ kind: "OFFER" });
  });

  it("refuses the other plan once a trial was spent", () => {
    // The point of the rule: a week of Silver then a week of Gold is two
    // free weeks, and Gold must not still be advertising one.
    expect(canStartTrial(usedOnSilver)).toBe(false);
    expect(trialStateFor(usedOnSilver, "GOLD")).toEqual({
      kind: "SPENT",
      spentOn: "SILVER",
    });
    expect(trialStateFor(usedOnGold, "SILVER")).toEqual({
      kind: "SPENT",
      spentOn: "GOLD",
    });
  });

  it("refuses the same plan a second time too", () => {
    expect(trialStateFor(usedOnSilver, "SILVER")).toEqual({
      kind: "SPENT",
      spentOn: "SILVER",
    });
  });

  it("has nothing to say about Free, either way", () => {
    expect(trialStateFor(fresh, "FREE")).toEqual({ kind: "NONE" });
    expect(trialStateFor(usedOnGold, "FREE")).toEqual({ kind: "NONE" });
    expect(TRIAL_PLANS).not.toContain("FREE");
  });
});

describe("recording a trial from a store", () => {
  it("spends it the first time a store reports one", () => {
    expect(trialWriteFor({ inTrial: true }, "SILVER", fresh, NOW)).toEqual({
      trialConsumedAt: NOW,
      trialPlan: "SILVER",
    });
  });

  it("writes nothing for an ordinary paid subscription", () => {
    expect(trialWriteFor({ inTrial: false }, "GOLD", fresh, NOW)).toBeNull();
  });

  /*
   * A trial is reported more than once in normal operation — the verify
   * endpoint sees it, then a webhook re-reports it, then a renewal sync runs.
   * If any of those moved the date, eligibility would refresh on every
   * re-sync and the rule would hold for nobody.
   */
  it("never moves a date that is already set", () => {
    expect(trialWriteFor({ inTrial: true }, "SILVER", usedOnSilver, NOW)).toBeNull();
    expect(trialWriteFor({ inTrial: true }, "GOLD", usedOnSilver, NOW)).toBeNull();
  });
});

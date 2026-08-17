import { describe, expect, it } from "vitest";
import {
  VERIFICATIONS,
  verificationCount,
  verificationState,
} from "@/lib/verification";
import { LIMITS } from "@/lib/limits";

const nobody = {
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  idVerifiedAt: null,
};

describe("verification badges", () => {
  it("offers three methods, one of which works today", () => {
    expect(VERIFICATIONS).toHaveLength(3);
    expect(VERIFICATIONS.filter((v) => v.available).map((v) => v.key)).toEqual([
      "email",
    ]);
  });

  it("gives an unverified account nothing", () => {
    expect(verificationState(nobody).every((v) => !v.earned)).toBe(true);
    expect(verificationCount(nobody)).toEqual({ held: 0, offered: 1 });
  });

  it("marks only the method that was actually passed", () => {
    const at = new Date("2026-08-17T10:00:00Z");
    const state = verificationState({ ...nobody, emailVerifiedAt: at });
    expect(state.find((v) => v.key === "email")).toMatchObject({
      earned: true,
      at,
    });
    expect(state.find((v) => v.key === "phone")?.earned).toBe(false);
    expect(state.find((v) => v.key === "identity")?.earned).toBe(false);
  });

  it("never claims a method nobody can use is merely unearned", () => {
    // Phone and identity have no provider behind them. Showing them as
    // "not yet" rather than "coming soon" would blame the person for a door
    // we have not built.
    const state = verificationState(nobody);
    for (const v of state) {
      if (v.key === "email") expect(v.available).toBe(true);
      else expect(v.available).toBe(false);
    }
  });
});

describe("rate limits", () => {
  it("are all bounded and non-trivial", () => {
    // A limit of zero locks everyone out; a window of zero is no limit at all.
    for (const [key, limit] of Object.entries(LIMITS)) {
      expect(limit.max, key).toBeGreaterThan(0);
      expect(limit.windowMs, key).toBeGreaterThanOrEqual(60_000);
    }
  });

  it("make a six-digit code unguessable within one window", () => {
    // A million codes and twelve tries per quarter hour: the code expires
    // long before brute force is worth starting.
    expect(LIMITS.otpCheck.max).toBeLessThan(50);
  });

  it("keep sending codes more expensive than checking them", () => {
    // Every send costs an email. Checking one costs a database read.
    expect(LIMITS.otpSend.max).toBeLessThanOrEqual(LIMITS.otpCheck.max);
  });
});

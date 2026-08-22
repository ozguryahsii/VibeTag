import { describe, expect, it } from "vitest";
import {
  VERIFICATIONS,
  verificationCount,
  verificationState,
} from "@/lib/verification";
import { LIMITS, resendGapSeconds } from "@/lib/limits";
import {
  canAddPhoto,
  mainPhotoId,
  photoLimit,
  sidePhotos,
} from "@/lib/photos";

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

describe("otp resend schedule", () => {
  it("lets the first send through immediately", () => {
    expect(resendGapSeconds(0)).toBe(0);
  });

  it("asks for a minute after the first, five after the second", () => {
    expect(resendGapSeconds(1)).toBe(60);
    expect(resendGapSeconds(2)).toBe(300);
    expect(resendGapSeconds(7)).toBe(300);
  });
});

describe("photo limits", () => {
  const photos = [
    { id: "a", url: "one" },
    { id: "b", url: "two" },
    { id: "c", url: "two" },
    { id: "d", url: "three" },
    { id: "e", url: "four" },
  ];

  it("gives each plan its own number of photos", () => {
    expect(photoLimit("FREE")).toBe(1);
    expect(photoLimit("SILVER")).toBe(4);
    expect(photoLimit("GOLD")).toBe(7);
    // An unknown value must not hand out more than Free.
    expect(photoLimit("PLATINUM")).toBe(1);
  });

  it("counts the vault against the plan", () => {
    expect(canAddPhoto(0, "FREE")).toBe(true);
    expect(canAddPhoto(1, "FREE")).toBe(false);
    expect(canAddPhoto(3, "SILVER")).toBe(true);
    expect(canAddPhoto(4, "SILVER")).toBe(false);
  });

  it("shows everything but the profile picture beside it", () => {
    expect(sidePhotos(photos, "one", "GOLD").map((p) => p.id)).toEqual([
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  // Two identical uploads share a URL; only the first is the profile
  // picture, and its twin still earns a circle.
  it("picks one row as the profile picture even when two look alike", () => {
    expect(mainPhotoId(photos, "two")).toBe("b");
    expect(sidePhotos(photos, "two", "GOLD").map((p) => p.id)).toEqual([
      "a",
      "c",
      "d",
      "e",
    ]);
  });

  it("stops publishing extras when the plan shrinks, without deleting", () => {
    expect(sidePhotos(photos, "one", "SILVER")).toHaveLength(3);
    expect(sidePhotos(photos, "one", "FREE")).toHaveLength(0);
  });
});

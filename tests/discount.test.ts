import { describe, expect, it } from "vitest";
import {
  checkRedeem,
  codeState,
  grantUntil,
  normalizeCode,
  suggestCode,
  type CodeRow,
} from "@/lib/discount";

const NOW = new Date("2026-08-18T12:00:00Z");
const DAY = 86_400_000;

function code(over: Partial<CodeRow> = {}): CodeRow {
  return {
    plan: "GOLD",
    days: null,
    maxUses: null,
    expiresAt: null,
    active: true,
    ...over,
  };
}

const free = { plan: "FREE", planUntil: null };

describe("code spelling", () => {
  it("has one canonical form per code", () => {
    expect(normalizeCode(" vibe 10 ")).toBe("VIBE10");
    expect(normalizeCode("summer-25")).toBe("SUMMER-25");
  });

  it("suggests codes without characters that get misread", () => {
    const generated = suggestCode(
      Uint8Array.from({ length: 12 }, (_, i) => i * 7 + 3),
    );
    expect(generated).toHaveLength(8);
    expect(generated).not.toMatch(/[O0I1]/);
    expect(generated).toMatch(/^[A-Z0-9]+$/);
  });
});

describe("code state", () => {
  it("is active when nothing stops it", () => {
    expect(codeState(code(), 0, NOW)).toBe("ACTIVE");
  });

  it("reports why it is not usable", () => {
    expect(codeState(code({ active: false }), 0, NOW)).toBe("OFF");
    expect(
      codeState(code({ expiresAt: new Date(NOW.getTime() - DAY) }), 0, NOW),
    ).toBe("EXPIRED");
    expect(codeState(code({ maxUses: 3 }), 3, NOW)).toBe("USED_UP");
  });

  it("counts the last allowed use as still allowed", () => {
    expect(codeState(code({ maxUses: 3 }), 2, NOW)).toBe("ACTIVE");
  });
});

describe("redeeming", () => {
  it("grants the plan on the code", () => {
    const result = checkRedeem(code({ days: 30 }), 0, false, free, NOW);
    expect(result).toEqual({
      ok: true,
      plan: "GOLD",
      until: new Date(NOW.getTime() + 30 * DAY),
    });
  });

  it("refuses an unknown code", () => {
    expect(checkRedeem(null, 0, false, free, NOW)).toEqual({
      ok: false,
      reason: "UNKNOWN",
    });
  });

  it("refuses a second use by the same person", () => {
    expect(checkRedeem(code(), 1, true, free, NOW)).toEqual({
      ok: false,
      reason: "ALREADY",
    });
  });

  it("passes the state through as the reason", () => {
    expect(checkRedeem(code({ active: false }), 0, false, free, NOW)).toEqual({
      ok: false,
      reason: "OFF",
    });
    expect(checkRedeem(code({ maxUses: 1 }), 1, false, free, NOW)).toEqual({
      ok: false,
      reason: "USED_UP",
    });
  });

  // The rule that matters: a code must never take something away.
  it("never downgrades a better plan", () => {
    const gold = { plan: "GOLD", planUntil: null };
    expect(checkRedeem(code({ plan: "SILVER" }), 0, false, gold, NOW)).toEqual({
      ok: false,
      reason: "NOT_BETTER",
    });
  });

  it("lets the same plan be renewed", () => {
    const silver = { plan: "SILVER", planUntil: new Date(NOW.getTime() + 5 * DAY) };
    const result = checkRedeem(
      code({ plan: "SILVER", days: 30 }),
      0,
      false,
      silver,
      NOW,
    );
    expect(result.ok).toBe(true);
  });
});

describe("when a grant ends", () => {
  it("never expires when the code has no day count", () => {
    expect(grantUntil(null, free, "GOLD", NOW)).toBeNull();
  });

  it("adds to time that is still running on the same plan", () => {
    const gold = { plan: "GOLD", planUntil: new Date(NOW.getTime() + 10 * DAY) };
    expect(grantUntil(30, gold, "GOLD", NOW)).toEqual(
      new Date(NOW.getTime() + 40 * DAY),
    );
  });

  it("starts a fresh clock when the plan changes", () => {
    const silver = { plan: "SILVER", planUntil: new Date(NOW.getTime() + 300 * DAY) };
    expect(grantUntil(30, silver, "GOLD", NOW)).toEqual(
      new Date(NOW.getTime() + 30 * DAY),
    );
  });

  it("ignores expired time rather than subtracting it", () => {
    const lapsed = { plan: "GOLD", planUntil: new Date(NOW.getTime() - 100 * DAY) };
    expect(grantUntil(30, lapsed, "GOLD", NOW)).toEqual(
      new Date(NOW.getTime() + 30 * DAY),
    );
  });

  // A permanent plan is permanent. Redeeming a 30-day renewal code on top of
  // one must not quietly put an end date on it.
  it("leaves a plan that never ends alone", () => {
    const forever = { plan: "GOLD", planUntil: null };
    expect(grantUntil(30, forever, "GOLD", NOW)).toBeNull();
  });
});

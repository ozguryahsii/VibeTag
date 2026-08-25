import { describe, expect, it } from "vitest";
import {
  EMPTY_MEMORY,
  MAX_ASKS,
  QUIET_DAYS,
  afterDismiss,
  parseMemory,
  shouldAsk,
} from "@/lib/push-prompt";

const NOW = Date.parse("2026-08-25T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

/**
 * iOS gives an app one chance to show the permission dialog, ever. Answer it
 * "no" and the app can never raise it again — the person has to find
 * Settings → Vibe Tag → Notifications by themselves, which nobody does.
 *
 * That makes this schedule load-bearing in a way nothing on screen reveals:
 * asking at the wrong moment does not look like a bug, it just quietly costs
 * that person notifications forever.
 */
describe("when to show the soft ask", () => {
  it("asks somebody who has never been asked", () => {
    expect(shouldAsk("prompt", EMPTY_MEMORY, NOW)).toBe(true);
  });

  it("says nothing to somebody who already turned them on", () => {
    expect(shouldAsk("granted", EMPTY_MEMORY, NOW)).toBe(false);
  });

  /*
   * A system-level "don't allow" cannot be undone from inside the app, so the
   * card would be offering something it cannot deliver. Settings carries the
   * explanation instead.
   */
  it("says nothing once iOS itself has been told no", () => {
    expect(shouldAsk("denied", EMPTY_MEMORY, NOW)).toBe(false);
  });

  it("leaves somebody alone for a few days after a 'not now'", () => {
    const memory = afterDismiss(EMPTY_MEMORY, NOW);
    expect(shouldAsk("prompt", memory, NOW)).toBe(false);
    expect(shouldAsk("prompt", memory, NOW + DAY)).toBe(false);
    expect(shouldAsk("prompt", memory, NOW + QUIET_DAYS * DAY)).toBe(true);
  });

  /*
   * Two refusals is an answer. Asking a third time is nagging, and nagging is
   * how a soft ask turns into the hard "no" it exists to avoid.
   */
  it("stops asking after the second refusal", () => {
    let memory = afterDismiss(EMPTY_MEMORY, NOW);
    memory = afterDismiss(memory, NOW + QUIET_DAYS * DAY);
    expect(memory.dismissals).toBe(MAX_ASKS);
    expect(shouldAsk("prompt", memory, NOW + 365 * DAY)).toBe(false);
  });
});

describe("remembering across launches", () => {
  it("treats a missing value as never asked", () => {
    expect(parseMemory(null)).toEqual(EMPTY_MEMORY);
  });

  it("round-trips what it wrote", () => {
    const memory = afterDismiss(EMPTY_MEMORY, NOW);
    expect(parseMemory(JSON.stringify(memory))).toEqual(memory);
  });

  /*
   * A corrupt value must not silence the prompt forever, and must not crash
   * the screen it sits on. Both failures are silent: one person simply never
   * gets asked again, and nobody finds out.
   */
  it("falls back to never-asked on anything unreadable", () => {
    expect(parseMemory("{{{")).toEqual(EMPTY_MEMORY);
    expect(parseMemory("null")).toEqual(EMPTY_MEMORY);
    expect(parseMemory('{"dismissals":"lots"}')).toEqual(EMPTY_MEMORY);
    expect(parseMemory('{"dismissals":-4,"lastDismissedAt":0}')).toEqual(
      EMPTY_MEMORY,
    );
  });
});

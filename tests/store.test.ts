import { describe, expect, it } from "vitest";
import {
  STORE_PRODUCTS,
  entitlementStatus,
  planForProduct,
  planWriteFor,
  productForPlan,
  PURCHASABLE,
} from "@/lib/store-products";

const NOW = new Date("2026-08-20T12:00:00Z");
const DAY = 86_400_000;
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY);

const free = { plan: "FREE", planUntil: null };

describe("products", () => {
  it("covers both paid plans on both cadences", () => {
    expect(Object.values(STORE_PRODUCTS).sort()).toEqual([
      "GOLD",
      "GOLD",
      "SILVER",
      "SILVER",
    ]);
  });

  it("grants nothing for a product we never defined", () => {
    expect(planForProduct("net.vibetag.platinum.monthly")).toBeNull();
  });
});

describe("an active subscription", () => {
  const gold = (expiresAt: Date) => ({
    active: true,
    expiresAt,
    productId: "net.vibetag.gold.monthly",
  });

  it("grants its plan until its expiry", () => {
    expect(planWriteFor(gold(inDays(30)), free, NOW)).toEqual({
      plan: "GOLD",
      planUntil: inDays(30),
    });
  });

  it("never downgrades a higher plan", () => {
    const boughtSilver = {
      active: true,
      expiresAt: inDays(30),
      productId: "net.vibetag.silver.monthly",
    };
    expect(
      planWriteFor(boughtSilver, { plan: "GOLD", planUntil: null }, NOW),
    ).toBeNull();
  });

  it("never puts an end date on a permanent grant of the same plan", () => {
    expect(
      planWriteFor(gold(inDays(30)), { plan: "GOLD", planUntil: null }, NOW),
    ).toBeNull();
  });

  it("writes nothing for an unknown product", () => {
    const ent = { active: true, expiresAt: inDays(30), productId: "nope" };
    expect(planWriteFor(ent, free, NOW)).toBeNull();
  });
});

describe("a dead subscription", () => {
  const deadGold = {
    active: false,
    expiresAt: inDays(-1),
    productId: "net.vibetag.gold.monthly",
  };

  it("takes back the plan it granted", () => {
    expect(
      planWriteFor(deadGold, { plan: "GOLD", planUntil: inDays(-1) }, NOW),
    ).toEqual({ plan: "FREE", planUntil: null });
  });

  it("does not touch a different plan", () => {
    expect(
      planWriteFor(deadGold, { plan: "SILVER", planUntil: inDays(10) }, NOW),
    ).toBeNull();
  });

  // The two grants an admin or a code made, which a store must not undo.
  it("does not touch a permanent grant", () => {
    expect(
      planWriteFor(deadGold, { plan: "GOLD", planUntil: null }, NOW),
    ).toBeNull();
  });

  it("does not shorten a grant that outlives it", () => {
    expect(
      planWriteFor(deadGold, { plan: "GOLD", planUntil: inDays(20) }, NOW),
    ).toBeNull();
  });
});

describe("status recording", () => {
  it("splits lapsed from refunded by the paid-up date", () => {
    expect(entitlementStatus({ active: true, expiresAt: inDays(30) }, NOW)).toBe(
      "ACTIVE",
    );
    expect(entitlementStatus({ active: false, expiresAt: inDays(-1) }, NOW)).toBe(
      "EXPIRED",
    );
    // Died while still paid up: money went back, access goes with it.
    expect(entitlementStatus({ active: false, expiresAt: inDays(20) }, NOW)).toBe(
      "REVOKED",
    );
  });
});

/**
 * What a purchase button is allowed to buy.
 *
 * Not derived from STORE_PRODUCTS on purpose: SILVER maps to two product ids
 * there and only one of them is for sale. A button wired to the wrong id
 * fails at the store with a message nobody can act on, and a button wired to
 * a plan with nothing to sell is a button that does nothing at all.
 */
describe("what the app offers for sale", () => {
  it("sells the monthly subscription for each paid plan", () => {
    expect(productForPlan("SILVER")).toBe("net.vibetag.silver.monthly");
    expect(productForPlan("GOLD")).toBe("net.vibetag.gold.monthly");
  });

  it("has nothing to sell for Free", () => {
    expect(productForPlan("FREE")).toBeNull();
    expect(productForPlan("NONSENSE")).toBeNull();
  });

  /*
   * Yearly ids stay in STORE_PRODUCTS so a yearly subscription bought later
   * still grants its plan — but no yearly price has been decided, so nothing
   * may offer one yet.
   */
  it("offers nothing yearly while no yearly price exists", () => {
    for (const id of Object.values(PURCHASABLE)) {
      expect(id).not.toContain("yearly");
    }
  });

  it("only ever offers ids the server already knows how to honour", () => {
    for (const id of Object.values(PURCHASABLE)) {
      expect(planForProduct(id!)).not.toBeNull();
    }
  });
});

import type { Plan } from "@/lib/auth";

/**
 * What the stores sell, and what an active subscription is allowed to do to
 * a plan.
 *
 * Pure on purpose, like `discount.ts`: these rules decide who has Gold, and
 * a wrong branch here hands it out or takes it away silently. The store API
 * clients live elsewhere — this file must stay importable from a test.
 *
 * Product ids are the contract with App Store Connect and the Play Console:
 * the subscriptions created there must use exactly these ids, on both
 * platforms, or `planForProduct` returns null and the purchase grants
 * nothing. Adding a product means adding a line here first.
 */

export const STORE_PRODUCTS: Record<string, Plan> = {
  "net.vibetag.silver.monthly": "SILVER",
  "net.vibetag.silver.yearly": "SILVER",
  "net.vibetag.gold.monthly": "GOLD",
  "net.vibetag.gold.yearly": "GOLD",
};

export function planForProduct(productId: string): Plan | null {
  return STORE_PRODUCTS[productId] ?? null;
}

export type StorePlatform = "APPLE" | "GOOGLE";

/** What a store's server API told us about one subscription, normalised. */
export type Entitlement = {
  platform: StorePlatform;
  productId: string;
  /// Apple's originalTransactionId / Google's purchaseToken.
  storeRef: string;
  active: boolean;
  expiresAt: Date | null;
  environment: string;
};

const RANK: Record<string, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

export type PlanWrite = { plan: Plan; planUntil: Date | null };

/**
 * What an entitlement may write onto a user's plan. Null means "touch
 * nothing".
 *
 * Same first principle as discount codes — a purchase must never make
 * things worse:
 *
 * - An active subscription sets its plan and expiry, but never downgrades a
 *   higher plan (an admin-granted Gold outranks a bought Silver) and never
 *   puts an end date on a permanent grant of the same plan.
 * - A dead subscription (expired, refunded) only takes the plan away when
 *   the plan is plausibly *its own*: same plan, and the user is not on a
 *   permanent grant. An admin's "Gold, no end date" survives any refund.
 */
export function planWriteFor(
  ent: { active: boolean; expiresAt: Date | null; productId: string },
  current: { plan: string; planUntil: Date | null },
  now: Date,
): PlanWrite | null {
  const plan = planForProduct(ent.productId);
  if (!plan) return null;

  if (ent.active) {
    if ((RANK[plan] ?? 0) < (RANK[current.plan] ?? 0)) return null;
    if (current.plan === plan && current.planUntil === null) return null;
    return { plan, planUntil: ent.expiresAt };
  }

  // The subscription is over. Only claw back what it granted.
  if (current.plan !== plan) return null;
  if (current.planUntil === null) return null;
  if (current.planUntil.getTime() > now.getTime() && ent.expiresAt !== null) {
    // The user's plan already outlives this subscription — a code or an
    // admin extended it. The store has no claim on that extra time.
    if (current.planUntil.getTime() > ent.expiresAt.getTime()) return null;
  }
  return { plan: "FREE", planUntil: null };
}

/** ACTIVE | EXPIRED | REVOKED — what lands in StorePurchase.status. */
export function entitlementStatus(
  ent: { active: boolean; expiresAt: Date | null },
  now: Date,
): "ACTIVE" | "EXPIRED" | "REVOKED" {
  if (ent.active) return "ACTIVE";
  // A subscription that died before its paid-up date was refunded/revoked;
  // one that ran past it simply lapsed.
  if (ent.expiresAt && ent.expiresAt.getTime() > now.getTime()) return "REVOKED";
  return "EXPIRED";
}

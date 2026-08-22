import type { Plan } from "@/lib/auth";

/**
 * How many pictures a plan may keep, and how many of them ride beside the
 * main photo on the profile.
 *
 * Pure, so the rules can be tested and so both the server action and the
 * screens read the same numbers. The vault is the same size for everyone —
 * ten — because storage is not the thing being sold; what a plan buys is how
 * many of those the world gets to see.
 */

export const VAULT_SIZE = 10;

export const SHOWCASE_LIMIT: Record<Plan, number> = {
  FREE: 0,
  SILVER: 3,
  GOLD: 6,
};

export function showcaseLimit(plan: string): number {
  return SHOWCASE_LIMIT[plan as Plan] ?? 0;
}

/**
 * Trim a showcase selection to what the plan allows.
 *
 * A downgrade must not silently publish more than the new plan permits, and
 * it must not delete anything either: the extra pictures stay in the vault,
 * they simply stop being shown. Order is kept, so the ones dropped are the
 * ones furthest right — the same ones the owner put last.
 */
export function allowedShowcase<T>(chosen: T[], plan: string): T[] {
  return chosen.slice(0, showcaseLimit(plan));
}

export function canAddToVault(count: number): boolean {
  return count < VAULT_SIZE;
}

import type { Plan } from "@/lib/auth";

/**
 * Discount code rules.
 *
 * Deliberately pure: no Prisma, no `server-only`. A code is a small pile of
 * conditions — switched off, out of uses, past its date — and getting one of
 * them wrong hands somebody Gold they should not have. That is a thing to
 * test directly rather than through a server action.
 */

export const CODE_PLANS: Plan[] = ["SILVER", "GOLD"];

/**
 * One canonical spelling per code.
 *
 * Upper-cased and stripped of spaces, so a code read off a slide and typed
 * back in with a stray space still lands. Dashes are kept — `SUMMER-25` is a
 * different code from `SUMMER25` only if we let it be, and admins expect the
 * dash they typed to survive.
 */
export function normalizeCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

/** Codes are read aloud and typed by hand, so no O/0, I/1 or similar. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function suggestCode(bytes: Uint8Array, length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i % bytes.length] % ALPHABET.length];
  }
  return out;
}

export type CodeRow = {
  plan: string;
  days: number | null;
  maxUses: number | null;
  expiresAt: Date | null;
  active: boolean;
};

export type CodeState = "ACTIVE" | "OFF" | "EXPIRED" | "USED_UP";

export function codeState(code: CodeRow, uses: number, now: Date): CodeState {
  if (!code.active) return "OFF";
  if (code.expiresAt && code.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  if (code.maxUses !== null && uses >= code.maxUses) return "USED_UP";
  return "ACTIVE";
}

export type RedeemError = "UNKNOWN" | "OFF" | "EXPIRED" | "USED_UP" | "ALREADY" | "NOT_BETTER";

export type RedeemCheck =
  | { ok: true; plan: Plan; until: Date | null }
  | { ok: false; reason: RedeemError };

const RANK: Record<string, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

/**
 * Can this person use this code, and what would it give them?
 *
 * The last rule is the interesting one: a Gold member redeeming a Silver code
 * must not be quietly downgraded. Redeeming the *same* plan is allowed and
 * extends it — that is how a renewal code is meant to work.
 */
export function checkRedeem(
  code: CodeRow | null,
  uses: number,
  alreadyRedeemed: boolean,
  current: { plan: string; planUntil: Date | null },
  now: Date,
): RedeemCheck {
  if (!code) return { ok: false, reason: "UNKNOWN" };

  const state = codeState(code, uses, now);
  if (state !== "ACTIVE") return { ok: false, reason: state };
  if (alreadyRedeemed) return { ok: false, reason: "ALREADY" };

  const plan = code.plan as Plan;
  if ((RANK[plan] ?? 0) < (RANK[current.plan] ?? 0)) {
    return { ok: false, reason: "NOT_BETTER" };
  }

  return { ok: true, plan, until: grantUntil(code.days, current, plan, now) };
}

/**
 * When the granted plan should run out.
 *
 * Extending from the existing expiry rather than from today, but only when
 * the plan is the same one — 30 days added to a Silver that has a week left
 * should not shorten anything, and upgrading Silver → Gold starts its own
 * clock rather than inheriting the Silver deadline.
 */
export function grantUntil(
  days: number | null,
  current: { plan: string; planUntil: Date | null },
  plan: Plan,
  now: Date,
): Date | null {
  if (days === null) return null;

  // Somebody who already has this plan forever must not be put on a clock by
  // redeeming a 30-day code for it. A grant can only ever add time.
  if (current.plan === plan && current.planUntil === null && plan !== "FREE") {
    return null;
  }

  const sameAndRunning =
    current.plan === plan &&
    current.planUntil !== null &&
    current.planUntil.getTime() > now.getTime();
  const from = sameAndRunning ? current.planUntil! : now;
  return new Date(from.getTime() + days * 86_400_000);
}

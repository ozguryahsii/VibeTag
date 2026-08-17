/**
 * How much of each guarded action is allowed, and over what window.
 *
 * Kept apart from the enforcement in `rate-limit.ts`, which is server-only and
 * pulls in Prisma. The numbers are a policy decision worth reading — and worth
 * testing — without a database anywhere near them.
 */
export const LIMITS = {
  /** Sign-in attempts. Generous enough for a person mistyping a password. */
  login: { max: 10, windowMs: 10 * 60_000 },
  /** New accounts. */
  register: { max: 5, windowMs: 60 * 60_000 },
  /** Codes sent. The expensive one — every hit is an email we pay for. */
  otpSend: { max: 5, windowMs: 60 * 60_000 },
  /** Codes checked. Six digits is a million guesses; this makes them useless. */
  otpCheck: { max: 12, windowMs: 15 * 60_000 },
} as const;

export type LimitKey = keyof typeof LIMITS;

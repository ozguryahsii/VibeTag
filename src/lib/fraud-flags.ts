/**
 * The fake-rating detector's vocabulary.
 *
 * Split out from `fraud.ts` because that module is server-only — it talks to
 * the database — while the flag list and the reader for a stored value are
 * plain data anyone can use, tests included.
 *
 * Labels are not here: they live in `d.fraudFlags`, so a moderator reads them
 * in their own language.
 */
export const FRAUD_FLAGS = {
  NEW_ACCOUNT: { key: "NEW_ACCOUNT", penalty: 0.6 },
  NO_REPUTATION: { key: "NO_REPUTATION", penalty: 0.85 },
  BURST: { key: "BURST", penalty: 0.5 },
  MUTUAL_MAX: { key: "MUTUAL_MAX", penalty: 0.55 },
  FLAT_PATTERN: { key: "FLAT_PATTERN", penalty: 0.7 },
} as const;

export type FraudFlagKey = keyof typeof FRAUD_FLAGS;

/** Flag keys stored on a rating, ignoring anything unrecognised. */
export function parseFlags(json: string): FraudFlagKey[] {
  try {
    const keys = JSON.parse(json) as unknown;
    if (!Array.isArray(keys)) return [];
    return keys.filter(
      (k): k is FraudFlagKey => typeof k === "string" && k in FRAUD_FLAGS,
    );
  } catch {
    return [];
  }
}

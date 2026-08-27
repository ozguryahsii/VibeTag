/**
 * Store reviewers' fixed-OTP accounts.
 *
 * Apple and Google review with demo credentials from the submission forms,
 * and they cannot open our mailboxes — a mandatory emailed OTP is an
 * automatic rejection. So a handful of accounts, named by env, may also
 * pass any OTP prompt with a static code that ships in the review notes.
 *
 * Two slots, not a parsed list: the first is Apple's (`REVIEW_ACCOUNT_*`,
 * in production since the App Store submission — its names must never
 * change while a review is running), the second (`*_2`) was added for
 * Google Play, whose reviewer needs a separate premium account so the
 * Apple one can stay Free and keep its purchase flow testable.
 *
 * Pure and env-free so the matching rules — which are security rules —
 * can be tested: `otp.ts` supplies the env and the database.
 */

export type ReviewAccount = { email: string; otp: string };

/**
 * The configured review accounts; unset or malformed slots drop out.
 * Typed as a plain record so `process.env` — whose type is only an index
 * signature — passes straight through.
 */
export function parseReviewAccounts(
  env: Record<string, string | undefined>,
): ReviewAccount[] {
  const slots: Array<[string | undefined, string | undefined]> = [
    [env.REVIEW_ACCOUNT_EMAIL, env.REVIEW_ACCOUNT_OTP],
    [env.REVIEW_ACCOUNT_EMAIL_2, env.REVIEW_ACCOUNT_OTP_2],
  ];
  const accounts: ReviewAccount[] = [];
  for (const [rawEmail, rawOtp] of slots) {
    const email = rawEmail?.trim().toLowerCase();
    const otp = rawOtp?.trim();
    // A short code would be guessable inside the attempt limit; refusing it
    // here means a truncated env value disables the bypass instead of
    // weakening it.
    if (email && otp && otp.length >= 6) accounts.push({ email, otp });
  }
  return accounts;
}

/** May this email pass an OTP prompt with this code? */
export function reviewOtpMatches(
  accounts: ReviewAccount[],
  email: string,
  code: string,
): boolean {
  const digits = code.replace(/\D/g, "");
  const needle = email.trim().toLowerCase();
  return accounts.some((a) => a.email === needle && a.otp === digits);
}

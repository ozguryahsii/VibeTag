import { describe, expect, it } from "vitest";
import { parseReviewAccounts, reviewOtpMatches } from "@/lib/review-access";

/**
 * The fixed-OTP bypass is a deliberate hole in the login's second factor,
 * cut for exactly the accounts named in env. Every rule here is a security
 * rule: which slots count, what a malformed slot does, and that a code
 * never unlocks anyone else's account.
 */
describe("reading the review accounts from env", () => {
  it("returns nothing when nothing is configured", () => {
    expect(parseReviewAccounts({})).toEqual([]);
  });

  it("reads both slots independently", () => {
    expect(
      parseReviewAccounts({
        REVIEW_ACCOUNT_EMAIL: "review@vibetag.net",
        REVIEW_ACCOUNT_OTP: "742916",
        REVIEW_ACCOUNT_EMAIL_2: "apptest2@vibetag.net",
        REVIEW_ACCOUNT_OTP_2: "583427",
      }),
    ).toEqual([
      { email: "review@vibetag.net", otp: "742916" },
      { email: "apptest2@vibetag.net", otp: "583427" },
    ]);
  });

  it("keeps the second slot when only it is set", () => {
    expect(
      parseReviewAccounts({
        REVIEW_ACCOUNT_EMAIL_2: "apptest2@vibetag.net",
        REVIEW_ACCOUNT_OTP_2: "583427",
      }),
    ).toHaveLength(1);
  });

  it("normalises case and whitespace in the email", () => {
    const [account] = parseReviewAccounts({
      REVIEW_ACCOUNT_EMAIL: "  Review@VibeTag.net ",
      REVIEW_ACCOUNT_OTP: "742916",
    });
    expect(account.email).toBe("review@vibetag.net");
  });

  /*
   * A slot missing half its pair, or carrying a code short enough to guess
   * inside the attempt limit, disables that slot rather than weakening it.
   */
  it("drops half-configured or weak slots", () => {
    expect(
      parseReviewAccounts({ REVIEW_ACCOUNT_EMAIL: "review@vibetag.net" }),
    ).toEqual([]);
    expect(
      parseReviewAccounts({ REVIEW_ACCOUNT_OTP: "742916" }),
    ).toEqual([]);
    expect(
      parseReviewAccounts({
        REVIEW_ACCOUNT_EMAIL: "review@vibetag.net",
        REVIEW_ACCOUNT_OTP: "12345",
      }),
    ).toEqual([]);
  });
});

describe("matching a reviewer's code", () => {
  const accounts = parseReviewAccounts({
    REVIEW_ACCOUNT_EMAIL: "review@vibetag.net",
    REVIEW_ACCOUNT_OTP: "742916",
    REVIEW_ACCOUNT_EMAIL_2: "apptest2@vibetag.net",
    REVIEW_ACCOUNT_OTP_2: "583427",
  });

  it("lets each account in with its own code only", () => {
    expect(reviewOtpMatches(accounts, "review@vibetag.net", "742916")).toBe(true);
    expect(reviewOtpMatches(accounts, "apptest2@vibetag.net", "583427")).toBe(true);
    // Codes are per-account, not a shared pool: one leaking must not open
    // the other door.
    expect(reviewOtpMatches(accounts, "review@vibetag.net", "583427")).toBe(false);
    expect(reviewOtpMatches(accounts, "apptest2@vibetag.net", "742916")).toBe(false);
  });

  it("never unlocks an account that is not in the list", () => {
    expect(reviewOtpMatches(accounts, "ozgur@vibetag.net", "742916")).toBe(false);
    expect(reviewOtpMatches(accounts, "", "742916")).toBe(false);
  });

  it("accepts the code however the card formats it", () => {
    expect(reviewOtpMatches(accounts, "Review@VibeTag.net", "742 916")).toBe(true);
  });

  it("rejects a wrong or empty code", () => {
    expect(reviewOtpMatches(accounts, "review@vibetag.net", "000000")).toBe(false);
    expect(reviewOtpMatches(accounts, "review@vibetag.net", "")).toBe(false);
  });
});

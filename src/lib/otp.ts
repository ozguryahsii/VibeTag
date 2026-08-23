import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { resendGapSeconds } from "@/lib/limits";
import { emailConfigured, otpEmail, sendEmail } from "@/lib/email";
import type { Dictionary } from "@/lib/i18n";

/**
 * One-time codes, by email.
 *
 * Six digits, ten minutes, five wrong guesses. The code is stored as a hash —
 * a stolen backup should be a list of useless strings, not a working set of
 * account-takeover tokens.
 *
 * Minting a new code invalidates the outstanding ones for the same purpose.
 * Two live codes means somebody who intercepted the first still has a way in
 * after the owner asks for another.
 */

export const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "REGISTER" | "VERIFY" | "RESET" | "LOGIN";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function newCode(): string {
  // randomInt, not Math.random: this is a credential.
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: "email" };

/**
 * Mint a code and email it.
 *
 * In development without a mail provider the code is printed to the server
 * log so the flow can be walked end to end. That is guarded on NODE_ENV: a
 * production box with a missing key must fail loudly, not quietly write
 * working credentials into a log file anyone with the container can read.
 */
export async function sendOtp(
  user: { id: string; email: string; name: string },
  purpose: OtpPurpose,
  d: Dictionary,
): Promise<SendOutcome> {
  const code = newCode();

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { userId: user.id, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpCode.create({
      data: {
        userId: user.id,
        purpose,
        email: user.email,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);

  const copy =
    purpose === "RESET"
      ? d.otp.resetMail
      : purpose === "LOGIN"
        ? d.otp.loginMail
        : d.otp.verifyMail;
  const mail = otpEmail(code, {
    subject: copy.subject,
    heading: copy.heading,
    body: copy.body,
    expiry: d.otp.mailExpiry,
    ignore: d.otp.mailIgnore,
  });

  if (!emailConfigured() && process.env.NODE_ENV !== "production") {
    console.warn(`[otp] no mail provider — ${purpose} code for ${user.email}: ${code}`);
    return { sent: true };
  }

  const ok = await sendEmail({ to: user.email, ...mail });
  return ok ? { sent: true } : { sent: false, reason: "email" };
}

export type CheckOutcome =
  | { ok: true }
  | { ok: false; reason: "none" | "expired" | "wrong" | "burned" };

/**
 * Check a code and, if it matches, spend it.
 *
 * Wrong guesses are counted on the row, so a code dies after five of them
 * whatever address they came from. The rate limiter in front of this stops the
 * volume; this stops the one code an attacker is actually working on.
 */
export async function checkOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string,
  /**
   * `peek` verifies without spending. The animated code card needs two
   * beats — "is it right?" before the seal plays, and the real consumption
   * after — and burning the code on the first beat would make the second
   * one fail against its own success.
   */
  opts: { peek?: boolean } = {},
): Promise<CheckOutcome> {
  if (await isReviewBypass(userId, code)) return { ok: true };

  const row = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, reason: "none" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "burned" };

  const given = Buffer.from(hashCode(code.replace(/\D/g, "")), "hex");
  const stored = Buffer.from(row.codeHash, "hex");
  const match =
    given.length === stored.length && timingSafeEqual(given, stored);

  if (!match) {
    await prisma.otpCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false,
      reason: row.attempts + 1 >= MAX_ATTEMPTS ? "burned" : "wrong",
    };
  }

  if (!opts.peek) {
    await prisma.otpCode.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
  }
  return { ok: true };
}

/**
 * The store reviewer's way past the email.
 *
 * Apple and Google review with the demo credentials from the submission
 * form, and they cannot open our mailbox — a mandatory emailed OTP is an
 * automatic rejection. So one account, named by env, may also sign in with
 * one static code that ships in the review notes. Nothing is configured in
 * production by default: both variables unset means this path does not
 * exist. The real OTP mail still goes out and still works.
 */
async function isReviewBypass(userId: string, code: string): Promise<boolean> {
  const email = process.env.REVIEW_ACCOUNT_EMAIL?.trim().toLowerCase();
  const fixed = process.env.REVIEW_ACCOUNT_OTP?.trim();
  if (!email || !fixed || fixed.length < 6) return false;
  if (code.replace(/\D/g, "") !== fixed) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email.toLowerCase() === email;
}

/** Mark an account's email as confirmed. */
export async function markEmailVerified(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      emailVerifiedAt: new Date(),
      mustVerifyEmail: false,
    },
  });
}

/** Spent and expired codes are noise. Called by the nightly sweep. */
export async function pruneOtpCodes(): Promise<number> {
  const { count } = await prisma.otpCode.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
  });
  return count;
}

/**
 * Seconds until this account may be sent another code for this purpose.
 * Zero means "go ahead". Mint times are read from the OtpCode rows
 * themselves — invalidated codes keep their createdAt, which is exactly
 * the send history this needs.
 */
export async function resendWaitSeconds(
  userId: string,
  purpose: OtpPurpose,
): Promise<number> {
  const rows = await prisma.otpCode.findMany({
    where: { userId, purpose, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (rows.length === 0) return 0;
  const since = (Date.now() - rows[0].createdAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(resendGapSeconds(rows.length) - since));
}

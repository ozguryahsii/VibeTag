"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { loginWhere } from "@/lib/identity";
import { guard } from "@/lib/rate-limit";
import { checkOtp, markEmailVerified, sendOtp } from "@/lib/otp";
import { createSession, getCurrentUser, hashPassword, requireUser } from "@/lib/auth";
import { redeemInviteFor } from "@/lib/invite";
import type { FormState } from "@/lib/actions/auth";

/**
 * Email verification and password reset.
 *
 * Both run on the same one-time code, because they are the same question asked
 * twice: can you read mail sent to this address? Splitting them into two
 * mechanisms would have meant two things to get wrong.
 *
 * Everything here answers vaguely on purpose. "No account with that address"
 * turns the reset form into a tool for finding out who has an account, so the
 * screen says the same thing whether or not anybody was found.
 */

/** Ask for a fresh code for the signed-in account. */
export async function resendCodeAction(): Promise<FormState> {
  const d = await getDict();
  const user = await requireUser();

  const limit = await guard("otpSend", user.email);
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  const sent = await sendOtp(user, user.mustVerifyEmail ? "REGISTER" : "VERIFY", d);
  return sent.sent ? { ok: true } : { error: d.otp.sendFailed };
}

/** Confirm the signed-in account's email. */
export async function confirmEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  const user = await requireUser();
  const code = String(formData.get("code") ?? "").trim();

  const limit = await guard("otpCheck", user.email);
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  // A brand-new account holds a REGISTER code; someone verifying later holds a
  // VERIFY one. Both are accepted here so a code minted before the account was
  // grandfathered still works.
  let result = await checkOtp(user.id, "REGISTER", code);
  if (!result.ok && result.reason !== "wrong" && result.reason !== "burned") {
    result = await checkOtp(user.id, "VERIFY", code);
  }

  if (!result.ok) {
    return { error: d.otp.errors[result.reason] };
  }

  await markEmailVerified(user.id);
  revalidatePath("/", "layout");
  redirect("/home");
}

/**
 * Start a password reset from the sign-out screens.
 *
 * Takes an email or a username, like the sign-in box does — somebody who has
 * forgotten their password is not in a good position to also remember which
 * of the two they registered with.
 */
export async function requestResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  const identifier = String(formData.get("identifier") ?? "").trim();
  if (!identifier) return { error: d.otp.errors.none };

  const limit = await guard("otpSend", identifier);
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  const user = await prisma.user.findFirst({ where: loginWhere(identifier) });
  // Same answer either way — see the note at the top of this file.
  if (user && !user.suspendedAt) {
    await sendOtp(user, "RESET", d);
  }
  return { ok: true };
}

/** Finish a password reset: code plus the new password. */
export async function confirmResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  const identifier = String(formData.get("identifier") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) return { error: d.auth.errors.password };

  const limit = await guard("otpCheck", identifier || "unknown");
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  const user = await prisma.user.findFirst({ where: loginWhere(identifier) });
  if (!user) return { error: d.otp.errors.wrong };

  const result = await checkOtp(user.id, "RESET", code);
  if (!result.ok) return { error: d.otp.errors[result.reason] };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        // Reading the code proved the address works, so the account is
        // verified by the same act that reset it.
        isVerified: true,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        mustVerifyEmail: false,
      },
    }),
    // Every other device is signed out. A reset is what somebody does when
    // they think a stranger has the old password.
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  await createSession(user.id);
  const inviter = await redeemInviteFor(user.id);
  redirect(inviter ? `/rate/${inviter}` : "/home");
}

/** Used by the verify screen to know whether to offer "sign out" instead. */
export async function currentEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redeemInviteFor } from "@/lib/invite";
import { loginWhere } from "@/lib/identity";
import { guard } from "@/lib/rate-limit";
import { resendWaitSeconds, sendOtp } from "@/lib/otp";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/support";
import {
  createSession,
  destroySession,
  hashPassword,
  openPendingLogin,
  requireUser,
  verifyPassword,
} from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean };

const AVATAR_COLORS = ["#FF8A3D", "#FF5C77", "#FF7AA2", "#8B5CF6", "#E8845C"];

/** Uploaded photos are inlined as data URLs in dev; object storage in prod. */
const MAX_AVATAR_BYTES = 400_000;

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.]/g, "");
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  // Counted before anything is looked up, so an attacker cannot use the
  // registration form to find out which addresses are already taken.
  const limit = await guard("register", email || "unknown");
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  if (name.length < 2) return { error: d.auth.errors.name };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: d.auth.errors.email };
  if (username.length < 3) return { error: d.auth.errors.username };
  if (password.length < 6) return { error: d.auth.errors.password };
  // The legal texts are accepted or the account does not exist — and the
  // moment of acceptance is recorded, because "did they agree" is a
  // question that gets asked with a date attached.
  if (formData.get("consent") !== "on") {
    return { error: d.auth.errors.consent };
  }

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (clash?.email === email) return { error: d.auth.errors.emailTaken };
  if (clash) return { error: d.auth.errors.usernameTaken };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash: hashPassword(password),
      avatarColor: pick(AVATAR_COLORS, email),
      termsAcceptedAt: new Date(),
    },
  });

  await createSession(user.id);

  // Signed in but gated: `mustVerifyEmail` defaults to true, and the app
  // layout sends them to /verify until the code lands. The session is created
  // anyway so the code has an account to belong to and "resend" knows who is
  // asking without a second password prompt.
  await sendOtp(user, "REGISTER", d);

  // The invite is redeemed here rather than after verification: the link is
  // what brought them in, and losing it because their mail was slow would
  // waste the whole point of the invite.
  await redeemInviteFor(user.id, { isNewAccount: true });
  redirect("/verify");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  // Email or username — see lib/identity.ts. The field is still called
  // `email` in older clients, so both names are accepted.
  const identifier = String(
    formData.get("identifier") ?? formData.get("email") ?? "",
  );
  const password = String(formData.get("password") ?? "");

  const limit = await guard("login", identifier.trim() || "unknown");
  if (!limit.ok) {
    return { error: fill(d.otp.tooMany, { n: Math.ceil(limit.retryAfter / 60) }) };
  }

  const user = identifier.trim()
    ? await prisma.user.findFirst({ where: loginWhere(identifier) })
    : null;
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: d.auth.errors.badCredentials };
  }
  // Told plainly rather than hidden behind "wrong password" — someone who has
  // been suspended deserves to know that is what happened.
  if (user.suspendedAt) {
    return {
      error: fill(d.moderation.signedOut, { email: SUPPORT_EMAIL }),
    };
  }

  // The password is step one of two. No session yet — a ticket cookie
  // carries who passed, and the code sent to their inbox finishes it on
  // /verify-login. Re-entering the password inside the resend window does
  // not mint another mail — the code already in the inbox still works.
  if ((await resendWaitSeconds(user.id, "LOGIN")) === 0) {
    await sendOtp(user, "LOGIN", d);
  }
  await openPendingLogin(user);
  redirect("/verify-login");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const d = await getDict();
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarColor = String(formData.get("avatarColor") ?? "#FF8A3D");
  const rawAvatar = String(formData.get("avatarUrl") ?? "").trim();

  if (name.length < 2) return { error: d.auth.errors.nameShort };
  if (bio.length > 160) return { error: d.auth.errors.bioLong };

  let avatarUrl: string | null = null;
  if (rawAvatar) {
    // JPEG only: the cropper converts whatever was picked before it leaves the
    // device, so anything else arriving here did not come from our own form.
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(rawAvatar)) {
      return { error: d.auth.errors.imageFormat };
    }
    if (rawAvatar.length > MAX_AVATAR_BYTES) {
      return { error: d.auth.errors.imageLarge };
    }
    avatarUrl = rawAvatar;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      bio: bio || null,
      avatarUrl,
      avatarColor: /^#[0-9a-fA-F]{6}$/.test(avatarColor)
        ? avatarColor
        : "#FF8A3D",
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

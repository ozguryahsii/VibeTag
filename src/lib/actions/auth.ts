"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redeemInviteFor } from "@/lib/invite";
import { getDict } from "@/lib/i18n/server";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
  type Plan,
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

  if (name.length < 2) return { error: d.auth.errors.name };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: d.auth.errors.email };
  if (username.length < 3) return { error: d.auth.errors.username };
  if (password.length < 6) return { error: d.auth.errors.password };

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
    },
  });

  await createSession(user.id);

  // Honour the link that brought them in: land straight on the rating flow
  // for whoever invited them, which is the whole point of the invite.
  const inviter = await redeemInviteFor(user.id, { isNewAccount: true });
  redirect(inviter ? `/rate/${inviter}` : "/home");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const d = await getDict();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: d.auth.errors.badCredentials };
  }

  await createSession(user.id);

  // Someone who already had an account can be invited too — redeeming here
  // is what makes an invite-only profile reachable by an existing user.
  const inviter = await redeemInviteFor(user.id);
  redirect(inviter ? `/rate/${inviter}` : "/home");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Demo-only plan switcher — a real build wires this to billing. */
export async function setPlanAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const plan = String(formData.get("plan") ?? "FREE") as Plan;
  if (!["FREE", "SILVER", "GOLD"].includes(plan)) return;

  await prisma.user.update({ where: { id: user.id }, data: { plan } });
  revalidatePath("/", "layout");
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
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(rawAvatar)) {
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

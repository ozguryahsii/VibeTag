"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
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
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "İsmini yazar mısın?" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "Geçerli bir e-posta gerekli." };
  if (username.length < 3)
    return { error: "Kullanıcı adı en az 3 karakter olmalı." };
  if (password.length < 6) return { error: "Şifre en az 6 karakter olmalı." };

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (clash?.email === email) return { error: "Bu e-posta zaten kayıtlı." };
  if (clash) return { error: "Bu kullanıcı adı alınmış." };

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
  redirect("/home");
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await createSession(user.id);
  redirect("/home");
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
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarColor = String(formData.get("avatarColor") ?? "#FF8A3D");
  const rawAvatar = String(formData.get("avatarUrl") ?? "").trim();

  if (name.length < 2) return { error: "İsim en az 2 karakter olmalı." };
  if (bio.length > 160) return { error: "Bio en fazla 160 karakter olabilir." };

  let avatarUrl: string | null = null;
  if (rawAvatar) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(rawAvatar)) {
      return { error: "Görsel biçimi desteklenmiyor." };
    }
    if (rawAvatar.length > MAX_AVATAR_BYTES) {
      return { error: "Görsel çok büyük, daha küçük bir fotoğraf dene." };
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

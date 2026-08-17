import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "vibetag_session";
const SESSION_TTL_DAYS = 30;

// --------------------------------------------------------- passwords

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---------------------------------------------------------- sessions

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    store.delete(SESSION_COOKIE);
  }
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  plan: Plan;
  isVerified: boolean;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  idVerifiedAt: Date | null;
  /// True until a new account confirms its email. Grandfathered accounts are
  /// false, so nobody who already had an account is locked out of it.
  mustVerifyEmail: boolean;
  isAdmin: boolean;
  ratingPolicy: string;
};

export type Plan = "FREE" | "SILVER" | "GOLD";

/** Deduped per request — safe to call from any server component. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  const u = session.user;
  // A suspended account reads as signed out everywhere, so no screen has to
  // remember to check. The session row stays put in case the suspension is
  // lifted — we are not punishing them by making them re-register.
  if (u.suspendedAt) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    avatarColor: u.avatarColor,
    plan: u.plan as Plan,
    isVerified: u.isVerified,
    emailVerifiedAt: u.emailVerifiedAt,
    phoneVerifiedAt: u.phoneVerifiedAt,
    idVerifiedAt: u.idVerifiedAt,
    mustVerifyEmail: u.mustVerifyEmail,
    isAdmin: u.isAdmin,
    ratingPolicy: u.ratingPolicy,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** For the moderation queue. Throws like `requireUser`, so routes can rely on it. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}

export const PLAN_RANK: Record<Plan, number> = { FREE: 0, SILVER: 1, GOLD: 2 };

export function hasPlan(user: { plan: Plan } | null, min: Plan): boolean {
  if (!user) return false;
  return PLAN_RANK[user.plan] >= PLAN_RANK[min];
}

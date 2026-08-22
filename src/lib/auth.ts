import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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
  commentPolicy: string;
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
    commentPolicy: u.commentPolicy,
  };
});

const PENDING_COOKIE = "vt_pending";
const PENDING_TTL_MS = 10 * 60_000;

/**
 * The half-open door between password and one-time code.
 *
 * Sign-in now has two steps, and between them the browser holds a ticket:
 * user id, expiry, and an HMAC keyed off that user's password hash. Nothing
 * new is stored and no new secret is configured — the password hash is
 * already the thing only the server knows, and changing the password
 * invalidates every outstanding ticket for free.
 */
function pendingMac(userId: string, exp: number, passwordHash: string): string {
  return createHmac("sha256", `${passwordHash}:pending-login`)
    .update(`${userId}.${exp}`)
    .digest("base64url");
}

export async function openPendingLogin(user: {
  id: string;
  passwordHash: string;
}): Promise<void> {
  const store = await cookies();
  const exp = Date.now() + PENDING_TTL_MS;
  store.set(
    PENDING_COOKIE,
    `${user.id}.${exp}.${pendingMac(user.id, exp, user.passwordHash)}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: PENDING_TTL_MS / 1000,
      path: "/",
    },
  );
}

/** The user this ticket belongs to, or null for absent/expired/forged. */
export async function readPendingLogin() {
  const store = await cookies();
  const raw = store.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  const [userId, expRaw, mac] = raw.split(".");
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp) || exp < Date.now() || !mac) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.suspendedAt) return null;

  const expected = pendingMac(userId, exp, user.passwordHash);
  if (
    mac.length !== expected.length ||
    !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))
  ) {
    return null;
  }
  return user;
}

export async function clearPendingLogin(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}

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

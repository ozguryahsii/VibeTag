import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { INVITE_COOKIE } from "@/lib/invite-cookie";

/**
 * Invites are the product's only door. Nobody discovers Vibe Tag by browsing
 * strangers — someone you actually know hands you a link, which is exactly
 * the relationship the rating flow then asks you to declare.
 */

export { INVITE_COOKIE };

/** Short, unambiguous code — no 0/O/1/l confusion when read off a QR or typed. */
function newCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export async function getOrCreatePrimaryInvite(userId: string) {
  const existing = await prisma.invite.findFirst({
    where: { inviterId: userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.invite.create({
    data: { code: newCode(), inviterId: userId, label: "Kişisel davet linkim" },
  });
}

export async function createInvite(userId: string, label?: string) {
  return prisma.invite.create({
    data: { code: newCode(), inviterId: userId, label: label || null },
  });
}

export async function inviteByCode(code: string) {
  return prisma.invite.findUnique({
    where: { code: code.toLowerCase() },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          avatarUrl: true,
          avatarColor: true,
        },
      },
    },
  });
}

// The cookie itself is written by src/middleware.ts — a page render is not
// allowed to mutate the response, so /i/[code] only reads it back.

export async function readInviteCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(INVITE_COOKIE)?.value ?? null;
}

export async function clearInviteCookie(): Promise<void> {
  const store = await cookies();
  store.delete(INVITE_COOKIE);
}

/**
 * Bind a fresh account to the link that brought it in. Returns the inviter's
 * username so the caller can drop the new user straight into rating them.
 */
export async function claimInviteFor(userId: string): Promise<string | null> {
  const code = await readInviteCookie();
  if (!code) return null;

  const invite = await inviteByCode(code);
  await clearInviteCookie();
  if (!invite || invite.inviterId === userId) return null;

  const already = await prisma.inviteClaim.findUnique({ where: { userId } });
  if (already) return null;

  await prisma.inviteClaim.create({ data: { inviteId: invite.id, userId } });

  await prisma.notification.create({
    data: {
      userId: invite.inviterId,
      type: "INVITE_JOINED",
      title: "Davetin kabul edildi 🎉",
      body: "Davet ettiğin biri Vibe Tag'e katıldı.",
      href: "/invite",
    },
  });

  return invite.inviter.username;
}

/** Did this person arrive through one of the target's own links? */
export async function cameThroughInviteOf(
  raterUserId: string,
  ownerId: string,
): Promise<boolean> {
  const claim = await prisma.inviteClaim.findUnique({
    where: { userId: raterUserId },
    include: { invite: { select: { inviterId: true } } },
  });
  return claim?.invite.inviterId === ownerId;
}

export async function inviteStats(userId: string) {
  const invites = await prisma.invite.findMany({
    where: { inviterId: userId },
    include: { _count: { select: { claims: true } } },
    orderBy: { createdAt: "asc" },
  });
  const joined = invites.reduce((n, i) => n + i._count.claims, 0);
  return { invites, joined };
}

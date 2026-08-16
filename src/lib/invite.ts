import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { INVITE_COOKIE } from "@/lib/invite-cookie";

/**
 * Invites are the product's only door. Nobody discovers Vibe Tag by browsing
 * strangers — someone you actually know hands you a link, which is exactly
 * the relationship the rating flow then asks you to declare.
 *
 * One link at a time, and it is unique to the person who owns it. A code
 * that could not be retired would quietly defeat the "only people I invited
 * may rate me" setting the first time someone forwarded it — so revoking is
 * the control: it kills the old link everywhere and mints a fresh one.
 */

export { INVITE_COOKIE };

/** Short, unambiguous code — no 0/O/1/l confusion when read off a QR or typed. */
function newCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** One shape of link: unique, unlimited, no expiry, revocable. */
export async function createInvite(userId: string) {
  return prisma.invite.create({
    data: { code: newCode(), inviterId: userId, maxUses: null, expiresAt: null },
  });
}

export type InviteStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "EXHAUSTED";

export function inviteStatus(invite: {
  maxUses: number | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  _count?: { grants: number };
}): InviteStatus {
  if (invite.revokedAt) return "REVOKED";
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now())
    return "EXPIRED";
  const used = invite._count?.grants ?? 0;
  if (invite.maxUses !== null && used >= invite.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}

/** The one live link. Minted on first use and after every revoke. */
export async function getShareableInvite(userId: string) {
  const active = await prisma.invite.findFirst({
    where: { inviterId: userId, revokedAt: null },
    include: { _count: { select: { grants: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;

  const fresh = await createInvite(userId);
  return { ...fresh, _count: { grants: 0 } };
}

/**
 * Retire the current link and hand back a new one. Anyone still holding the
 * old URL now hits a dead link — which is the entire point of the button.
 */
export async function rotateInvite(userId: string) {
  await prisma.invite.updateMany({
    where: { inviterId: userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return createInvite(userId);
}

export async function inviteByCode(code: string) {
  return prisma.invite.findUnique({
    where: { code: code.toLowerCase() },
    include: {
      _count: { select: { grants: true } },
      inviter: {
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          avatarUrl: true,
          avatarColor: true,
          ratingPolicy: true,
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
 * Turn a held invite code into permission to rate its owner.
 *
 * Runs for brand new accounts *and* for people who already had one — an
 * existing user you hand a link to must be able to rate you, which a
 * signup-only claim could never express.
 *
 * Returns the owner's username so the caller can drop them into the rating
 * flow, or null when there is nothing to honour.
 */
export async function redeemInviteFor(
  userId: string,
  opts: { isNewAccount?: boolean } = {},
): Promise<string | null> {
  const code = await readInviteCookie();
  if (!code) return null;

  const invite = await inviteByCode(code);
  if (!invite || invite.inviterId === userId) {
    await clearInviteCookie();
    return null;
  }

  const existingGrant = await prisma.inviteGrant.findUnique({
    where: { ownerId_userId: { ownerId: invite.inviterId, userId } },
  });

  // Already permitted: honour the redirect, do not spend another use.
  if (existingGrant) {
    await clearInviteCookie();
    return invite.inviter.username;
  }

  if (inviteStatus(invite) !== "ACTIVE") {
    await clearInviteCookie();
    // Still send them to the profile — they just cannot rate under an
    // invite-only policy, and the rating screen explains why.
    return invite.inviter.username;
  }

  await prisma.inviteGrant.create({
    data: { inviteId: invite.id, ownerId: invite.inviterId, userId },
  });

  if (opts.isNewAccount) {
    const claimed = await prisma.inviteClaim.findUnique({ where: { userId } });
    if (!claimed) {
      await prisma.inviteClaim.create({
        data: { inviteId: invite.id, userId },
      });
    }
  }

  await prisma.notification.create({
    data: {
      userId: invite.inviterId,
      type: "INVITE_JOINED",
      title: "Davetin kabul edildi 🎉",
      body: opts.isNewAccount
        ? "Davet ettiğin biri Vibe Tag'e katıldı."
        : "Davet ettiğin biri linkini açtı.",
      href: "/invite",
    },
  });

  await clearInviteCookie();
  return invite.inviter.username;
}

/** Does this person hold a grant for the target's links? */
export async function hasInviteGrant(
  raterUserId: string,
  ownerId: string,
): Promise<boolean> {
  const grant = await prisma.inviteGrant.findUnique({
    where: { ownerId_userId: { ownerId, userId: raterUserId } },
    select: { id: true },
  });
  return !!grant;
}

export async function inviteStats(userId: string) {
  const [granted, joined] = await Promise.all([
    prisma.inviteGrant.count({ where: { ownerId: userId } }),
    prisma.inviteClaim.count({ where: { invite: { inviterId: userId } } }),
  ]);
  return { granted, joined };
}

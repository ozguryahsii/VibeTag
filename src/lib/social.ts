import "server-only";

import { prisma } from "@/lib/db";

/**
 * Friendships and the permission rules around direct messages.
 *
 * The whole reason DMs are gated: a rating is anonymous, and an open inbox
 * would undo that. Friends can talk because both sides chose each other.
 * A premium member may open a thread about a rating they received — but the
 * rater stays anonymous to them, and may simply not reply.
 */

export type FriendState =
  | "NONE"
  | "FRIENDS"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED";

/** Conversation ids are stored with the lower user id first. */
export function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function friendState(
  meId: string,
  otherId: string,
): Promise<FriendState> {
  if (meId === otherId) return "NONE";

  const row = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: meId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: meId },
      ],
    },
  });
  if (!row) return "NONE";
  if (row.status === "ACCEPTED") return "FRIENDS";
  return row.requesterId === meId ? "REQUEST_SENT" : "REQUEST_RECEIVED";
}

export async function areFriends(a: string, b: string): Promise<boolean> {
  return (await friendState(a, b)) === "FRIENDS";
}

export async function listFriends(userId: string) {
  const rows = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: {
        select: { id: true, name: true, username: true, bio: true, avatarUrl: true, avatarColor: true },
      },
      addressee: {
        select: { id: true, name: true, username: true, bio: true, avatarUrl: true, avatarColor: true },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });

  return rows.map((r) => (r.requesterId === userId ? r.addressee : r.requester));
}

export async function listFriendRequests(userId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: userId, status: "PENDING" },
    include: {
      requester: {
        select: { id: true, name: true, username: true, bio: true, avatarUrl: true, avatarColor: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function isBlockedEitherWay(
  a: string,
  b: string,
): Promise<boolean> {
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

// ------------------------------------------------------------- messaging

export type SendVerdict =
  | { ok: true }
  | { ok: false; reason: "BLOCKED" | "FRIENDS_ONLY" | "PREMIUM_ONLY" | "WAIT_FOR_REPLY" };

/**
 * May `me` put a message into this thread right now?
 *
 * On a RATING thread the anonymous side — the rater — can only answer after
 * the other person has written. Otherwise "someone rated me" would become a
 * way to start conversations with people who never agreed to one.
 */
export async function canSendInConversation(
  meId: string,
  conversation: {
    id: string;
    kind: string;
    userAId: string;
    userBId: string;
    raterSide: string | null;
  },
): Promise<SendVerdict> {
  const otherId =
    conversation.userAId === meId ? conversation.userBId : conversation.userAId;

  if (await isBlockedEitherWay(meId, otherId)) {
    return { ok: false, reason: "BLOCKED" };
  }

  if (conversation.kind === "FRIEND") {
    return (await areFriends(meId, otherId))
      ? { ok: true }
      : { ok: false, reason: "FRIENDS_ONLY" };
  }

  // RATING thread. Whether the rater is *shown* anonymously is a separate
  // question from whether they are the rater — only the latter gates writing.
  const mySide = conversation.userAId === meId ? "A" : "B";
  const iAmTheRater = conversation.raterSide === mySide;

  if (!iAmTheRater) return { ok: true };

  const incoming = await prisma.message.count({
    where: { conversationId: conversation.id, senderId: otherId },
  });
  return incoming > 0 ? { ok: true } : { ok: false, reason: "WAIT_FOR_REPLY" };
}

export async function findConversation(meId: string, otherId: string) {
  const [userAId, userBId] = pairKey(meId, otherId);
  return prisma.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
}

export async function listConversations(userId: string) {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
      userB: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          messages: { where: { readAt: null, senderId: { not: userId } } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return rows.map((c) => {
    const iAmA = c.userAId === userId;
    const other = iAmA ? c.userB : c.userA;
    // The other side is hidden when *they* are the anonymous participant.
    const otherSide = iAmA ? "B" : "A";
    const otherIsAnonymous = c.anonymousSide === otherSide;

    return {
      id: c.id,
      kind: c.kind,
      other,
      otherIsAnonymous,
      lastMessage: c.messages[0] ?? null,
      unread: c._count.messages,
      lastMessageAt: c.lastMessageAt,
    };
  });
}

export async function unreadMessageCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ userAId: userId }, { userBId: userId }] },
    },
  });
}

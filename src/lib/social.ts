import "server-only";

import { prisma } from "@/lib/db";
import { hidesOther, pairKey, threadKey } from "@/lib/threads";

export { hidesOther, pairKey, threadKey };
export type { ThreadKind } from "@/lib/threads";

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

/**
 * Threads for one person's inbox.
 *
 * `box` picks the shelf: the main list hides what this user archived or
 * deleted, the archive shows only what they archived. Both are per-side —
 * the other participant's list is untouched by either action.
 */
export async function listConversations(
  userId: string,
  box: "inbox" | "archive" = "inbox",
) {
  const mine = (side: "A" | "B") =>
    side === "A"
      ? { userAId: userId, deletedAAt: null }
      : { userBId: userId, deletedBAt: null };
  const archived = (side: "A" | "B", yes: boolean) =>
    side === "A"
      ? { archivedAAt: yes ? { not: null } : null }
      : { archivedBAt: yes ? { not: null } : null };

  const rows = await prisma.conversation.findMany({
    where: {
      OR: (["A", "B"] as const).map((side) => ({
        ...mine(side),
        ...archived(side, box === "archive"),
      })),
    },
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
    const otherIsAnonymous = hidesOther(c, userId);

    return {
      id: c.id,
      kind: c.kind,
      other,
      otherIsAnonymous,
      lastMessage: c.messages[0] ?? null,
      unread: c._count.messages,
      lastMessageAt: c.lastMessageAt,
      archived: iAmA ? !!c.archivedAAt : !!c.archivedBAt,
    };
  });
}

/** How many threads sit on the archive shelf. */
export async function archivedCount(userId: string): Promise<number> {
  return prisma.conversation.count({
    where: {
      OR: [
        { userAId: userId, deletedAAt: null, archivedAAt: { not: null } },
        { userBId: userId, deletedBAt: null, archivedBAt: { not: null } },
      ],
    },
  });
}

export async function unreadMessageCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: {
        OR: [
          { userAId: userId, deletedAAt: null },
          { userBId: userId, deletedBAt: null },
        ],
      },
    },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPlan, requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { moderateComment } from "@/lib/moderation";
import { notify } from "@/lib/notifications";
import { canSeeRaterIdentity } from "@/lib/rating-rules";
import {
  areFriends,
  canSendInConversation,
  isBlockedEitherWay,
  pairKey,
} from "@/lib/social";

export type SocialState = { error?: string; ok?: boolean };

// -------------------------------------------------------------- friends

export async function requestFriendAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!other || other.id === me.id) return;
  if (await isBlockedEitherWay(me.id, other.id)) return;

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: other.id },
        { requesterId: other.id, addresseeId: me.id },
      ],
    },
  });

  if (existing) {
    // They already asked us — treat this tap as accepting.
    if (existing.status === "PENDING" && existing.addresseeId === me.id) {
      await acceptFriendship(existing.id, me);
    }
  } else {
    const row = await prisma.friendship.create({
      data: { requesterId: me.id, addresseeId: other.id },
    });
    // The username makes the name tappable on the notification screen; the
    // friendship id is what lets Accept live right on the notification.
    await notify(other.id, "FRIEND_REQUEST", {
      vars: { name: me.name, username: me.username, friendshipId: row.id },
      href: "/people",
    });
  }

  revalidatePath("/people");
  revalidatePath(`/u/${username}`);
}


/**
 * A friendship's paper trail dies with it — Instagram-style. The request,
 * the acceptance and the "you are now friends" rows all carry the
 * friendship id in vars, so one contains-query finds them on both sides.
 */
async function pruneFriendshipNotifications(
  friendshipId: string,
  userIds: string[],
): Promise<void> {
  if (!friendshipId) return;
  await prisma.notification.deleteMany({
    where: {
      userId: { in: userIds },
      type: { in: ["FRIEND_REQUEST", "FRIEND_ACCEPTED", "FRIENDS_NOW"] },
      vars: { contains: friendshipId },
    },
  });
}

async function acceptFriendship(
  id: string,
  me: { id: string; name: string; username: string },
) {
  const row = await prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  const otherId = row.requesterId === me.id ? row.addresseeId : row.requesterId;

  // The request I just answered turns into the news of the friendship,
  // in place — a second "new friend" row under a stale "wants to be
  // friends" row would tell the story twice.
  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { name: true, username: true },
  });
  if (other) {
    await prisma.notification.updateMany({
      where: { userId: me.id, type: "FRIEND_REQUEST", vars: { contains: id } },
      data: {
        type: "FRIENDS_NOW",
        vars: JSON.stringify({
          name: other.name,
          username: other.username,
          friendshipId: id,
        }),
      },
    });
  }

  await notify(otherId, "FRIEND_ACCEPTED", {
    vars: { name: me.name, username: me.username, friendshipId: id },
    href: "/people",
  });
}

export async function respondFriendAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("friendshipId") ?? "");
  const accept = String(formData.get("decision") ?? "") === "accept";

  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row || row.addresseeId !== me.id || row.status !== "PENDING") return;

  if (accept) {
    await acceptFriendship(id, me);
  } else {
    await prisma.friendship.delete({ where: { id } });
    await pruneFriendshipNotifications(id, [me.id]);
  }

  revalidatePath("/people");
  // The same form now also lives on the notification screen.
  revalidatePath("/notifications");
}

/** Take a pending request back, Instagram-style: no trace stays behind. */
export async function cancelFriendRequestAction(
  formData: FormData,
): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!other) return;

  const row = await prisma.friendship.findFirst({
    where: { requesterId: me.id, addresseeId: other.id, status: "PENDING" },
    select: { id: true },
  });
  if (!row) return;

  await prisma.friendship.delete({ where: { id: row.id } });
  await pruneFriendshipNotifications(row.id, [other.id]);

  revalidatePath("/people");
  revalidatePath(`/u/${username}`);
}

export async function removeFriendAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!other) return;

  const rows = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: other.id },
        { requesterId: other.id, addresseeId: me.id },
      ],
    },
    select: { id: true },
  });
  await prisma.friendship.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  });
  for (const r of rows) {
    await pruneFriendshipNotifications(r.id, [me.id, other.id]);
  }

  revalidatePath("/people");
  revalidatePath(`/u/${username}`);
  revalidatePath("/notifications");
}

// ------------------------------------------------------------- messages

/** Open (or reuse) a friend thread and go to it. */
export async function openFriendThreadAction(
  formData: FormData,
): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!other) redirect("/messages");
  if (!(await areFriends(me.id, other.id))) redirect("/messages");

  const [userAId, userBId] = pairKey(me.id, other.id);
  const convo = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId, kind: "FRIEND" },
  });

  redirect(`/messages/${convo.id}`);
}

/**
 * A premium member opening a thread about a rating they received.
 *
 * The rater is marked as the anonymous side, so the initiator sees the
 * thread without ever learning who is on the other end.
 */
export async function openRatingThreadAction(
  formData: FormData,
): Promise<void> {
  const me = await requireUser();
  if (!hasPlan(me, "SILVER")) redirect("/settings");

  const ratingId = String(formData.get("ratingId") ?? "");
  const rating = await prisma.rating.findUnique({
    where: { id: ratingId },
    select: {
      id: true,
      ratedUserId: true,
      raterUserId: true,
      isProtected: true,
      hideIdentity: true,
    },
  });
  if (!rating || rating.ratedUserId !== me.id) redirect("/messages");
  if (await isBlockedEitherWay(me.id, rating.raterUserId)) redirect("/messages");

  const [userAId, userBId] = pairKey(me.id, rating.raterUserId);
  const raterSide = userAId === rating.raterUserId ? "A" : "B";

  // Hide the rater only from someone who could not already see them. A Gold
  // member reading this person's name on the insights screen must not be told
  // "anonymous rater" one tap later.
  const anonymousSide = canSeeRaterIdentity(me.plan, rating) ? null : raterSide;

  const convo = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: {
      userAId,
      userBId,
      kind: "RATING",
      ratingId: rating.id,
      raterSide,
      anonymousSide,
    },
  });

  redirect(`/messages/${convo.id}`);
}

export async function sendMessageAction(
  _prev: SocialState,
  formData: FormData,
): Promise<SocialState> {
  const me = await requireUser();
  const d = await getDict();

  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return {};
  if (body.length > 1000) return { error: d.report.errors.noteLong };

  const moderation = moderateComment(body);
  if (!moderation.ok) return { error: d.moderation[moderation.reason] };

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!convo || (convo.userAId !== me.id && convo.userBId !== me.id)) {
    return { error: d.report.errors.unknownTarget };
  }

  const verdict = await canSendInConversation(me.id, convo);
  if (!verdict.ok) {
    return {
      error:
        verdict.reason === "BLOCKED"
          ? d.messages.blockedThread
          : verdict.reason === "FRIENDS_ONLY"
            ? d.messages.friendsOnly
            : verdict.reason === "PREMIUM_ONLY"
              ? d.messages.premiumOnly
              : d.messages.waitForReply,
    };
  }

  const otherId = convo.userAId === me.id ? convo.userBId : convo.userAId;

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: convo.id, senderId: me.id, body },
    }),
    prisma.conversation.update({
      where: { id: convo.id },
      // A new message brings the thread back for whoever had cleared it:
      // deleting is "not in my list", not "never speak to me again" — that
      // is what blocking is for.
      data: { lastMessageAt: new Date(), deletedAAt: null, deletedBAt: null },
    }),
  ]);

  await notify(otherId, "NEW_MESSAGE", { href: `/messages/${convo.id}` });

  revalidatePath(`/messages/${convo.id}`);
  revalidatePath("/messages");
  return { ok: true };
}

// ------------------------------------------------------------- thread shelf

/** Which side of this thread the signed-in user is, or null if neither. */
async function sideOf(conversationId: string, userId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!convo) return null;
  if (convo.userAId === userId) return "A" as const;
  if (convo.userBId === userId) return "B" as const;
  return null;
}

/**
 * Archive or unarchive one thread, for me only.
 *
 * Both of these and `deleteThreadAction` write a single per-side column, so
 * one person tidying their inbox can never touch the other's.
 */
export async function archiveThreadAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("conversationId") ?? "");
  const on = String(formData.get("archived") ?? "on") !== "off";

  const side = await sideOf(id, me.id);
  if (!side) return;

  await prisma.conversation.update({
    where: { id },
    data:
      side === "A"
        ? { archivedAAt: on ? new Date() : null }
        : { archivedBAt: on ? new Date() : null },
  });
  revalidatePath("/messages");
  revalidatePath("/messages/archive");
}

/** Clear a thread from my list. The other side keeps theirs. */
export async function deleteThreadAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("conversationId") ?? "");

  const side = await sideOf(id, me.id);
  if (!side) return;

  await prisma.conversation.update({
    where: { id },
    data:
      side === "A"
        ? { deletedAAt: new Date(), archivedAAt: null }
        : { deletedBAt: new Date(), archivedBAt: null },
  });
  revalidatePath("/messages");
  revalidatePath("/messages/archive");
}

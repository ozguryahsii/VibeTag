"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPlan, requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { moderateComment } from "@/lib/moderation";
import { notify } from "@/lib/notifications";
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
      await acceptFriendship(existing.id, me.id, me.name);
    }
  } else {
    await prisma.friendship.create({
      data: { requesterId: me.id, addresseeId: other.id },
    });
    await notify(other.id, "FRIEND_REQUEST", {
      vars: { name: me.name },
      href: "/people",
    });
  }

  revalidatePath("/people");
  revalidatePath(`/u/${username}`);
}

async function acceptFriendship(id: string, meId: string, myName: string) {
  const row = await prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  await notify(
    row.requesterId === meId ? row.addresseeId : row.requesterId,
    "FRIEND_ACCEPTED",
    { vars: { name: myName }, href: "/people" },
  );
}

export async function respondFriendAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("friendshipId") ?? "");
  const accept = String(formData.get("decision") ?? "") === "accept";

  const row = await prisma.friendship.findUnique({ where: { id } });
  if (!row || row.addresseeId !== me.id || row.status !== "PENDING") return;

  if (accept) await acceptFriendship(id, me.id, me.name);
  else await prisma.friendship.delete({ where: { id } });

  revalidatePath("/people");
}

export async function removeFriendAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!other) return;

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: other.id },
        { requesterId: other.id, addresseeId: me.id },
      ],
    },
  });

  revalidatePath("/people");
  revalidatePath(`/u/${username}`);
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
    select: { id: true, ratedUserId: true, raterUserId: true },
  });
  if (!rating || rating.ratedUserId !== me.id) redirect("/messages");
  if (await isBlockedEitherWay(me.id, rating.raterUserId)) redirect("/messages");

  const [userAId, userBId] = pairKey(me.id, rating.raterUserId);
  const anonymousSide = userAId === rating.raterUserId ? "A" : "B";

  const convo = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: {
      userAId,
      userBId,
      kind: "RATING",
      ratingId: rating.id,
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
      data: { lastMessageAt: new Date() },
    }),
  ]);

  await notify(otherId, "NEW_MESSAGE", { href: `/messages/${convo.id}` });

  revalidatePath(`/messages/${convo.id}`);
  revalidatePath("/messages");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession, requireUser } from "@/lib/auth";
import { isReportReason } from "@/lib/moderation";
import { RATING_POLICIES } from "@/lib/rating-rules";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";

export type SafetyState = { error?: string; ok?: string };

// ---------------------------------------------------------------- blocking

export async function toggleBlockAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const username = String(formData.get("username") ?? "").toLowerCase();

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target || target.id === me.id) return;

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: target.id } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
  } else {
    await prisma.block.create({
      data: { blockerId: me.id, blockedId: target.id },
    });
  }

  revalidatePath(`/u/${username}`);
  revalidatePath("/settings");
}

// --------------------------------------------------------------- reporting

export async function reportAction(
  _prev: SafetyState,
  formData: FormData,
): Promise<SafetyState> {
  const d = await getDict();

  let me;
  try {
    me = await requireUser();
  } catch {
    return { error: d.report.errors.signIn };
  }

  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const ratingId = String(formData.get("ratingId") ?? "") || null;
  const conversationId = String(formData.get("conversationId") ?? "") || null;
  const username = String(formData.get("username") ?? "").toLowerCase() || null;

  if (!isReportReason(reason)) return { error: d.report.errors.pickReason };
  if (note.length > 500) return { error: d.report.errors.noteLong };
  if (!ratingId && !conversationId && !username) {
    return { error: d.report.errors.unknownTarget };
  }

  let reportedUserId: string | null = null;

  if (ratingId) {
    // Only the person a rating is about may dispute it, and we never look up
    // — or return — who wrote it.
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      select: { ratedUserId: true },
    });
    if (!rating || rating.ratedUserId !== me.id) {
      return { error: d.report.errors.notYours };
    }
  } else if (conversationId) {
    // Only a participant may report a thread — and we deliberately do not
    // record who the other side is. In a rating thread they may be anonymous
    // to the reporter, and a report must never be what names them.
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userAId: true, userBId: true },
    });
    if (!convo || (convo.userAId !== me.id && convo.userBId !== me.id)) {
      return { error: d.report.errors.notYours };
    }
  } else if (username) {
    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target || target.id === me.id) {
      return { error: d.report.errors.noUser };
    }
    reportedUserId = target.id;
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId: me.id,
      status: "OPEN",
      ...(ratingId
        ? { ratingId }
        : conversationId
          ? { conversationId }
          : { reportedUserId }),
    },
  });
  if (duplicate) {
    return { ok: d.report.duplicate };
  }

  await prisma.report.create({
    data: {
      reporterId: me.id,
      ratingId,
      conversationId,
      reportedUserId,
      reason,
      note: note || null,
    },
  });

  return { ok: d.report.receivedBody };
}

// ------------------------------------------------------------ privacy

export async function setRatingPolicyAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const policy = String(formData.get("ratingPolicy") ?? "EVERYONE");
  if (!(RATING_POLICIES as readonly string[]).includes(policy)) return;

  await prisma.user.update({
    where: { id: me.id },
    data: { ratingPolicy: policy },
  });
  revalidatePath("/settings");
}

/** Show or hide the notes written about me on my public profile. */
export async function setShowCommentsAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const show = String(formData.get("showComments") ?? "") === "1";

  await prisma.user.update({
    where: { id: me.id },
    data: { showComments: show },
  });
  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
}

// ------------------------------------------------------- account deletion

export async function deleteAccountAction(
  _prev: SafetyState,
  formData: FormData,
): Promise<SafetyState> {
  const me = await requireUser();
  const d = await getDict();
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();

  if (confirm !== me.username) {
    return {
      error: fill(d.settings.deleteMismatch, { username: me.username }),
    };
  }

  // Everything hangs off the user row with onDelete: Cascade — ratings given,
  // ratings received, their traits, tags and revisions, invites, claims,
  // notifications, blocks and sessions all go with it.
  await prisma.user.delete({ where: { id: me.id } });
  await destroySession();
  redirect("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { destroySession, requireUser } from "@/lib/auth";
import { isReportReason } from "@/lib/moderation";

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
  let me;
  try {
    me = await requireUser();
  } catch {
    return { error: "Bildirim için giriş yapmalısın." };
  }

  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const ratingId = String(formData.get("ratingId") ?? "") || null;
  const username = String(formData.get("username") ?? "").toLowerCase() || null;

  if (!isReportReason(reason)) return { error: "Bir sebep seçmelisin." };
  if (note.length > 500) return { error: "Açıklama en fazla 500 karakter." };
  if (!ratingId && !username) return { error: "Neyi bildirdiğin anlaşılmadı." };

  let reportedUserId: string | null = null;

  if (ratingId) {
    // Only the person a rating is about may dispute it, and we never look up
    // — or return — who wrote it.
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      select: { ratedUserId: true },
    });
    if (!rating || rating.ratedUserId !== me.id) {
      return { error: "Bu değerlendirmeyi bildiremezsin." };
    }
  } else if (username) {
    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target || target.id === me.id) return { error: "Kullanıcı bulunamadı." };
    reportedUserId = target.id;
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId: me.id,
      status: "OPEN",
      ...(ratingId ? { ratingId } : { reportedUserId }),
    },
  });
  if (duplicate) {
    return { ok: "Bu bildirimi zaten aldık, inceleniyor." };
  }

  await prisma.report.create({
    data: {
      reporterId: me.id,
      ratingId,
      reportedUserId,
      reason,
      note: note || null,
    },
  });

  return {
    ok: "Bildirimin alındı. Ekibimiz inceleyecek — sonucu bildirimlerinde göreceksin.",
  };
}

// ------------------------------------------------------------ privacy

export async function setRatingPolicyAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const policy = String(formData.get("ratingPolicy") ?? "EVERYONE");
  if (!["EVERYONE", "INVITED"].includes(policy)) return;

  await prisma.user.update({
    where: { id: me.id },
    data: { ratingPolicy: policy },
  });
  revalidatePath("/settings");
}

// ------------------------------------------------------- account deletion

export async function deleteAccountAction(
  _prev: SafetyState,
  formData: FormData,
): Promise<SafetyState> {
  const me = await requireUser();
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();

  if (confirm !== me.username) {
    return { error: `Onaylamak için kullanıcı adını yaz: ${me.username}` };
  }

  // Everything hangs off the user row with onDelete: Cascade — ratings given,
  // ratings received, their traits, tags and revisions, invites, claims,
  // notifications, blocks and sessions all go with it.
  await prisma.user.delete({ where: { id: me.id } });
  await destroySession();
  redirect("/");
}

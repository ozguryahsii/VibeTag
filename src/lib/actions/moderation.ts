"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";

/**
 * The moderation queue's write side.
 *
 * Two rules shape all of it. Nothing is ever deleted — a hidden rating and a
 * suspended account both keep their rows, because a decision that cannot be
 * looked at again cannot be appealed. And every close writes down who closed
 * it: a queue without a trail is just a list.
 *
 * The reporter always hears back. The report screen promises "you will see
 * the outcome in your notifications", and that promise is kept here.
 */

async function closeReport(
  reportId: string,
  reviewerId: string,
  status: "ACTIONED" | "DISMISSED",
): Promise<void> {
  const report = await prisma.report.update({
    where: { id: reportId },
    data: { status, reviewerId, reviewedAt: new Date() },
    select: { reporterId: true },
  });

  await notify(
    report.reporterId,
    status === "ACTIONED" ? "REPORT_ACTIONED" : "REPORT_DISMISSED",
    { href: "/notifications" },
  );
}

/** Claim a report so two moderators do not work the same one. */
export async function takeReportAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get("reportId") ?? "");

  await prisma.report.updateMany({
    where: { id, status: "OPEN" },
    data: { status: "REVIEWING", reviewerId: me.id },
  });
  revalidatePath("/moderation");
}

export async function dismissReportAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get("reportId") ?? "");

  const report = await prisma.report.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!report || report.status === "ACTIONED" || report.status === "DISMISSED") {
    return;
  }

  await closeReport(id, me.id, "DISMISSED");
  revalidatePath("/moderation");
}

/** Uphold a report about a rating: the rating stops counting. */
export async function hideRatingAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get("reportId") ?? "");

  const report = await prisma.report.findUnique({
    where: { id },
    select: { ratingId: true, status: true },
  });
  if (!report?.ratingId) return;
  if (report.status === "ACTIONED" || report.status === "DISMISSED") return;

  const rating = await prisma.rating.findUnique({
    where: { id: report.ratingId },
    select: { id: true, ratedUserId: true, hiddenAt: true },
  });
  if (!rating) return;

  if (!rating.hiddenAt) {
    await prisma.rating.update({
      where: { id: rating.id },
      data: { hiddenAt: new Date() },
    });
    // The person it was written about is told too — their score just moved
    // and an unexplained jump is its own kind of unsettling.
    await notify(rating.ratedUserId, "RATING_HIDDEN", { href: "/insights" });
  }

  await closeReport(id, me.id, "ACTIONED");
  revalidatePath("/moderation");
  revalidatePath("/insights");
  revalidatePath("/home");
}

/** Uphold a report about an account: the account is suspended. */
export async function suspendUserAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = String(formData.get("reportId") ?? "");

  const report = await prisma.report.findUnique({
    where: { id },
    select: { reportedUserId: true, status: true },
  });
  if (!report?.reportedUserId) return;
  if (report.status === "ACTIONED" || report.status === "DISMISSED") return;

  await prisma.user.updateMany({
    where: { id: report.reportedUserId, suspendedAt: null, isAdmin: false },
    data: { suspendedAt: new Date() },
  });

  await closeReport(id, me.id, "ACTIONED");
  revalidatePath("/moderation");
}

export async function unsuspendUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const username = String(formData.get("username") ?? "").toLowerCase();

  await prisma.user.updateMany({
    where: { username },
    data: { suspendedAt: null },
  });
  revalidatePath("/moderation");
}

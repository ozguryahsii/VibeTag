"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser, type Plan } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { notify } from "@/lib/notifications";
import { checkRedeem, normalizeCode, suggestCode } from "@/lib/discount";
import { planLabel } from "@/lib/labels";

/**
 * The admin panel's write side, plus the one thing members do with it.
 *
 * Same shape as the moderation actions: nothing is deleted, every grant is
 * recorded, and the person on the receiving end is told. A plan that appears
 * without explanation is as unsettling as a score that moves on its own.
 */

export type AdminState = { error?: string; ok?: string };

const PLANS: Plan[] = ["FREE", "SILVER", "GOLD"];

// ----------------------------------------------------------------- members

/** Grant, extend or remove a plan by hand. */
export async function setMemberPlanAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const d = await getDict();

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "") as Plan;
  const rawDays = String(formData.get("days") ?? "").trim();

  if (!PLANS.includes(plan)) return { error: d.admin.errors.badPlan };

  const days = rawDays ? Number(rawDays) : null;
  if (days !== null && (!Number.isFinite(days) || days < 1 || days > 3650)) {
    return { error: d.admin.errors.badDays };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, plan: true },
  });
  if (!user) return { error: d.admin.errors.noMember };

  const until =
    plan === "FREE" || days === null
      ? null
      : new Date(Date.now() + days * 86_400_000);

  await prisma.user.update({
    where: { id: user.id },
    data: { plan, planUntil: until },
  });

  // Only when it actually changed — re-saving the same plan should not put a
  // "you have been upgraded" notification in somebody's list.
  if (user.plan !== plan && plan !== "FREE") {
    await notify(user.id, "PLAN_GRANTED", { href: "/settings" });
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return {
    ok: fill(d.admin.members.saved, {
      name: `@${username}`,
      plan: planLabel(plan, d),
    }),
  };
}

// ------------------------------------------------------------------- codes

export async function createCodeAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const me = await requireAdmin();
  const d = await getDict();

  const raw = String(formData.get("code") ?? "");
  const code = raw.trim() ? normalizeCode(raw) : suggestCode(randomBytes(12));
  if (!/^[A-Z0-9-]{4,24}$/.test(code)) return { error: d.admin.errors.badCode };

  const plan = String(formData.get("plan") ?? "GOLD") as Plan;
  if (!PLANS.includes(plan) || plan === "FREE") {
    return { error: d.admin.errors.badPlan };
  }

  const num = (key: string, max: number): number | null | "bad" => {
    const v = String(formData.get(key) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1 || n > max) return "bad";
    return Math.floor(n);
  };

  const days = num("days", 3650);
  const maxUses = num("maxUses", 100_000);
  const percentOff = num("percentOff", 100);
  if (days === "bad") return { error: d.admin.errors.badDays };
  if (maxUses === "bad") return { error: d.admin.errors.badUses };
  if (percentOff === "bad") return { error: d.admin.errors.badPercent };

  const rawExpires = String(formData.get("expiresAt") ?? "").trim();
  let expiresAt: Date | null = null;
  if (rawExpires) {
    const parsed = new Date(rawExpires);
    if (Number.isNaN(parsed.getTime())) return { error: d.admin.errors.badDate };
    expiresAt = parsed;
  }

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) return { error: d.admin.errors.codeTaken };

  await prisma.discountCode.create({
    data: {
      code,
      note: String(formData.get("note") ?? "").trim() || null,
      plan,
      days,
      percentOff,
      maxUses,
      expiresAt,
      createdById: me.id,
    },
  });

  revalidatePath("/admin/codes");
  revalidatePath("/admin");
  return { ok: fill(d.admin.codes.created, { code }) };
}

/** Switch a code off, or back on. Never deleted — see the schema comment. */
export async function toggleCodeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("codeId") ?? "");

  const code = await prisma.discountCode.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!code) return;

  await prisma.discountCode.update({
    where: { id },
    data: { active: !code.active },
  });
  revalidatePath("/admin/codes");
  revalidatePath("/admin");
}

/**
 * Delete a code outright. The cascade takes its redemption rows with it —
 * plans already granted stay granted (they live on the user), but "who used
 * this code" is gone for good, which is exactly what deleting means.
 */
export async function deleteCodeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("codeId") ?? "");

  await prisma.discountCode.deleteMany({ where: { id } });
  revalidatePath("/admin/codes");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------- redeeming

/** What a member does in Settings. The only non-admin action in this file. */
export async function redeemCodeAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const me = await requireUser();
  const d = await getDict();

  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (!code) return { error: d.admin.redeem.errors.UNKNOWN };

  const row = await prisma.discountCode.findUnique({
    where: { code },
    include: { _count: { select: { redemptions: true } } },
  });

  const [mine, used] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      select: { plan: true, planUntil: true },
    }),
    row
      ? prisma.discountRedemption.findUnique({
          where: { codeId_userId: { codeId: row.id, userId: me.id } },
          select: { id: true },
        })
      : null,
  ]);
  if (!mine) return { error: d.admin.redeem.errors.UNKNOWN };

  const check = checkRedeem(
    row,
    row?._count.redemptions ?? 0,
    !!used,
    mine,
    new Date(),
  );
  if (!check.ok) return { error: d.admin.redeem.errors[check.reason] };

  // The unique (codeId, userId) index is what actually stops a double
  // redemption — two taps on a slow connection race past the check above.
  try {
    await prisma.$transaction([
      prisma.discountRedemption.create({
        data: {
          codeId: row!.id,
          userId: me.id,
          grantedPlan: check.plan,
          grantedUntil: check.until,
        },
      }),
      prisma.user.update({
        where: { id: me.id },
        data: { plan: check.plan, planUntil: check.until },
      }),
    ]);
  } catch {
    return { error: d.admin.redeem.errors.ALREADY };
  }

  revalidatePath("/", "layout");
  return { ok: fill(d.admin.redeem.done, { plan: planLabel(check.plan, d) }) };
}

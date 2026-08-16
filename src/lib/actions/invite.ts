"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createInvite,
  isPresetKey,
  redeemInviteFor,
  revokeInvite,
} from "@/lib/invite";

export async function createInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const preset = String(formData.get("preset") ?? "group");
  if (!isPresetKey(preset)) return;

  await createInvite(user.id, preset);
  revalidatePath("/invite");
  revalidatePath("/rate");
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return;

  await revokeInvite(user.id, inviteId);
  revalidatePath("/invite");
  revalidatePath("/rate");
}

/**
 * An already-signed-in visitor accepting someone's link.
 *
 * Redeeming is a write, so it cannot happen while /i/[code] renders — the
 * page shows a button that posts here instead.
 */
export async function acceptInviteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const fallback = String(formData.get("username") ?? "");

  const inviter = await redeemInviteFor(user.id);
  redirect(`/rate/${inviter ?? fallback}`);
}

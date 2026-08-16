"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { redeemInviteFor, rotateInvite } from "@/lib/invite";

/** Revoke the current link and mint a replacement. */
export async function rotateInviteAction(): Promise<void> {
  const user = await requireUser();
  await rotateInvite(user.id);
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

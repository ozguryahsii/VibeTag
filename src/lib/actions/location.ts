"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { coarsen, isValidCoord } from "@/lib/geo";

export type LocationState = { error?: string; ok?: boolean };

export async function saveLocationAction(
  _prev: LocationState,
  formData: FormData,
): Promise<LocationState> {
  const user = await requireUser();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!isValidCoord(lat, lng)) return { error: "invalid" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      shareLocation: true,
      lat: coarsen(lat),
      lng: coarsen(lng),
      locationAt: new Date(),
    },
  });

  revalidatePath("/people");
  return { ok: true };
}

export async function disableLocationAction(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { shareLocation: false, lat: null, lng: null, locationAt: null },
  });
  revalidatePath("/people");
}

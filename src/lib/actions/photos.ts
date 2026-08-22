"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { canAddPhoto, photoLimit } from "@/lib/photos";

/**
 * The photo set's write side.
 *
 * One rule does all the work: a plan buys N photos, exactly one of them is
 * the profile picture (`User.avatarUrl`, so every screen that already reads
 * an avatar keeps working), and everything else shows automatically as a
 * side circle. There is no second flag to keep in sync, which is why there
 * is no second thing to get wrong.
 */

const MAX_PHOTO_BYTES = 400_000;
const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

export type PhotoState = { error?: string; ok?: string };

/** Add one cropped JPEG. */
export async function addPhotoAction(
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const me = await requireUser();
  const d = await getDict();
  const url = String(formData.get("photo") ?? "").trim();

  if (!JPEG.test(url)) return { error: d.auth.errors.imageFormat };
  if (url.length > MAX_PHOTO_BYTES) return { error: d.auth.errors.imageLarge };

  const count = await prisma.profilePhoto.count({ where: { userId: me.id } });
  if (!canAddPhoto(count, me.plan)) {
    return { error: fill(d.photos.full, { n: photoLimit(me.plan) }) };
  }

  const photo = await prisma.profilePhoto.create({
    data: { userId: me.id, url, position: count },
  });

  // The first picture is the profile picture. Nobody uploads their only
  // photo meaning "show this one to the side".
  if (!me.avatarUrl) {
    await prisma.user.update({
      where: { id: me.id },
      data: { avatarUrl: photo.url },
    });
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/", "layout");
  return { ok: d.photos.added };
}

/** Make one photo the profile picture; the previous one becomes a side circle. */
export async function setMainPhotoAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("photoId") ?? "");

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, userId: me.id },
    select: { url: true },
  });
  if (!photo) return;

  await prisma.user.update({
    where: { id: me.id },
    data: { avatarUrl: photo.url },
  });

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/", "layout");
}

/** Remove one photo for good. */
export async function deletePhotoAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("photoId") ?? "");

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, userId: me.id },
    select: { url: true },
  });
  if (!photo) return;

  await prisma.profilePhoto.deleteMany({ where: { id, userId: me.id } });

  // Deleting the profile picture promotes the next photo rather than leaving
  // the profile pointing at something that no longer exists.
  if (photo.url === me.avatarUrl) {
    const next = await prisma.profilePhoto.findFirst({
      where: { userId: me.id },
      orderBy: { position: "asc" },
      select: { url: true },
    });
    await prisma.user.update({
      where: { id: me.id },
      data: { avatarUrl: next?.url ?? null },
    });
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/", "layout");
}

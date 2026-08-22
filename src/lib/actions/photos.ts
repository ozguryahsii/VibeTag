"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { VAULT_SIZE, canAddToVault, showcaseLimit } from "@/lib/photos";

/**
 * The photo vault's write side.
 *
 * Three rules run through all of it. The vault holds ten and no more. The
 * main photo is whatever `User.avatarUrl` points at, so every screen that
 * already reads an avatar keeps working untouched. And the showcase — the
 * small circles beside the main photo — is capped by plan on the server,
 * because a client that forgets the cap must not be able to publish six
 * pictures on a Free account.
 */

const MAX_PHOTO_BYTES = 400_000;
const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

export type PhotoState = { error?: string; ok?: string };

/** Add one cropped JPEG to the vault. */
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
  if (!canAddToVault(count)) {
    return { error: fill(d.photos.vaultFull, { n: VAULT_SIZE }) };
  }

  const photo = await prisma.profilePhoto.create({
    data: { userId: me.id, url, position: count },
  });

  // An empty profile gets its first upload as the main photo — nobody
  // uploads their first picture meaning "keep this one hidden".
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

/** Make one vault photo the main one. */
export async function setMainPhotoAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("photoId") ?? "");

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, userId: me.id },
    select: { url: true },
  });
  if (!photo) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: me.id }, data: { avatarUrl: photo.url } }),
    // The main photo is never also a side circle: it would appear twice.
    prisma.profilePhoto.update({ where: { id }, data: { showcase: false } }),
  ]);

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/", "layout");
}

/** Put one photo in the side circles, or take it out. */
export async function toggleShowcaseAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("photoId") ?? "");

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, userId: me.id },
    select: { id: true, url: true, showcase: true },
  });
  if (!photo) return;
  // Turning one on is the only direction with a limit to check.
  if (!photo.showcase) {
    if (photo.url === me.avatarUrl) return;
    const shown = await prisma.profilePhoto.count({
      where: { userId: me.id, showcase: true },
    });
    if (shown >= showcaseLimit(me.plan)) return;
  }

  await prisma.profilePhoto.update({
    where: { id },
    data: { showcase: !photo.showcase },
  });

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
}

/** Remove one photo from the vault for good. */
export async function deletePhotoAction(formData: FormData): Promise<void> {
  const me = await requireUser();
  const id = String(formData.get("photoId") ?? "");

  const photo = await prisma.profilePhoto.findFirst({
    where: { id, userId: me.id },
    select: { url: true },
  });
  if (!photo) return;

  await prisma.profilePhoto.deleteMany({ where: { id, userId: me.id } });

  // Deleting the main photo leaves the profile on initials rather than on a
  // picture that no longer exists in the vault.
  if (photo.url === me.avatarUrl) {
    await prisma.user.update({ where: { id: me.id }, data: { avatarUrl: null } });
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${me.username}`);
  revalidatePath("/", "layout");
}

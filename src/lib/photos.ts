import type { Plan } from "@/lib/auth";

/**
 * How many pictures a plan may hold.
 *
 * One rule, not two: a plan buys a number of photos, and exactly one of them
 * is the profile picture. Everything else somebody uploaded shows as a side
 * circle automatically — there is no second decision to make, and therefore
 * no second switch to explain.
 *
 * Free keeps one, which is the profile picture and nothing beside it.
 */
export const PHOTO_LIMIT: Record<Plan, number> = {
  FREE: 1,
  SILVER: 4,
  GOLD: 7,
};

export function photoLimit(plan: string): number {
  return PHOTO_LIMIT[plan as Plan] ?? PHOTO_LIMIT.FREE;
}

export function canAddPhoto(count: number, plan: string): boolean {
  return count < photoLimit(plan);
}

/**
 * Which row is the profile picture.
 *
 * `User.avatarUrl` holds the picture, not a row id, so the row is found by
 * matching it — and the *first* match wins. Two identical uploads share a
 * URL, and without "first wins" both would call themselves the profile
 * picture and both would vanish from the side circles.
 */
export function mainPhotoId<T extends { id: string; url: string }>(
  photos: T[],
  mainUrl: string | null,
): string | null {
  if (!mainUrl) return null;
  return photos.find((p) => p.url === mainUrl)?.id ?? null;
}

/**
 * The side circles: everything except the profile picture, trimmed to what
 * the plan allows.
 *
 * A downgrade must not publish more than the new plan permits and must not
 * delete anything either, so the extras simply stop being shown — the ones
 * dropped are the newest, since the oldest are the ones already familiar to
 * anyone who has seen the profile.
 */
export function sidePhotos<T extends { id: string; url: string }>(
  photos: T[],
  mainUrl: string | null,
  plan: string,
): T[] {
  const main = mainPhotoId(photos, mainUrl);
  return photos
    .filter((p) => p.id !== main)
    .slice(0, Math.max(0, photoLimit(plan) - 1));
}

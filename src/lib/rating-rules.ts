import { RATING_UPDATE_COOLDOWN_DAYS } from "@/lib/taxonomy";

const DAY_MS = 86_400_000;

/** Days left before this rater may revise their rating again (0 = now). */
export function cooldownDaysLeft(lastUpdatedAt: Date | null): number {
  if (!lastUpdatedAt) return 0;
  const elapsed = Date.now() - lastUpdatedAt.getTime();
  const left = RATING_UPDATE_COOLDOWN_DAYS * DAY_MS - elapsed;
  return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

export function nextUpdateDate(lastUpdatedAt: Date | null): Date | null {
  if (!lastUpdatedAt) return null;
  return new Date(lastUpdatedAt.getTime() + RATING_UPDATE_COOLDOWN_DAYS * DAY_MS);
}

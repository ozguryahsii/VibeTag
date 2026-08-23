/**
 * How many tags a card shows — one number, three screens.
 *
 * The Vibe Card, the home card and the profile card all show somebody's top
 * tags, and they must agree: two of them saying different things about the
 * same person makes one of them look wrong, with no way for the reader to
 * tell which. So the rule lives here rather than as a `slice(0, 5)` written
 * out in each place, where the copies drift the first time one is changed.
 *
 * Five, in vote order, highest first — `getVibeProfile` already sorts them.
 */
export const CARD_TAG_COUNT = 5;

export function topTags<T>(tags: T[]): T[] {
  return tags.slice(0, CARD_TAG_COUNT);
}

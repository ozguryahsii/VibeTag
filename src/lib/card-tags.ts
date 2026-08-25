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

/**
 * "1 person", not "1 people".
 *
 * The card counts its raters in the corner, and at one rater the English
 * copy read "Rated by 1 people" — which is the first thing a new account
 * sees, and the first thing anybody screenshotting the app for a store
 * listing sees. Turkish does not pluralise after a number, so both words
 * are the same there and this quietly does nothing.
 *
 * A rule rather than a ternary at the call site: the card is drawn onto a
 * canvas, so nothing about it can be asserted afterwards — the wording has
 * to be checkable on its own or not at all.
 */
export function peopleWord(
  count: number,
  words: { people: string; person: string },
): string {
  return count === 1 ? words.person : words.people;
}

/**
 * Locale handling.
 *
 * Cookie-based rather than path-based: every screen is behind a session
 * anyway, so /en/... segments would buy nothing and would break the invite
 * links people have already shared.
 */
export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "vt_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

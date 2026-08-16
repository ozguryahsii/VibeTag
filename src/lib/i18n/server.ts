import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { dictionaryFor, type Dictionary } from "@/lib/i18n";

/** The visitor's locale, deduped per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/**
 * Copy for the current request. Server components and server actions both
 * read the same cookie, so an error message comes back in the language the
 * person is reading the screen in.
 */
export async function getDict(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}

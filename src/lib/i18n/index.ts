import { en, type Dictionary } from "@/lib/i18n/en";
import { tr } from "@/lib/i18n/tr";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export type { Dictionary };
export * from "@/lib/i18n/config";

const DICTIONARIES: Record<Locale, Dictionary> = { en, tr };

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Fill {placeholders} in a copy string. */
export function fill(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m,
  );
}

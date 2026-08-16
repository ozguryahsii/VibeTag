"use client";

import { createContext, useContext } from "react";
import { fill, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Ctx = { locale: Locale; d: Dictionary };

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, d: dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Copy inside client components. */
export function useD(): Dictionary {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useD must be used inside LocaleProvider");
  return ctx.d;
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  return ctx?.locale ?? "en";
}

export { fill };

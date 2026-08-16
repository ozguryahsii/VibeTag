"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/config";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });

  // Every screen renders copy, so the whole tree is stale after a switch.
  revalidatePath("/", "layout");
}

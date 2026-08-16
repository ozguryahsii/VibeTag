"use client";

import { setLocaleAction } from "@/lib/actions/locale";
import { LOCALES } from "@/lib/i18n/config";
import { useD, useLocale } from "@/components/LocaleProvider";

/**
 * EN | TR switch. A form rather than a fetch because the choice lives in a
 * cookie and only a server action may write one; a client component so the
 * sign-in and onboarding screens — which are themselves client trees — can
 * offer the switch before an account exists.
 */
export function LangToggle({ className = "" }: { className?: string }) {
  const current = useLocale();
  const d = useD();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-warmwhite p-0.5 ${className}`}
      role="group"
      aria-label={d.common.language}
    >
      {LOCALES.map((l) => {
        const active = l === current;
        return (
          <form key={l} action={setLocaleAction}>
            <input type="hidden" name="locale" value={l} />
            <button
              type="submit"
              aria-pressed={active}
              className="px-2.5 h-7 rounded-full text-[11px] font-extrabold tracking-wide transition-colors"
              style={{
                color: active ? "#fff" : "#8C8177",
                backgroundImage: active
                  ? "linear-gradient(135deg,#FF8A3D,#FF5C77)"
                  : "none",
              }}
            >
              {l.toUpperCase()}
            </button>
          </form>
        );
      })}
    </div>
  );
}

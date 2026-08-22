"use client";

import { useRouter } from "next/navigation";
import { ICONS } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { useD } from "@/components/LocaleProvider";

/**
 * The ← in the top-left of a sheet-style screen.
 *
 * history.back() so the sheet returns to whichever tab opened it; a fresh
 * session that landed here directly (a push notification tap) has no
 * history to go back to, so home is the fallback.
 */
export function BackButton() {
  const d = useD();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/home");
      }}
      aria-label={d.common.back}
      className="w-11 h-11 grid place-items-center rounded-full bg-warmwhite border border-line active:scale-95 transition-transform"
    >
      <IconGlyph def={ICONS.arrowLeft} size={19} color="#6B6B6B" />
    </button>
  );
}

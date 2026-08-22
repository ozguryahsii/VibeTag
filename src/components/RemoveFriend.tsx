"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { removeFriendAction } from "@/lib/actions/social";
import { fill, useD } from "@/components/LocaleProvider";

/**
 * The "−" next to a friend, with a question before it does anything.
 *
 * Unfriending is rare and destructive, and a bare icon makes it one stray
 * tap away — so the icon only opens a confirm. Rendered through a portal
 * for the same reason as PhotoLightbox: the friend card animates, and a
 * transformed ancestor would trap `position: fixed` inside it.
 */
export function RemoveFriend({ name, username }: { name: string; username: string }) {
  const d = useD();
  const [open, setOpen] = useState(false);

  const dialog = open ? (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6 vt-fade"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[340px] rounded-[26px] bg-warmwhite border border-line p-6 shadow-[0_24px_70px_rgba(76,44,31,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[15px] font-extrabold">{d.people.removeTitle}</p>
        <p className="text-[13px] text-muted leading-relaxed mt-1.5">
          {fill(d.people.removeBody, { name })}
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 h-11 rounded-full bg-white border border-line text-[13px] font-bold text-muted active:scale-[0.98] transition-transform"
          >
            {d.common.no}
          </button>
          <form action={removeFriendAction} className="flex-1">
            <input type="hidden" name="username" value={username} />
            <button className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-[#F05262] active:scale-[0.98] transition-transform">
              {d.common.yes}
            </button>
          </form>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={d.people.removeFriend}
        title={d.people.removeFriend}
        className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3 py-2 active:scale-95 transition-transform"
      >
        −
      </button>
      {dialog && createPortal(dialog, document.body)}
    </>
  );
}

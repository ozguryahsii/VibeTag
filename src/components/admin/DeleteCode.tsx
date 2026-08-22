"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { deleteCodeAction } from "@/lib/actions/admin";
import { fill, useD } from "@/components/LocaleProvider";

/**
 * Deleting a code erases its redemption history too, so the button asks
 * first — same portal-confirm shape as RemoveFriend, and for the same
 * reason: destructive things should cost two taps, not one.
 */
export function DeleteCode({ codeId, code }: { codeId: string; code: string }) {
  const d = useD();
  const [open, setOpen] = useState(false);
  const a = d.admin.codes;

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
        <p className="text-[15px] font-extrabold">{a.deleteTitle}</p>
        <p className="text-[13px] text-muted leading-relaxed mt-1.5">
          {fill(a.deleteBody, { code })}
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 h-11 rounded-full bg-white border border-line text-[13px] font-bold text-muted active:scale-[0.98] transition-transform"
          >
            {d.common.no}
          </button>
          <form action={deleteCodeAction} className="flex-1">
            <input type="hidden" name="codeId" value={codeId} />
            <button className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-[#F05262] active:scale-[0.98] transition-transform">
              {a.deleteConfirm}
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
        className="text-[12px] font-bold text-coral bg-coral/8 border border-coral/25 rounded-full px-3.5 py-2"
      >
        {a.deleteCta}
      </button>
      {dialog && createPortal(dialog, document.body)}
    </>
  );
}

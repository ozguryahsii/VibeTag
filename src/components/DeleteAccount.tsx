"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type SafetyState } from "@/lib/actions/safety";
import { fill, useD } from "@/components/LocaleProvider";

export function DeleteAccount({
  username,
  plan,
}: {
  username: string;
  plan: string;
}) {
  const d = useD();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SafetyState, FormData>(
    deleteAccountAction,
    {},
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-full bg-white border border-coral/30 text-[14px] font-bold text-coral active:scale-[0.98] transition-transform"
      >
        {d.settings.deleteAccount}
      </button>
    );
  }

  return (
    <form action={action} className="card p-5 border-coral/30">
      <p className="text-[10px] font-extrabold tracking-[0.2em] text-coral mb-2">
        {d.settings.dangerZone}
      </p>
      <p className="vt-page-title text-[21px] leading-tight text-ink">
        {d.settings.deleteTitle}
      </p>
      <p className="text-[12.5px] text-muted mt-2 leading-relaxed">
        {d.settings.deleteBody}
      </p>

      {/* A store subscription outlives account deletion — the store, not
          this delete, controls renewal. Only worth saying to someone it
          could actually surprise. */}
      {plan !== "FREE" && (
        <p className="mt-3 rounded-[16px] border border-orange/25 bg-tagbg px-3.5 py-3 text-[12px] leading-relaxed text-orange">
          {d.settings.deleteStoreWarning}
        </p>
      )}

      <label className="block mt-4">
        <span
          className="block text-[11px] font-extrabold tracking-[0.08em] text-muted mb-2 ml-1 [&_b]:text-ink"
          dangerouslySetInnerHTML={{
            __html: fill(d.settings.deleteConfirm, {
              username: `<b>${username}</b>`,
            }),
          }}
        />
        <input
          name="confirm"
          autoComplete="off"
          className="w-full rounded-[18px] border border-line bg-cream px-4 h-12 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10"
        />
      </label>

      {state.error && (
        <p className="mt-3 text-[12.5px] font-semibold text-coral">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-12 px-6 rounded-full bg-white border border-line font-bold text-[14px]"
        >
          {d.common.cancel}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 h-12 rounded-full bg-coral text-white font-bold text-[14.5px] disabled:opacity-50"
        >
          {pending ? d.settings.deleting : d.settings.deleteCta}
        </button>
      </div>
    </form>
  );
}

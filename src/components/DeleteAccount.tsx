"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type SafetyState } from "@/lib/actions/safety";

export function DeleteAccount({ username }: { username: string }) {
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
        Hesabımı sil
      </button>
    );
  }

  return (
    <form action={action} className="card p-5 border-coral/30">
      <p className="text-[14px] font-extrabold text-coral">
        Hesabını kalıcı olarak silmek üzeresin
      </p>
      <p className="text-[12.5px] text-muted mt-2 leading-relaxed">
        Profilin, aldığın ve verdiğin tüm değerlendirmeler, davetlerin ve
        bildirimlerin silinir. Bu işlem geri alınamaz — sana verilen
        değerlendirmeler de dahil hiçbir veri saklanmaz.
      </p>

      <label className="block mt-4">
        <span className="block text-[12px] font-bold text-muted mb-1.5 ml-1">
          Onaylamak için <b className="text-ink">{username}</b> yaz
        </span>
        <input
          name="confirm"
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-cream px-4 h-12 text-[14.5px] outline-none focus:border-coral/60"
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
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 h-12 rounded-full bg-coral text-white font-bold text-[14.5px] disabled:opacity-50"
        >
          {pending ? "Siliniyor…" : "Kalıcı olarak sil"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/actions/auth";
import { useD } from "@/components/LocaleProvider";

/**
 * Name and bio.
 *
 * The accent colour is not chosen here any more (decided 2026-08-28): every
 * account gets one at sign-up, and a photo replaces it soon enough that a
 * picker was a setting nobody needed. The profile picture is deliberately
 * absent too: photos are managed in one place, the photo box below, which
 * also decides which of them is the profile one. Two forms writing the same
 * avatar is how a saved name used to quietly undo a just-chosen picture.
 */
export function ProfileEditor({
  name,
  bio,
}: {
  name: string;
  bio: string;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={action} className="card p-5 grid gap-5">
      <label className="block">
        <span className="block text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-muted mb-2 ml-1">
          {d.settings.name}
        </span>
        <input
          name="name"
          defaultValue={name}
          className="w-full rounded-[18px] border border-line bg-cream px-4 h-12 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition"
        />
      </label>

      <label className="block">
        <span className="block text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-muted mb-2 ml-1">
          {d.settings.bio}
        </span>
        <textarea
          name="bio"
          defaultValue={bio}
          rows={2}
          maxLength={160}
          placeholder={d.settings.bioPlaceholder}
          className="w-full rounded-[18px] border border-line bg-cream px-4 py-3 text-[14.5px] outline-none focus:border-coral/60 focus:ring-4 focus:ring-coral/10 transition resize-none"
        />
      </label>

      {state.error && (
        <p className="text-[12.5px] font-semibold text-coral">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-[12.5px] font-semibold text-orange">
          {d.settings.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full grad-score text-white font-bold text-[14.5px] active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {pending ? d.common.saving : d.common.save}
      </button>
    </form>
  );
}

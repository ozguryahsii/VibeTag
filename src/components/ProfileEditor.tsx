"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/actions/auth";
import { useD } from "@/components/LocaleProvider";

const COLORS = ["#FF8A3D", "#FF5C77", "#FF7AA2", "#E8845C", "#D96C5F", "#F3A76F"];

/**
 * Name, bio and accent colour.
 *
 * The profile picture is deliberately absent: photos are managed in one
 * place, the photo box below, which also decides which of them is the
 * profile one. Two forms writing the same avatar is how a saved name used to
 * quietly undo a just-chosen picture.
 */
export function ProfileEditor({
  name,
  bio,
  avatarColor,
}: {
  name: string;
  bio: string;
  avatarColor: string;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );
  const [color, setColor] = useState(avatarColor);

  return (
    <form action={action} className="card p-5 grid gap-5">
      <input type="hidden" name="avatarColor" value={color} />

      <div>
        <span className="block text-[10.5px] font-extrabold tracking-[0.14em] uppercase text-muted mb-2.5 ml-1">
          {d.settings.accentColour}
        </span>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className="w-9 h-9 rounded-full transition-transform active:scale-90"
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

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

"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/actions/auth";
import { Avatar } from "@/components/Avatar";
import { PhotoCropper } from "@/components/PhotoCropper";
import { useD } from "@/components/LocaleProvider";

const COLORS = ["#FF8A3D", "#FF5C77", "#FF7AA2", "#E8845C", "#D96C5F", "#F3A76F"];

export function ProfileEditor({
  name,
  bio,
  avatarUrl,
  avatarColor,
}: {
  name: string;
  bio: string;
  avatarUrl: string | null;
  avatarColor: string;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );
  const [photo, setPhoto] = useState<string | null>(avatarUrl);
  const [color, setColor] = useState(avatarColor);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file twice still opens the cropper.
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif|gif|avif)$/.test(file.type)) {
      setLocalError(d.settings.photoBadType);
      return;
    }
    setLocalError(null);
    setCropping(file);
  }

  return (
    <form action={action} className="card p-5 grid gap-5">
      <input type="hidden" name="avatarUrl" value={photo ?? ""} />
      <input type="hidden" name="avatarColor" value={color} />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full active:scale-95 transition-transform"
          aria-label={d.settings.photoPick}
        >
          <Avatar name={name} url={photo} color={color} size={68} ring />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full grid place-items-center text-[12px] font-black text-white grad-score"
            style={{ boxShadow: "0 0 0 2.5px #FFF8F5" }}
          >
            +
          </span>
        </button>

        <div className="flex-1">
          <p className="text-[13.5px] font-extrabold">{d.settings.photo}</p>
          <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
            {photo ? d.settings.photoChange : d.settings.photoNone}
          </p>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-[11.5px] font-bold text-coral mt-1"
            >
              {d.settings.photoRemove}
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {cropping && (
        <PhotoCropper
          file={cropping}
          onCancel={() => setCropping(null)}
          onDone={(dataUrl) => {
            setPhoto(dataUrl);
            setCropping(null);
          }}
        />
      )}

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

      {(localError || state.error) && (
        <p className="text-[12.5px] font-semibold text-coral">
          {localError ?? state.error}
        </p>
      )}
      {state.ok && !localError && (
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

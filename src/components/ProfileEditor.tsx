"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/actions/auth";
import { Avatar } from "@/components/Avatar";

const COLORS = ["#FF8A3D", "#FF5C77", "#FF7AA2", "#8B5CF6", "#E8845C", "#5AA9E6"];

/** Downscale to a square 512px JPEG before it ever leaves the device. */
async function toSquareDataUrl(file: File, size = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", 0.82);
}

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
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );
  const [photo, setPhoto] = useState<string | null>(avatarUrl);
  const [color, setColor] = useState(avatarColor);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) {
      setLocalError("JPG, PNG veya WebP bir görsel seç.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      setPhoto(await toSquareDataUrl(file));
    } catch {
      setLocalError("Görsel okunamadı, başka bir dosya dener misin?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="card p-5 grid gap-4">
      <input type="hidden" name="avatarUrl" value={photo ?? ""} />
      <input type="hidden" name="avatarColor" value={color} />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full active:scale-95 transition-transform"
          aria-label="Profil fotoğrafı seç"
        >
          <Avatar name={name} url={photo} color={color} size={68} ring />
          <span
            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full grid place-items-center text-[13px] text-white grad-score"
            style={{ boxShadow: "0 0 0 2.5px #FFF8F5" }}
          >
            ✎
          </span>
        </button>

        <div className="flex-1">
          <p className="text-[13.5px] font-extrabold">Profil fotoğrafın</p>
          <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
            {busy
              ? "Hazırlanıyor…"
              : photo
                ? "Değiştirmek için dokun."
                : "Fotoğraf yoksa baş harflerin gösterilir."}
          </p>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-[11.5px] font-bold text-coral mt-1"
            >
              Fotoğrafı kaldır
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

      <div>
        <span className="block text-[12px] font-bold text-muted mb-2 ml-1">
          Vurgu rengi
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
        <span className="block text-[12px] font-bold text-muted mb-1.5 ml-1">
          İsim
        </span>
        <input
          name="name"
          defaultValue={name}
          className="w-full rounded-2xl border border-line bg-cream px-4 h-12 text-[14.5px] outline-none focus:border-orange/60 transition"
        />
      </label>

      <label className="block">
        <span className="block text-[12px] font-bold text-muted mb-1.5 ml-1">
          Bio
        </span>
        <textarea
          name="bio"
          defaultValue={bio}
          rows={2}
          maxLength={160}
          placeholder="Kendini bir cümleyle anlat"
          className="w-full rounded-2xl border border-line bg-cream px-4 py-3 text-[14.5px] outline-none focus:border-orange/60 transition resize-none"
        />
      </label>

      {(localError || state.error) && (
        <p className="text-[12.5px] font-semibold text-coral">
          {localError ?? state.error}
        </p>
      )}
      {state.ok && !localError && (
        <p className="text-[12.5px] font-semibold text-orange">
          Profilin güncellendi ✓
        </p>
      )}

      <button
        type="submit"
        disabled={pending || busy}
        className="h-12 rounded-full grad-score text-white font-bold text-[14.5px] active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

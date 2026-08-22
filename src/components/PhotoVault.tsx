"use client";

import { useActionState, useRef, useState } from "react";
import {
  addPhotoAction,
  deletePhotoAction,
  setMainPhotoAction,
  type PhotoState,
} from "@/lib/actions/photos";
import { PhotoCropper } from "@/components/PhotoCropper";
import { fill, useD } from "@/components/LocaleProvider";
import { Card } from "@/components/ui";

export type VaultPhoto = {
  id: string;
  url: string;
  isMain: boolean;
};

/**
 * Somebody's photos, all managed in one box.
 *
 * The only decision is which picture is the profile one — a tick in the
 * corner of each thumbnail, filled on the chosen one. Everything else is a
 * side circle automatically, so nothing here asks a second question.
 */
export function PhotoVault({
  photos,
  limit,
}: {
  photos: VaultPhoto[];
  limit: number;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<PhotoState, FormData>(
    addPhotoAction,
    {},
  );
  const [cropping, setCropping] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const full = photos.length >= limit;
  const sideCount = Math.max(0, photos.length - 1);

  return (
    <Card>
      <p className="text-[13.5px] font-extrabold">{d.photos.title}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {limit > 1
          ? fill(d.photos.body, { n: limit, side: limit - 1 })
          : d.photos.bodyFree}
      </p>

      {photos.length > 0 && (
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className={`aspect-square w-full rounded-[18px] object-cover border-2 ${
                  p.isMain ? "border-orange" : "border-line"
                }`}
              />

              {/* The one decision, as a tick rather than a sentence. */}
              <form action={setMainPhotoAction}>
                <input type="hidden" name="photoId" value={p.id} />
                <button
                  disabled={p.isMain}
                  aria-label={d.photos.setMain}
                  title={p.isMain ? d.photos.main : d.photos.setMain}
                  className={`absolute left-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border text-[13px] font-black transition-transform active:scale-90 ${
                    p.isMain
                      ? "grad-score border-transparent text-white shadow-[0_4px_12px_rgba(255,92,119,0.35)]"
                      : "border-white/80 bg-black/25 text-white/90 backdrop-blur-[2px]"
                  }`}
                >
                  ✓
                </button>
              </form>

              <form action={deletePhotoAction}>
                <input type="hidden" name="photoId" value={p.id} />
                <button
                  aria-label={d.photos.deletePhoto}
                  title={d.photos.deletePhoto}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full border border-white/80 bg-black/25 text-[14px] font-black text-white/90 backdrop-blur-[2px] transition-transform active:scale-90"
                >
                  ×
                </button>
              </form>

              <span
                className={`absolute inset-x-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-center text-[9.5px] font-black ${
                  p.isMain
                    ? "bg-white/90 text-orange"
                    : "bg-black/30 text-white/90"
                }`}
              >
                {p.isMain ? d.photos.main : d.photos.side}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-muted">
        {fill(d.photos.count, { used: photos.length, max: limit })}
        {limit > 1 && ` · ${fill(d.photos.sideCount, { n: sideCount })}`}
      </p>

      {/* Pick → crop to JPEG → submit the data URL. */}
      <form action={action} ref={formRef} className="mt-3">
        <input type="hidden" name="photo" value={pendingUrl ?? ""} />
      </form>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset first, so picking the same file twice still opens the cropper.
          e.target.value = "";
          if (!file) return;
          if (!/^image\/(jpeg|png|webp|heic|heif|gif|avif)$/.test(file.type)) {
            setLocalError(d.settings.photoBadType);
            return;
          }
          setLocalError(null);
          setCropping(file);
        }}
      />
      <button
        type="button"
        disabled={full || pending}
        onClick={() => fileRef.current?.click()}
        className="mt-1 h-11 w-full rounded-full grad-score text-[13.5px] font-bold text-white disabled:opacity-40"
      >
        {pending ? d.photos.adding : d.photos.add}
      </button>
      {full && (
        <p className="mt-2 text-[12px] font-semibold text-muted">
          {fill(d.photos.full, { n: limit })}
        </p>
      )}
      {(localError || state.error) && (
        <p className="mt-2 text-[12.5px] font-bold text-coral">
          {localError ?? state.error}
        </p>
      )}
      {state.ok && !state.error && !localError && (
        <p className="mt-2 text-[12.5px] font-bold text-orange">{state.ok}</p>
      )}

      {cropping && (
        <PhotoCropper
          file={cropping}
          onCancel={() => setCropping(null)}
          onDone={(dataUrl) => {
            setCropping(null);
            setPendingUrl(dataUrl);
            // The hidden field is controlled, so submit on the next frame,
            // once React has written the value into the form.
            requestAnimationFrame(() => formRef.current?.requestSubmit());
          }}
        />
      )}
    </Card>
  );
}

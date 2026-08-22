"use client";

import { useActionState, useRef, useState } from "react";
import {
  addPhotoAction,
  deletePhotoAction,
  setMainPhotoAction,
  toggleShowcaseAction,
  type PhotoState,
} from "@/lib/actions/photos";
import { PhotoCropper } from "@/components/PhotoCropper";
import { fill, useD } from "@/components/LocaleProvider";
import { Card } from "@/components/ui";

export type VaultPhoto = {
  id: string;
  url: string;
  showcase: boolean;
  isMain: boolean;
};

/**
 * Where somebody runs their own pictures.
 *
 * A grid of thumbnails, each with the two decisions that exist: is this the
 * main photo, and does it ride beside the main one. The plan cap is shown as
 * a count rather than enforced by hiding buttons — "3 of 3 side photos" tells
 * you why the next tap does nothing, where a greyed-out button does not.
 */
export function PhotoVault({
  photos,
  vaultSize,
  showcaseLimit,
}: {
  photos: VaultPhoto[];
  vaultSize: number;
  showcaseLimit: number;
}) {
  const d = useD();
  const [state, action, pending] = useActionState<PhotoState, FormData>(
    addPhotoAction,
    {},
  );
  const [cropping, setCropping] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const shown = photos.filter((p) => p.showcase).length;
  const full = photos.length >= vaultSize;

  return (
    <Card>
      <p className="text-[13.5px] font-extrabold">{d.photos.title}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {fill(d.photos.body, { n: vaultSize })}
      </p>

      {photos.length === 0 ? (
        <p className="text-[12.5px] text-muted mt-3">{d.photos.empty}</p>
      ) : (
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {photos.map((p) => (
            <div key={p.id} className="grid gap-1.5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className={`aspect-square w-full rounded-[18px] object-cover border ${
                    p.isMain ? "border-orange" : "border-line"
                  }`}
                />
                {p.isMain && (
                  <span className="absolute left-1.5 top-1.5 rounded-full grad-score px-2 py-0.5 text-[9.5px] font-black text-white">
                    {d.photos.main}
                  </span>
                )}
                {p.showcase && !p.isMain && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-tagbg border border-orange/25 px-2 py-0.5 text-[9.5px] font-black text-orange">
                    {d.photos.showcaseOn}
                  </span>
                )}
              </div>

              {!p.isMain && (
                <form action={setMainPhotoAction}>
                  <input type="hidden" name="photoId" value={p.id} />
                  <button className="w-full rounded-full bg-tagbg border border-orange/20 py-1.5 text-[10.5px] font-bold text-orange">
                    {d.photos.setMain}
                  </button>
                </form>
              )}

              {!p.isMain && showcaseLimit > 0 && (
                <form action={toggleShowcaseAction}>
                  <input type="hidden" name="photoId" value={p.id} />
                  <button className="w-full rounded-full bg-white border border-line py-1.5 text-[10.5px] font-bold text-muted">
                    {p.showcase ? d.photos.showcaseOff : d.photos.showcase}
                  </button>
                </form>
              )}

              <form action={deletePhotoAction}>
                <input type="hidden" name="photoId" value={p.id} />
                <button className="w-full rounded-full bg-coral/8 border border-coral/25 py-1.5 text-[10.5px] font-bold text-coral">
                  {d.photos.deletePhoto}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11.5px] text-muted">
        {showcaseLimit > 0
          ? fill(d.photos.showcaseCount, { used: shown, max: showcaseLimit })
          : d.photos.freeNote}
      </p>

      {/* The upload path: pick → crop to JPEG → submit the data URL. */}
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
          if (file) setCropping(file);
          e.target.value = "";
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
          {fill(d.photos.vaultFull, { n: vaultSize })}
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-[12.5px] font-bold text-coral">{state.error}</p>
      )}
      {state.ok && !state.error && (
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

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { useD } from "@/components/LocaleProvider";

/**
 * The main photo with its side circles.
 *
 * Half the showcase sits left, half right, so the main photo stays the
 * centre of the row whatever the count — an odd number puts the extra on the
 * right, which reads as "and more" rather than as a lopsided pair. Tapping
 * any of them opens that picture full size in the app, never in a new tab:
 * these are somebody's face, not an asset to link to.
 */
export function PhotoRing({
  name,
  mainUrl,
  color,
  size,
  side = [],
  ring,
}: {
  name: string;
  mainUrl: string | null;
  color: string;
  size: number;
  side?: string[];
  ring?: boolean;
}) {
  const d = useD();
  const [open, setOpen] = useState<string | null>(null);
  const sideSize = Math.round(size * 0.42);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const half = Math.ceil(side.length / 2);
  const left = side.slice(0, Math.floor(side.length / 2));
  const right = side.slice(Math.floor(side.length / 2), half + half);

  const overlay = open ? (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-[3px] p-6 vt-fade"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={() => setOpen(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={open}
        alt={name}
        className="max-h-[80vh] w-auto max-w-full rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-4 text-[13px] font-bold text-white/80">{d.photo.close}</p>
    </div>
  ) : null;

  const circle = (url: string, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setOpen(url)}
      aria-label={d.photo.open}
      className="rounded-full active:scale-95 transition-transform"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        style={{ width: sideSize, height: sideSize }}
        className="rounded-full object-cover border-2 border-white shadow-[0_6px_16px_rgba(83,60,40,0.18)]"
      />
    </button>
  );

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {left.map((url, i) => circle(url, `l${i}`))}
        <button
          type="button"
          onClick={() => mainUrl && setOpen(mainUrl)}
          aria-label={d.photo.open}
          disabled={!mainUrl}
          className="rounded-full active:scale-95 transition-transform disabled:active:scale-100"
        >
          <Avatar name={name} url={mainUrl} color={color} size={size} ring={ring} />
        </button>
        {right.map((url, i) => circle(url, `r${i}`))}
      </div>
      {overlay && createPortal(overlay, document.body)}
    </>
  );
}

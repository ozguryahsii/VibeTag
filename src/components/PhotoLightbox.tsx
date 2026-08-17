"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { useD } from "@/components/LocaleProvider";

/**
 * A profile photo you can actually look at.
 *
 * Opening the raw file in a new tab would leave the app; this stays inside it,
 * closes on a tap outside or on Escape, and never offers a download — the
 * photo is somebody's face, not an asset.
 *
 * Rendered through a portal, which is not a detail: the identity card it sits
 * inside is animated, and a transformed ancestor turns `position: fixed` into
 * "fixed to that card". Without the portal the overlay covers the card and
 * nothing else, which looks like a broken modal because it is one.
 */
export function PhotoLightbox({
  name,
  url,
  color,
  size,
  ring,
}: {
  name: string;
  url: string | null;
  color: string;
  size: number;
  ring?: boolean;
}) {
  const d = useD();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The page behind must not scroll while a full-screen photo is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // No photo, nothing to enlarge: initials at 3× would be a joke, not a feature.
  if (!url) {
    return <Avatar name={name} url={null} color={color} size={size} ring={ring} />;
  }

  const overlay = open ? (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-[3px] p-6 vt-fade"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={() => setOpen(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        className="max-h-[80vh] w-auto max-w-full rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-4 text-[13px] font-bold text-white/80">{d.photo.close}</p>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={d.photo.open}
        className="rounded-full active:scale-95 transition-transform"
      >
        <Avatar name={name} url={url} color={color} size={size} ring={ring} />
      </button>
      {overlay && createPortal(overlay, document.body)}
    </>
  );
}

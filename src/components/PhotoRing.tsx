"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { useD } from "@/components/LocaleProvider";

/** Past this much horizontal travel, the drag counts as a swipe. */
const SWIPE = 36;

/**
 * The main photo with its side circles — a small carousel.
 *
 * Half the side photos sit left, half right, so the centre photo stays the
 * middle of the row whatever the count. Swiping left or right turns the ring:
 * the next photo takes the middle and the others shuffle around it, keeping
 * their order, so the row reads as one loop rather than as a list being
 * re-sorted. Nothing is saved — this is somebody looking through the photos,
 * not editing them.
 *
 * Tapping any of them opens that picture full size in the app, never in a new
 * tab: these are somebody's face, not an asset to link to.
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
  const [at, setAt] = useState(0);
  const sideSize = Math.round(size * 0.42);

  const all = mainUrl ? [mainUrl, ...side] : side;
  // A photo deleted while the page was open must not leave the ring pointing
  // past the end of the list.
  const index = all.length > 0 ? ((at % all.length) + all.length) % all.length : 0;

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

  /*
   * Where each photo sits once the ring has been turned.
   *
   * The list is rotated so the chosen photo is first, then the ones that come
   * *after* it go to the right and the ones that come *before* it go to the
   * left. Splitting a fixed array instead would make a photo jump from one
   * side to the other as the ring turns, which reads as a shuffle.
   */
  const centre = all[index] ?? null;
  const rest = [...all.slice(index + 1), ...all.slice(0, index)];
  const leftCount = Math.floor(rest.length / 2);
  const left = rest.slice(rest.length - leftCount);
  const right = rest.slice(0, rest.length - leftCount);

  // Pointer state lives in refs: a swipe should not re-render on every frame,
  // and the click that ends a drag has to be recognised after the fact.
  const start = useRef<number | null>(null);
  const dragged = useRef(false);

  function onDown(e: React.PointerEvent) {
    if (all.length < 2) return;
    start.current = e.clientX;
    dragged.current = false;
  }

  function onMove(e: React.PointerEvent) {
    if (start.current === null) return;
    if (Math.abs(e.clientX - start.current) > 6) dragged.current = true;
  }

  function onUp(e: React.PointerEvent) {
    if (start.current === null) return;
    const delta = e.clientX - start.current;
    start.current = null;
    // Swipe left to bring the next photo in from the right, and the other way
    // round — the photos follow the finger.
    if (delta <= -SWIPE) setAt((v) => v + 1);
    else if (delta >= SWIPE) setAt((v) => v - 1);
  }

  /** Swallow the click that ends a swipe, so it does not open the lightbox. */
  function onClickCapture(e: React.MouseEvent) {
    if (!dragged.current) return;
    dragged.current = false;
    e.preventDefault();
    e.stopPropagation();
  }

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

  /*
   * Side circles ride a full circle-height below the middle of the row.
   *
   * Level with the centre photo they read as photos of equal standing;
   * dropped, they read as the ones beside it. A transform rather than a
   * margin, so the row keeps the height of the main photo.
   */
  const circle = (url: string, key: string) => (
    <span
      key={key}
      className="inline-flex"
      style={{ transform: `translateY(${sideSize}px)` }}
    >
      <button
        type="button"
        onClick={() => setOpen(url)}
        aria-label={d.photo.open}
        className="rounded-full active:scale-95 transition-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{ width: sideSize, height: sideSize }}
          className="rounded-full object-cover border-2 border-white shadow-[0_6px_16px_rgba(83,60,40,0.18)]"
        />
      </button>
    </span>
  );

  // How far the dropped circles hang below the main photo, so whatever comes
  // next on the page keeps its distance instead of meeting a circle.
  const overhang = rest.length
    ? Math.max(0, sideSize - (size - sideSize) / 2)
    : 0;

  return (
    <>
      <div
        className="flex touch-pan-y select-none items-center justify-center gap-2"
        style={{ marginBottom: overhang }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (start.current = null)}
        onClickCapture={onClickCapture}
      >
        {left.map((url, i) => circle(url, `l${url}${i}`))}
        <button
          type="button"
          onClick={() => centre && setOpen(centre)}
          aria-label={d.photo.open}
          disabled={!centre}
          className="rounded-full active:scale-95 transition-transform disabled:active:scale-100"
        >
          <Avatar name={name} url={centre} color={color} size={size} ring={ring} />
        </button>
        {right.map((url, i) => circle(url, `r${url}${i}`))}
      </div>

      {/* Where in the loop we are. Without it a turned ring looks like the
          photos rearranged themselves for no reason. */}
      {all.length > 1 && (
        <div
          className="mt-1 flex items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          {all.map((url, i) => (
            <span
              key={`${url}${i}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-coral" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      )}

      {overlay && createPortal(overlay, document.body)}
    </>
  );
}

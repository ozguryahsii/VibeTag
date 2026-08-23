"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { useD } from "@/components/LocaleProvider";

/** Past this much horizontal travel, the drag counts as a swipe. */
const SWIPE = 40;

/**
 * The main photo with its side circles.
 *
 * The row itself never moves: the profile picture stays in the middle and the
 * side photos sit beside it, half left, half right, dropped a circle-height so
 * they read as the ones *beside* it rather than as photos of equal standing.
 *
 * Looking through the photos happens in the viewer, not on the card. Tapping
 * any of them opens that one full size — in the app, never in a new tab, since
 * these are somebody's face and not an asset to link to — and there the whole
 * set can be swiped through.
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
  const sideSize = Math.round(size * 0.42);

  // Everything this person published, in the order the profile shows it. The
  // viewer walks this list; the row below is just where you enter it.
  const all = mainUrl ? [mainUrl, ...side] : side;

  /** Which photo the viewer is on, or null when it is closed. */
  const [at, setAt] = useState<number | null>(null);
  const openAt = (url: string) => {
    const i = all.indexOf(url);
    setAt(i >= 0 ? i : 0);
  };
  const step = (by: number) =>
    setAt((v) => (v === null ? v : (v + by + all.length) % all.length));

  useEffect(() => {
    if (at === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setAt(null);
      if (ev.key === "ArrowRight") step(1);
      if (ev.key === "ArrowLeft") step(-1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // `step` closes over `all.length`, which cannot change while the viewer is
    // open — the page would have to re-render from the server first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at === null, all.length]);

  // Pointer state lives in refs: a swipe should not re-render on every frame,
  // and the click that ends a drag has to be recognised after the fact.
  const start = useRef<number | null>(null);
  const dragged = useRef(false);

  function onDown(e: React.PointerEvent) {
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
    if (all.length < 2) return;
    // The photos follow the finger: drag left, the next one comes in from the
    // right.
    if (delta <= -SWIPE) step(1);
    else if (delta >= SWIPE) step(-1);
  }

  const current = at === null ? null : all[at];

  const overlay =
    current === null ? null : (
      <div
        className="fixed inset-0 z-50 flex touch-pan-y select-none flex-col items-center justify-center bg-black/75 p-6 backdrop-blur-[3px] vt-fade"
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (start.current = null)}
        // A swipe ends in a click on the backdrop, which would otherwise close
        // the viewer the moment somebody moved to the next photo.
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          setAt(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={name}
          draggable={false}
          className="max-h-[74vh] w-auto max-w-full rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          onClick={(e) => e.stopPropagation()}
        />

        {all.length > 1 && (
          <div className="mt-5 flex items-center gap-2" aria-hidden="true">
            {all.map((url, i) => (
              <span
                key={`${url}${i}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === at ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        <p className="mt-3 max-w-[280px] text-center text-[13px] font-bold text-white/80">
          {all.length > 1 ? d.photo.swipe : d.photo.close}
        </p>
      </div>
    );

  /*
   * Side circles ride a full circle-height below the middle of the row.
   *
   * Level with the main photo they read as photos of equal standing;
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
        onClick={() => openAt(url)}
        aria-label={d.photo.open}
        className="rounded-full transition-transform active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ width: sideSize, height: sideSize }}
          className="rounded-full border-2 border-white object-cover shadow-[0_6px_16px_rgba(83,60,40,0.18)]"
        />
      </button>
    </span>
  );

  const half = Math.floor(side.length / 2);
  const left = side.slice(0, half);
  const right = side.slice(half);

  // How far the dropped circles hang below the main photo, so whatever comes
  // next on the page keeps its distance instead of meeting a circle.
  const overhang = side.length
    ? Math.max(0, sideSize - (size - sideSize) / 2)
    : 0;

  return (
    <>
      <div
        className="flex items-center justify-center gap-2"
        style={{ marginBottom: overhang }}
      >
        {left.map((url, i) => circle(url, `l${url}${i}`))}
        <button
          type="button"
          onClick={() => mainUrl && openAt(mainUrl)}
          aria-label={d.photo.open}
          disabled={!mainUrl}
          className="rounded-full transition-transform active:scale-95 disabled:active:scale-100"
        >
          <Avatar name={name} url={mainUrl} color={color} size={size} ring={ring} />
        </button>
        {right.map((url, i) => circle(url, `r${url}${i}`))}
      </div>

      {overlay && createPortal(overlay, document.body)}
    </>
  );
}

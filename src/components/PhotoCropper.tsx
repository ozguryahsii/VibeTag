"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useD } from "@/components/LocaleProvider";

/**
 * Choose which part of a photo becomes the profile picture.
 *
 * The photo lies still and **the ring moves over it** — drag the circle to
 * whatever the picture is actually about, and that is the crop. The earlier
 * version moved the photo under a fixed hole, which is the same geometry
 * upside down and reads as fighting the picture rather than framing it.
 *
 * The slider starts in the middle: at the centre the whole photo is on the
 * stage, left of it the photo shrinks (so the ring can take in more than the
 * frame first showed), right of it the photo grows for a tighter face crop.
 *
 * The result is always a 512px JPEG, whatever went in. HEIC from a phone, a
 * 12-megapixel PNG, a screenshot: all of them leave here as the same modest
 * square, which is what keeps the row in the database small.
 */

const OUT = 512; // exported pixels
const STAGE = 512; // canvas working units (drawn at 300 CSS px)
const RING = STAGE * 0.3; // radius of the selection circle
const QUALITY = 0.82;

/**
 * Slider ends, as powers of two.
 *
 * The bar has to *start in the middle*, and zoom is multiplicative: halving
 * and doubling are the same distance from 1 only on a log scale. So the
 * slider carries the exponent — −1.3 … +1.3, zero in the centre — and the
 * zoom is 2^exponent, which lands 1 exactly halfway. A plain 0.4 … 2.6
 * linear range would put 1 at 27 % of the track.
 */
const ZOOM_EXP = 1.3;
const MIN_ZOOM = 2 ** -ZOOM_EXP;
const MAX_ZOOM = 2 ** ZOOM_EXP;

export function PhotoCropper({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const d = useD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Ring centre, in stage units.
  const [ring, setRing] = useState({ x: STAGE / 2, y: STAGE / 2 });

  // Drag state lives in a ref: it changes on every pointer move and
  // re-rendering for each frame would make the drag feel worse, not better.
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const points = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    let cancelled = false;
    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close?.();
          return;
        }
        bitmapRef.current = bitmap;
        setZoom(1);
        setRing({ x: STAGE / 2, y: STAGE / 2 });
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      bitmapRef.current?.close?.();
      bitmapRef.current = null;
    };
  }, [file]);

  /** Where the photo sits on the stage at the current zoom. */
  const frame = useCallback(() => {
    const bitmap = bitmapRef.current;
    if (!bitmap) return null;
    // `contain`, not `cover`: at zoom 1 the entire photo is visible, which is
    // what makes zooming *out* mean something.
    const fit = Math.min(STAGE / bitmap.width, STAGE / bitmap.height);
    const scale = fit * zoom;
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    return { x: (STAGE - w) / 2, y: (STAGE - h) / 2, w, h, scale };
  }, [zoom]);

  /**
   * Keep the ring on the photo.
   *
   * Nothing outside the picture may be cropped, so the centre is held within
   * the photo's rectangle inset by the ring's radius. When the photo is
   * narrower than the ring in some axis — a very zoomed-out panorama — the
   * ring locks to the middle of that axis instead of jittering.
   */
  const clampRing = useCallback(
    (next: { x: number; y: number }) => {
      const f = frame();
      if (!f) return next;
      const clampAxis = (v: number, start: number, size: number) =>
        size <= RING * 2
          ? start + size / 2
          : Math.max(start + RING, Math.min(start + size - RING, v));
      return {
        x: clampAxis(next.x, f.x, f.w),
        y: clampAxis(next.y, f.y, f.h),
      };
    },
    [frame],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    const f = frame();
    if (!canvas || !bitmap || !f) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = STAGE;
    canvas.height = STAGE;

    ctx.fillStyle = "#F4EDE4";
    ctx.fillRect(0, 0, STAGE, STAGE);
    ctx.drawImage(bitmap, f.x, f.y, f.w, f.h);

    // Everything outside the ring dims; the ring itself is drawn on top so
    // the edge of the selection is unmistakable.
    const c = clampRing(ring);
    ctx.save();
    ctx.fillStyle = "rgba(45,33,28,0.5)";
    ctx.beginPath();
    ctx.rect(0, 0, STAGE, STAGE);
    ctx.arc(c.x, c.y, RING, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();

    ctx.beginPath();
    ctx.arc(c.x, c.y, RING, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, RING + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(240,82,98,0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [frame, clampRing, ring]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  // Zooming must not strand the ring off the photo.
  useEffect(() => {
    if (ready) setRing((r) => clampRing(r));
  }, [zoom, ready, clampRing]);

  /** Pointer position in stage units. */
  function toStage(e: React.PointerEvent<HTMLCanvasElement>) {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return { x: STAGE / 2, y: STAGE / 2 };
    const ratio = STAGE / box.width;
    return { x: (e.clientX - box.left) * ratio, y: (e.clientY - box.top) * ratio };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (points.current.size === 1) {
      // Tapping anywhere moves the ring there — the fastest way to frame a
      // face is to point at it, not to drag the ring across the picture.
      const p = toStage(e);
      setRing(clampRing(p));
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!points.current.has(e.pointerId)) return;
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const next = (pinch.current.zoom * distance) / pinch.current.distance;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next)));
      return;
    }

    if (drag.current?.id !== e.pointerId) return;
    setRing(clampRing(toStage(e)));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    points.current.delete(e.pointerId);
    if (points.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId) drag.current = null;
  }

  /** Cut the square under the ring out of the original bitmap. */
  function use() {
    const bitmap = bitmapRef.current;
    const f = frame();
    if (!bitmap || !f) return;

    const c = clampRing(ring);
    const side = (RING * 2) / f.scale;
    const sx = (c.x - RING - f.x) / f.scale;
    const sy = (c.y - RING - f.y) / f.scale;

    const out = document.createElement("canvas");
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUT, OUT);
    onDone(out.toDataURL("image/jpeg", QUALITY));
  }

  // Through a portal for the same reason as the lightbox: a transformed
  // ancestor anywhere above would turn "fixed to the screen" into "fixed to
  // whatever card this happens to sit in".
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={d.photo.cropTitle}
    >
      <div className="rounded-t-[28px] bg-warmwhite px-5 pt-5 pb-7 shadow-[0_-16px_40px_rgba(0,0,0,0.2)]">
        <p className="text-[15px] font-extrabold">{d.photo.cropTitle}</p>
        <p className="mt-1 text-[12.5px] text-muted leading-relaxed">
          {failed ? d.settings.photoUnreadable : d.photo.cropHint}
        </p>

        <div className="mt-4 grid place-items-center">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="h-[300px] w-[300px] touch-none select-none rounded-[24px] bg-cream cursor-grab active:cursor-grabbing"
          />
        </div>

        <label className="mt-4 block">
          <span className="mb-2 ml-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            <span>{d.photo.zoomOut}</span>
            <span>{d.photo.zoom}</span>
            <span>{d.photo.zoomIn}</span>
          </span>
          <input
            type="range"
            min={-ZOOM_EXP}
            max={ZOOM_EXP}
            step={0.01}
            value={Math.log2(zoom)}
            onChange={(e) => setZoom(2 ** Number(e.target.value))}
            className="w-full accent-[#F05262]"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-full border border-line bg-cream text-[14.5px] font-bold transition-transform active:scale-[0.98]"
          >
            {d.common.cancel}
          </button>
          <button
            type="button"
            onClick={use}
            disabled={!ready}
            className="h-12 rounded-full grad-score text-[14.5px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {d.photo.use}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

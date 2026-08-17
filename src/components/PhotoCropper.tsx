"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useD } from "@/components/LocaleProvider";

/**
 * Choose which part of a photo becomes the profile picture.
 *
 * Drag to move, pinch or use the slider to zoom, and the circle shows exactly
 * what will be kept. The old behaviour — silently centre-cropping whatever was
 * picked — is right about half the time and infuriating the other half, since
 * faces are rarely in the middle of a photograph.
 *
 * The result is always a 512px JPEG, whatever went in. HEIC from a phone, a
 * 12-megapixel PNG, a screenshot: all of them leave here as the same modest
 * square, which is what keeps the row in the database small.
 */

const OUT = 512;
const QUALITY = 0.82;

type Transform = { scale: number; x: number; y: number };

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
  const [t, setT] = useState<Transform>({ scale: 1, x: 0, y: 0 });

  // Drag state lives in a ref: it changes on every pointer move and re-rendering
  // for each frame would make the drag feel worse, not better.
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
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
        setT({ scale: 1, x: 0, y: 0 });
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      bitmapRef.current?.close?.();
      bitmapRef.current = null;
    };
  }, [file]);

  /**
   * Paint the preview.
   *
   * `cover` is the scale at which the photo exactly fills the square, so
   * scale 1 is "no gaps" and everything above it is zoom. The offset is
   * clamped to the same rule — you can never drag empty space into frame.
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUT;
    canvas.height = OUT;

    const cover = Math.max(OUT / bitmap.width, OUT / bitmap.height);
    const scale = cover * t.scale;
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    const maxX = Math.max(0, (w - OUT) / 2);
    const maxY = Math.max(0, (h - OUT) / 2);
    const x = Math.max(-maxX, Math.min(maxX, t.x));
    const y = Math.max(-maxY, Math.min(maxY, t.y));

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(bitmap, (OUT - w) / 2 + x, (OUT - h) / 2 + y, w, h);
  }, [t]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  function clampOffsets(next: Transform): Transform {
    const bitmap = bitmapRef.current;
    if (!bitmap) return next;
    const cover = Math.max(OUT / bitmap.width, OUT / bitmap.height);
    const scale = cover * next.scale;
    const maxX = Math.max(0, (bitmap.width * scale - OUT) / 2);
    const maxY = Math.max(0, (bitmap.height * scale - OUT) / 2);
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.current.size === 1) {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    } else if (points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: t.scale,
      };
      drag.current = null;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!points.current.has(e.pointerId)) return;
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current && points.current.size === 2) {
      const [a, b] = [...points.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const next = (pinch.current.scale * distance) / pinch.current.distance;
      setT((prev) =>
        clampOffsets({ ...prev, scale: Math.max(1, Math.min(4, next)) }),
      );
      return;
    }

    const start = drag.current;
    if (!start || start.id !== e.pointerId) return;
    // The canvas is drawn at 512 but displayed smaller; move by what the
    // finger did in canvas units, or dragging feels sluggish on a phone.
    const box = canvasRef.current?.getBoundingClientRect();
    const ratio = box ? OUT / box.width : 1;
    const dx = (e.clientX - start.x) * ratio;
    const dy = (e.clientY - start.y) * ratio;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    setT((prev) => clampOffsets({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    points.current.delete(e.pointerId);
    if (points.current.size < 2) pinch.current = null;
    if (drag.current?.id === e.pointerId) drag.current = null;
  }

  function use() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL("image/jpeg", QUALITY));
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
          <div className="relative">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="w-[260px] h-[260px] rounded-[24px] touch-none select-none cursor-grab active:cursor-grabbing bg-cream"
            />
            {/* The circle is not decoration: it is the crop. */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[24px]"
              style={{
                boxShadow:
                  "inset 0 0 0 2px rgba(255,255,255,0.9), inset 0 0 0 999px rgba(45,33,28,0.34)",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                WebkitMaskImage:
                  "radial-gradient(circle at 50% 50%, transparent 0 49%, #000 49.5%)",
                maskImage:
                  "radial-gradient(circle at 50% 50%, transparent 0 49%, #000 49.5%)",
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <label className="mt-4 block">
          <span className="block text-[11px] font-extrabold tracking-[0.12em] uppercase text-muted mb-2 ml-1">
            {d.photo.zoom}
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={t.scale}
            onChange={(e) =>
              setT((prev) =>
                clampOffsets({ ...prev, scale: Number(e.target.value) }),
              )
            }
            className="w-full accent-[#F05262]"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-full bg-cream border border-line font-bold text-[14.5px] active:scale-[0.98] transition-transform"
          >
            {d.common.cancel}
          </button>
          <button
            type="button"
            onClick={use}
            disabled={!ready}
            className="h-12 rounded-full grad-score text-white font-bold text-[14.5px] active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {d.photo.use}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

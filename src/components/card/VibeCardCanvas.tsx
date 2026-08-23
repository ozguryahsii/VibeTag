"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useD } from "@/components/LocaleProvider";
import { drawCard, FORMATS, type CardData, type FormatKey } from "@/components/card/draw";

/**
 * The card itself — a canvas and the code that keeps it painted.
 *
 * Split out of the studio so the same pixels can be rendered anywhere: the
 * share screen, and the band gallery at /card/preview where twelve of these
 * sit side by side with a made-up score each.
 */
export function VibeCardCanvas({
  data,
  format,
  showScore = true,
  className,
  style,
  canvasRef: externalRef,
}: {
  data: CardData;
  format: FormatKey;
  showScore?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Handed back so a parent can export the pixels. */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const d = useD();
  const ownRef = useRef<HTMLCanvasElement>(null);
  const ref = externalRef ?? ownRef;
  const photoRef = useRef<HTMLImageElement | null>(null);
  const [photoReady, setPhotoReady] = useState(0);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCard({
      ctx,
      data,
      format,
      showScore,
      photo: photoRef.current,
      d,
    });
    // photoReady is a redraw trigger, not a value this function reads.
    void photoReady;
  }, [data, format, showScore, d, photoReady, ref]);

  // Decode the profile photo once, then redraw. Data URLs are same-origin, so
  // the canvas stays untainted and toDataURL keeps working.
  useEffect(() => {
    if (!data.avatarUrl) {
      photoRef.current = null;
      setPhotoReady((n) => n + 1);
      return;
    }
    const img = new Image();
    img.onload = () => {
      photoRef.current = img;
      setPhotoReady((n) => n + 1);
    };
    img.src = data.avatarUrl;
  }, [data.avatarUrl]);

  useEffect(() => {
    draw();
    // Redraw once the webfonts land, so the export uses DM Sans + Playfair
    // rather than whatever fallback happened to be up on first paint.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(draw).catch(() => {});
    }
  }, [draw]);

  const f = FORMATS[format];

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ aspectRatio: `${f.w} / ${f.h}`, ...style }}
    />
  );
}

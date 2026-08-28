"use client";

import { useRef, useState } from "react";
import { fill, useD } from "@/components/LocaleProvider";
import { VibeCardCanvas } from "@/components/card/VibeCardCanvas";
import {
  FORMATS,
  sceneFor,
  type CardData,
  type FormatKey,
} from "@/components/card/draw";

export type { CardData } from "@/components/card/draw";

/**
 * Vibe Card studio (§12) — the viral core of the product.
 *
 * The controls only. Everything about how the card looks lives in
 * `card/draw.ts` (the composition, identical for everyone) and
 * `card/scenes/*` (one file per score band).
 *
 * There is no theme picker: the design follows the Vibe Score, so letting
 * someone pick "the celebratory one" would make the card say something their
 * score does not. The band's name is shown instead, because a card that
 * changes as you climb is only motivating if you can see that it changed.
 */
export function VibeCardStudio({
  data,
  inShell = false,
}: {
  data: CardData;
  inShell?: boolean;
}) {
  const d = useD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatKey>("story");
  const [showScore, setShowScore] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  /** The PNG, shown full-size so the platform's own "save image" can reach it. */
  const [saveImage, setSaveImage] = useState<string | null>(null);

  const { band } = sceneFor(data.score);
  const f = FORMATS[format];

  /**
   * Save the card.
   *
   * In a browser this is an anchor with a `download` attribute, which is the
   * whole feature. Inside the app shell that anchor does nothing at all — a
   * WebView has no downloads folder to put it in — and the screen was
   * cheerfully announcing "card downloaded" over the top of it.
   *
   * So in the shell the card is shown as an image instead, at full size,
   * where the platform's own press-and-hold menu offers "Add to Photos".
   * That is the save path a phone actually has, and it needs nothing from
   * the native side.
   */
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const png = canvas.toDataURL("image/png");

    if (inShell) {
      setSaveImage(png);
      return;
    }

    const a = document.createElement("a");
    a.href = png;
    a.download = `vibetag-${data.username}-${format}.png`;
    a.click();
    setStatus(d.card.downloaded);
    setTimeout(() => setStatus(null), 2500);
  }

  async function share() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png"),
    );
    if (!blob) return;

    const file = new File([blob], `vibetag-${data.username}.png`, {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My Vibe",
          text: `${d.card.seeMeAs} ${data.tags
            .slice(0, 3)
            .map((t) => t.label)
            .join(", ")} — ${d.common.appName}`,
        });
        return;
      } catch {
        /* share sheet dismissed */
      }
      return;
    }
    download();
  }

  return (
    <div>
      <div className="mt-5 grid place-items-center">
        <VibeCardCanvas
          canvasRef={canvasRef}
          data={data}
          format={format}
          showScore={showScore}
          className="w-full h-auto rounded-[26px]"
          style={{
            maxWidth:
              format === "wide" ? "100%" : format === "square" ? 330 : 288,
          }}
        />
        <p className="mt-3 text-center text-[11.5px] text-muted leading-relaxed">
          <span className="font-extrabold text-ink">{band.name}</span>
          {" · "}
          {fill(d.card.styleFromScore, { n: data.score })}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-[12px] font-extrabold text-muted mb-2 ml-1">
          {d.card.format}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FORMATS) as FormatKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFormat(k)}
              className={`rounded-2xl px-2 py-3 text-center transition-transform active:scale-95 ${
                format === k ? "grad-ring" : "bg-warmwhite border border-line"
              }`}
            >
              <span className="block text-[13px] font-extrabold">
                {d.card[FORMATS[k].labelKey]}
              </span>
              <span className="block text-[10.5px] text-muted mt-0.5">
                {FORMATS[k].hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 flex items-center gap-3 card p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showScore}
          onChange={(e) => setShowScore(e.target.checked)}
          className="w-5 h-5 accent-[#F05262]"
        />
        <span>
          <span className="block text-[13.5px] font-bold">
            {d.card.showScore}
          </span>
          <span className="block text-[12px] text-muted">
            {d.card.showScoreBody}
          </span>
        </span>
      </label>

      <div className="mt-5 grid gap-2.5">
        <button
          onClick={share}
          className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
        >
          {d.card.share}
        </button>
        <button
          onClick={download}
          className="h-13 rounded-full bg-warmwhite border border-line font-bold text-[15px] shadow-[0_5px_16px_rgba(83,60,40,0.06)] active:scale-[0.98] transition-transform"
        >
          {fill(d.card.download, { w: f.w, h: f.h })}
        </button>
      </div>

      {status && (
        <p className="mt-3 text-center text-[13px] font-bold text-orange">
          {status}
        </p>
      )}

      {saveImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-5"
          onClick={() => setSaveImage(null)}
        >
          <div
            className="w-full max-w-[340px] grid gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* An <img>, not the canvas: press-and-hold offers "save image"
                on a real image element and nothing on a canvas. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={saveImage}
              alt={d.card.saveTitle}
              className="w-full h-auto rounded-[22px] shadow-2xl"
            />
            <div className="rounded-[22px] bg-warmwhite p-4">
              <p className="text-[13.5px] font-extrabold">{d.card.saveTitle}</p>
              <p className="text-[12px] text-muted leading-relaxed mt-1">
                {d.card.saveBody}
              </p>
              <button
                type="button"
                onClick={() => setSaveImage(null)}
                className="mt-3 h-11 w-full rounded-full bg-white border border-line font-bold text-[13px] text-muted"
              >
                {d.card.saveClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

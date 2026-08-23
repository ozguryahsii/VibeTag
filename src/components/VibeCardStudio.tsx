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
export function VibeCardStudio({ data }: { data: CardData }) {
  const d = useD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatKey>("story");
  const [showScore, setShowScore] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const { band } = sceneFor(data.score);
  const f = FORMATS[format];

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
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
    }
    await download();
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
    </div>
  );
}

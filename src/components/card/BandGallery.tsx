"use client";

import { useState } from "react";
import { VibeCardCanvas } from "@/components/card/VibeCardCanvas";
import type { CardData, FormatKey } from "@/components/card/draw";
import type { CardBand } from "@/lib/card-bands";

/**
 * Every band's card, side by side, drawn from a made-up profile.
 *
 * The sample is deliberately identical across all twelve except for the score:
 * comparing designs is only possible when nothing else moves.
 */
const SAMPLE: Omit<CardData, "score"> = {
  name: "Vibe Tag",
  username: "vibetag",
  ratingCount: 126,
  percentile: 5,
  tags: [
    { key: "reliable", label: "Reliable" },
    { key: "creative", label: "Creative" },
    { key: "calm", label: "Calm" },
    { key: "positiveEnergy", label: "Positive Energy" },
    { key: "goodListener", label: "Good Listener" },
  ],
  avatarUrl: null,
  avatarColor: "#FF8A3D",
};

/** A score inside the band that shows it at its most typical. */
function sampleScore(band: CardBand): number {
  // The approved reference board uses 42 for the monochrome example; keeping
  // that exact anchor makes side-by-side visual review much easier.
  if (band.key === "monochrome") return 42;
  return Math.round((band.min + band.max) / 2);
}

export function BandGallery({ bands }: { bands: CardBand[] }) {
  const [format, setFormat] = useState<FormatKey>("story");

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(["story", "square", "wide"] as FormatKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setFormat(k)}
            className={`rounded-full px-3.5 py-2 text-[12px] font-extrabold transition-transform active:scale-95 ${
              format === k ? "grad-ring" : "bg-warmwhite border border-line"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {bands.map((band) => (
          <div key={band.key} className="card p-2.5">
            <VibeCardCanvas
              data={{ ...SAMPLE, score: sampleScore(band) }}
              format={format}
              className="w-full h-auto rounded-[16px]"
            />
            <p className="mt-2 text-[12.5px] font-extrabold leading-tight">
              {band.name}
            </p>
            <p className="text-[10.5px] text-muted tabular-nums">
              {band.min === band.max
                ? `score ${band.min}`
                : `score ${band.min}–${band.max}`}
              {" · "}
              sample {sampleScore(band)}
            </p>
            <p className="mt-0.5 text-[9.5px] text-muted break-all">
              scenes/{band.key}.ts
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

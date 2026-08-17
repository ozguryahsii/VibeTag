import type { Scene } from "@/components/card/scene";
import { crestBottom, crestTop } from "@/components/card/paint";

/**
 * Sand — Vibe Score 71–75.
 *
 * Warm neutral, fully committed. The score numeral takes its first gradient
 * here — two close browns rather than a flat one — which is the moment the
 * card starts to feel lit from somewhere.
 */
export const sand: Scene = {
  key: "sand",
  name: "Sand",

  palette: {
    page: "#F9F4EC",
    card: "#FDFAF4",
    shadow: "rgba(83,60,40,0.12)",
    border: "rgba(214,199,178,0.92)",

    ink: "#2D241C",
    inkSoft: "#7C7064",
    accent: "#A6773F",
    divider: "rgba(180,157,127,0.78)",

    score: ["#7A5A34", "#54402A"],
    avatarRing: ["rgba(198,173,140,0.8)"],

    pillFill: "#F4EBDC",
    pillBorder: "rgba(224,205,177,0.8)",
    pillInk: "#96703F",

    rule: "rgba(224,211,192,0.95)",
    raterStack: [
      ["#EFE2CE", "#D9C6A9"],
      ["#E7D9C3", "#D0BC9C"],
      ["#F3E9D9", "#DCCDB2"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#D8B98A", "#C7A171", "#B08A5C"],
    markAlpha: 0.75,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#F9F4EC";
    ctx.fillRect(0, 0, w, h);
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FDFAF4";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F2E4CC", alpha: 0.62, depth: 0.16, reach: 0.92 },
      { fill: "#E9D6B6", alpha: 0.5, depth: 0.11, reach: 0.72 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F3E7D0", alpha: 0.92, depth: 0.88, reach: 0.82 },
      { fill: "#E8D4B2", alpha: 0.82, depth: 0.94, reach: 0.86 },
      { fill: "#DBC194", alpha: 0.66, depth: 0.985, reach: 0.91 },
    ]);
  },
};

import type { Scene } from "@/components/card/scene";
import { crestBottom, crestTop } from "@/components/card/paint";

/**
 * Clay — Vibe Score 61–70.
 *
 * Where colour arrives, but only just: a warm earth tint in the crests and the
 * first non-grey accent. The top edge starts to carry something too, so the
 * card stops being bottom-heavy.
 */
export const clay: Scene = {
  key: "clay",
  name: "Clay",

  palette: {
    page: "#F7F3EE",
    card: "#FCF9F4",
    shadow: "rgba(83,60,40,0.11)",
    border: "rgba(205,193,178,0.92)",

    ink: "#2E2620",
    inkSoft: "#7D7268",
    accent: "#8A6A50",
    divider: "rgba(168,150,131,0.75)",

    score: ["#4C3D33"],
    avatarRing: ["rgba(186,167,146,0.75)"],

    pillFill: "#F2EBE1",
    pillBorder: "rgba(0,0,0,0)",
    pillInk: "#8A6A50",

    rule: "rgba(219,208,194,0.95)",
    raterStack: [
      ["#E7DFD3", "#D0C4B3"],
      ["#DFD6C9", "#C7BAA9"],
      ["#EDE6DB", "#D5CABA"],
    ],

    brand: "rgba(31,31,31,0.42)",
    mark: null,
    markAlpha: 0.6,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#F7F3EE";
    ctx.fillRect(0, 0, w, h);
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FCF9F4";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#EFE6D9", alpha: 0.5, depth: 0.13, reach: 0.9 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F0E7D9", alpha: 0.9, depth: 0.89, reach: 0.83 },
      { fill: "#E5D8C6", alpha: 0.8, depth: 0.945, reach: 0.87 },
      { fill: "#D8C7B0", alpha: 0.66, depth: 0.99, reach: 0.92 },
    ]);
  },
};

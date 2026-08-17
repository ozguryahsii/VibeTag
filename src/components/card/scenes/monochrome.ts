import type { Scene } from "@/components/card/scene";
import { crestBottom, crestTop } from "@/components/card/paint";

/**
 * Monochrome — Vibe Score 0–49.
 *
 * True black and white. The soft graphite contours keep the card editorial,
 * not punitive; there is deliberately no colour, glow, ray or sparkle.
 */
export const monochrome: Scene = {
  key: "monochrome",
  name: "Monochrome",

  palette: {
    page: "#F0F0F0",
    card: "#FAFAFA",
    shadow: "rgba(35,35,35,0.12)",
    border: "rgba(184,184,184,0.82)",

    ink: "#292929",
    inkSoft: "#777777",
    accent: "#575757",
    divider: "rgba(135,135,135,0.62)",

    score: ["#343434"],
    avatarRing: ["#B8B8B8"],
    avatarTint: "#858585",

    pillFill: "rgba(231,231,231,0.92)",
    pillBorder: "rgba(0,0,0,0)",
    pillInk: "#555555",

    rule: "rgba(201,201,201,0.9)",
    raterStack: [
      ["#E0E0E0", "#BEBEBE"],
      ["#D4D4D4", "#AFAFAF"],
      ["#E8E8E8", "#C7C7C7"],
    ],

    brand: "rgba(35,35,35,0.4)",
    mark: null,
    markAlpha: 0.34,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#F5F5F5");
    wash.addColorStop(1, "#E9E9E9");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FCFCFC");
    paper.addColorStop(0.68, "#F9F9F9");
    paper.addColorStop(1, "#F3F3F3");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#E7E7E7", alpha: 0.46, depth: 0.17, reach: 0.9 },
      { fill: "#DCDCDC", alpha: 0.24, depth: 0.11, reach: 0.64 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#EEEEEE", alpha: 0.86, depth: 0.91, reach: 0.86 },
      { fill: "#E2E2E2", alpha: 0.66, depth: 0.96, reach: 0.9 },
      { fill: "#D7D7D7", alpha: 0.42, depth: 0.992, reach: 0.95 },
    ]);

    // The shared portrait and medal paints come next inside draw.ts's saved
    // card context. This keeps even real photos and badge metals truly B&W;
    // draw.ts restores the context before the outer wordmark is painted.
    ctx.filter = "grayscale(1)";
  },
};

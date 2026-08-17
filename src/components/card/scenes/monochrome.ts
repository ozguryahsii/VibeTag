import type { Scene } from "@/components/card/scene";
import { flowField, paperGrain } from "@/components/card/fine-art";

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
    page: "#F1F1F1",
    card: "#F8F8F8",
    shadow: "rgba(35,35,35,0.13)",
    border: "rgba(177,177,177,0.68)",

    ink: "#252525",
    inkSoft: "#747474",
    accent: "#595959",
    divider: "rgba(122,122,122,0.58)",

    score: ["#292929"],
    avatarRing: ["#AFAFAF"],
    avatarTint: "#818181",

    pillFill: "rgba(255,255,255,0.2)",
    pillBorder: "rgba(104,104,104,0.52)",
    pillInk: "#555555",

    rule: "rgba(201,201,201,0.9)",
    raterStack: [
      ["#E0E0E0", "#BEBEBE"],
      ["#D4D4D4", "#AFAFAF"],
      ["#E8E8E8", "#C7C7C7"],
    ],

    brand: "rgba(35,35,35,0.48)",
    mark: ["#313131", "#3D3D3D", "#292929"],
    markAlpha: 0.72,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#F6F6F6");
    wash.addColorStop(1, "#EDEDED");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  },

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FAFAFA");
    paper.addColorStop(0.58, "#F7F7F7");
    paper.addColorStop(1, "#F0F0F0");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // The reference card is almost bare paper. Its depth comes from graphite
    // contour threads, never from filled grey bands.
    flowField(geom, {
      count: 18,
      colors: ["#D1D1D1", "#AAAAAA", "#D8D8D8"],
      y: [0.34, 0.43, 0.3, 0.39],
      spread: 0.105,
      alpha: 0.15,
      lineWidth: 0.00095,
      seed: 12,
    });
    flowField(geom, {
      count: 10,
      colors: ["#D9D9D9", "#B7B7B7", "#E0E0E0"],
      y: [0.58, 0.5, 0.63, 0.55],
      spread: 0.075,
      alpha: 0.1,
      lineWidth: 0.0009,
      seed: 86,
      reverse: true,
    });
    paperGrain(geom, "#777777", 180, 0.026, 31);

    // The shared portrait and medal paints come next inside draw.ts's saved
    // card context. This keeps even real photos and badge metals truly B&W;
    // draw.ts restores the context before the outer wordmark is painted.
    ctx.filter = "grayscale(1)";
  },
};

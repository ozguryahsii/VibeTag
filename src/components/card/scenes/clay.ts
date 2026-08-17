import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, ribbon } from "@/components/card/paint";

/**
 * Clay — Vibe Score 61–70.
 *
 * The first true colour arrives as muted terracotta and sun-baked earth. It
 * remains matte, grounded and sparkle-free.
 */
export const clay: Scene = {
  key: "clay",
  name: "Clay",

  palette: {
    page: "#F6F1EA",
    card: "#FCF8F2",
    shadow: "rgba(91,65,48,0.13)",
    border: "rgba(205,187,169,0.88)",

    ink: "#30251F",
    inkSoft: "#7F7067",
    accent: "#9A674E",
    divider: "rgba(170,134,111,0.62)",

    score: ["#513E34"],
    avatarRing: ["#C4A48D", "#A9745A"],

    pillFill: "rgba(242,232,220,0.94)",
    pillBorder: "rgba(190,151,123,0.28)",
    pillInk: "#8E604A",

    rule: "rgba(220,205,190,0.92)",
    raterStack: [
      ["#ECDACA", "#CDAF98"],
      ["#E4CEC1", "#C29D89"],
      ["#F0E4D7", "#D5BDAB"],
    ],

    brand: "rgba(48,37,31,0.4)",
    mark: ["#C9A58B", "#B78468", "#9F6B53"],
    markAlpha: 0.68,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#FAF6F0");
    wash.addColorStop(1, "#F0E8DE");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.12, h * 0.92, w * 0.64, "rgba(170,104,72,0.08)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFFDF9");
    paper.addColorStop(1, "#F8F1E9");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F1E4D7", alpha: 0.64, depth: 0.18, reach: 0.91 },
      { fill: "#DDBCA7", alpha: 0.38, depth: 0.115, reach: 0.62 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F2E5D7", alpha: 0.94, depth: 0.89, reach: 0.82 },
      { fill: "#E4C7B3", alpha: 0.82, depth: 0.94, reach: 0.87 },
      { fill: "#C99678", alpha: 0.64, depth: 0.985, reach: 0.93 },
    ]);

    ribbon(ctx, cardX, cardY, cardW, cardH, "#DDBCA7", "#F7F1EA", 0.43, 0.024, 0.1);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#FCF8F2", "#C99678", 0.63, 0.016, 0.075);
  },
};

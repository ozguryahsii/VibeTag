import type { Scene } from "@/components/card/scene";
import { bloom } from "@/components/card/paint";
import { fineGlint, flowField, paperGrain } from "@/components/card/fine-art";

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
    page: "#F7F1E9",
    card: "#FBF5EC",
    shadow: "rgba(91,65,48,0.13)",
    border: "rgba(199,181,162,0.7)",

    ink: "#30251F",
    inkSoft: "#7F7067",
    accent: "#976644",
    divider: "rgba(170,134,111,0.62)",

    score: ["#795A37"],
    avatarRing: ["#D0B08B", "#A97551"],

    pillFill: "rgba(255,251,245,0.27)",
    pillBorder: "rgba(177,132,99,0.48)",
    pillInk: "#875E43",

    rule: "rgba(220,205,190,0.92)",
    raterStack: [
      ["#ECDACA", "#CDAF98"],
      ["#E4CEC1", "#C29D89"],
      ["#F0E4D7", "#D5BDAB"],
    ],

    brand: "rgba(48,37,31,0.47)",
    mark: ["#9D7757", "#815B40", "#684733"],
    markAlpha: 0.76,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#FAF6F0");
    wash.addColorStop(1, "#F0E8DE");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.12, h * 0.92, w * 0.64, "rgba(170,104,72,0.06)");
  },

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH, u } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFFDF9");
    paper.addColorStop(0.55, "#FBF6EE");
    paper.addColorStop(1, "#F7EEE3");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    bloom(
      ctx,
      cardX + cardW * 0.12,
      cardY + cardH * 0.76,
      u * 0.54,
      "rgba(196,137,91,0.055)",
    );
    flowField(geom, {
      count: 24,
      colors: ["#EAD9C4", "#D6B18A", "#F4E8D8"],
      y: [0.32, 0.42, 0.31, 0.45],
      spread: 0.13,
      alpha: 0.2,
      lineWidth: 0.00105,
      seed: 35,
    });
    flowField(geom, {
      count: 10,
      colors: ["#E4CEB4", "#C99569", "#F4E7D7"],
      y: [0.59, 0.5, 0.65, 0.55],
      spread: 0.078,
      alpha: 0.12,
      lineWidth: 0.0009,
      seed: 117,
      reverse: true,
    });
    paperGrain(geom, "#8D725E", 185, 0.024, 56);

    fineGlint(ctx, cardX + cardW * 0.12, cardY + cardH * 0.25, u * 0.007, "#E5BE86", 0.42);
    fineGlint(ctx, cardX + cardW * 0.88, cardY + cardH * 0.39, u * 0.006, "#FFFFFF", 0.5);
    fineGlint(ctx, cardX + cardW * 0.82, cardY + cardH * 0.76, u * 0.0045, "#C99061", 0.34);
  },
};

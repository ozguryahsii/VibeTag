import type { Scene } from "@/components/card/scene";
import { bloom } from "@/components/card/paint";
import { fineGlint, flowField, paperGrain } from "@/components/card/fine-art";

/**
 * Sand — Vibe Score 71–75.
 *
 * Warm champagne paper and quiet dune contours. This is the first score
 * gradient, but the card still values calm space over decoration.
 */
export const sand: Scene = {
  key: "sand",
  name: "Sand",

  palette: {
    page: "#F9F3EA",
    card: "#FFF5E9",
    shadow: "rgba(112,78,44,0.14)",
    border: "rgba(218,187,151,0.72)",

    ink: "#30251C",
    inkSoft: "#7D6F61",
    accent: "#A87538",
    divider: "rgba(188,151,104,0.66)",

    score: ["#D09342", "#E87856"],
    avatarRing: ["#E1BE83", "#CF824D"],

    pillFill: "rgba(255,250,242,0.31)",
    pillBorder: "rgba(207,155,96,0.54)",
    pillInk: "#A26D39",

    rule: "rgba(226,211,190,0.94)",
    raterStack: [
      ["#F1E1C7", "#D7BB90"],
      ["#EAD8BA", "#CEAF80"],
      ["#F5E9D5", "#DECAAA"],
    ],

    brand: "rgba(48,37,28,0.47)",
    mark: ["#C89A56", "#B16F3F", "#8E5536"],
    markAlpha: 0.82,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#FCF8F1");
    wash.addColorStop(1, "#F3EADC");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.08, w * 0.58, "rgba(205,153,76,0.09)");
  },

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH, u } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FFFBF5");
    paper.addColorStop(0.56, "#FFF4E9");
    paper.addColorStop(1, "#FDEDDD");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    bloom(
      ctx,
      cardX + cardW * 0.14,
      cardY + cardH * 0.08,
      u * 0.34,
      "rgba(232,176,100,0.08)",
    );
    bloom(
      ctx,
      cardX + cardW * 0.86,
      cardY + cardH * 0.73,
      u * 0.52,
      "rgba(231,134,81,0.055)",
    );

    flowField(geom, {
      count: 26,
      colors: ["#F1DDC4", "#E6B88F", "#E89A70", "#FFF6EA"],
      y: [0.3, 0.42, 0.32, 0.47],
      spread: 0.145,
      alpha: 0.23,
      lineWidth: 0.00105,
      seed: 46,
    });
    flowField(geom, {
      count: 12,
      colors: ["#F0D4B2", "#DD9869", "#FFF4E5"],
      y: [0.62, 0.51, 0.67, 0.56],
      spread: 0.082,
      alpha: 0.14,
      lineWidth: 0.00095,
      seed: 139,
      reverse: true,
    });
    paperGrain(geom, "#A87855", 190, 0.023, 67);

    const glints: [number, number, number, string, number][] = [
      [0.11, 0.12, 0.007, "#FFFFFF", 0.58],
      [0.87, 0.2, 0.0055, "#E4A05C", 0.48],
      [0.09, 0.55, 0.0045, "#D99154", 0.38],
      [0.9, 0.7, 0.0065, "#FFFFFF", 0.56],
      [0.18, 0.85, 0.004, "#E2A56B", 0.4],
    ];
    for (const [x, y, r, color, alpha] of glints) {
      fineGlint(ctx, cardX + cardW * x, cardY + cardH * y, u * r, color, alpha);
    }
  },
};

import type { Scene } from "@/components/card/scene";
import { bloom } from "@/components/card/paint";
import { fineGlint, flowField, paperGrain } from "@/components/card/fine-art";

/**
 * Amber — Vibe Score 76–80.
 *
 * The first luminous card: broad honey folds and hairline gold currents catch
 * the light, without introducing stars or celebration yet.
 */
export const amber: Scene = {
  key: "amber",
  name: "Amber",

  palette: {
    page: "#FBF4E9",
    card: "#FFF2E2",
    shadow: "rgba(177,115,36,0.17)",
    border: "rgba(229,177,117,0.76)",

    ink: "#2F2218",
    inkSoft: "#7D6B57",
    accent: "#CF7540",
    divider: "rgba(205,151,75,0.68)",

    score: ["#E8A246", "#E8794A", "#DF5E52"],
    avatarRing: ["#F0BE69", "#E9864B", "#DC6452"],

    pillFill: "rgba(255,252,246,0.35)",
    pillBorder: "rgba(220,151,91,0.58)",
    pillInk: "#B86E39",

    rule: "rgba(231,211,180,0.94)",
    raterStack: [
      ["#F8E2B8", "#E2BE80"],
      ["#F2D6A5", "#D7AD67"],
      ["#F9EBD1", "#E5CC9F"],
    ],

    brand: "rgba(47,34,24,0.48)",
    mark: ["#E1A34D", "#D87842", "#AE5C37"],
    markAlpha: 0.88,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#FDF9F1");
    wash.addColorStop(1, "#F7ECD9");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.84, h * 0.06, w * 0.65, "rgba(236,166,62,0.13)");
    bloom(ctx, w * 0.1, h * 0.94, w * 0.58, "rgba(215,126,45,0.07)");
  },

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH, scoreCenterX, scoreCenterY, u } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFF9F0");
    paper.addColorStop(0.52, "#FFF1E2");
    paper.addColorStop(1, "#FDE7D2");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    bloom(ctx, scoreCenterX, scoreCenterY, u * 0.5, "rgba(237,151,76,0.075)");
    bloom(
      ctx,
      cardX + cardW * 0.08,
      cardY + cardH * 0.7,
      u * 0.56,
      "rgba(234,130,69,0.055)",
    );

    flowField(geom, {
      count: 30,
      colors: ["#F6DDC1", "#EFB888", "#E99568", "#FFF6E8"],
      y: [0.29, 0.43, 0.31, 0.49],
      spread: 0.15,
      alpha: 0.25,
      lineWidth: 0.00108,
      seed: 58,
    });
    flowField(geom, {
      count: 12,
      colors: ["#F5D3AC", "#E78E5E", "#FFF4E4"],
      y: [0.63, 0.5, 0.68, 0.56],
      spread: 0.086,
      alpha: 0.15,
      lineWidth: 0.00095,
      seed: 151,
      reverse: true,
    });
    paperGrain(geom, "#A66E4E", 195, 0.023, 79);

    const glints: [number, number, number, string, number][] = [
      [0.12, 0.1, 0.0075, "#FFFFFF", 0.62],
      [0.89, 0.18, 0.006, "#EFA45B", 0.48],
      [0.1, 0.48, 0.0045, "#E78D56", 0.4],
      [0.9, 0.64, 0.007, "#FFFFFF", 0.62],
      [0.17, 0.83, 0.005, "#E9A465", 0.44],
    ];
    for (const [x, y, r, color, alpha] of glints) {
      fineGlint(ctx, cardX + cardW * x, cardY + cardH * y, u * r, color, alpha);
    }
  },
};

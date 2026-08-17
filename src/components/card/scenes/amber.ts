import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop } from "@/components/card/paint";

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
    page: "#FBF5E9",
    card: "#FEFAF2",
    shadow: "rgba(177,115,36,0.17)",
    border: "rgba(234,193,132,0.94)",

    ink: "#2F2218",
    inkSoft: "#7D6B57",
    accent: "#C7812A",
    divider: "rgba(205,151,75,0.68)",

    score: ["#F0B64A", "#D8892F", "#B76826"],
    avatarRing: ["#F2C36C", "#D98A34"],

    pillFill: "rgba(255,249,236,0.9)",
    pillBorder: "rgba(232,192,132,0.82)",
    pillInk: "#B8782B",

    rule: "rgba(231,211,180,0.94)",
    raterStack: [
      ["#F8E2B8", "#E2BE80"],
      ["#F2D6A5", "#D7AD67"],
      ["#F9EBD1", "#E5CC9F"],
    ],

    brand: "rgba(47,34,24,0.4)",
    mark: ["#F2CB77", "#E2A34A", "#C8792F"],
    markAlpha: 0.9,
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

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFFDF7");
    paper.addColorStop(0.58, "#FCF8EE");
    paper.addColorStop(1, "#F9EFD9");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FAE4B6", alpha: 0.72, depth: 0.21, reach: 0.94 },
      { fill: "#F3C875", alpha: 0.58, depth: 0.15, reach: 0.75 },
      { fill: "#E7A447", alpha: 0.34, depth: 0.09, reach: 0.48 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9E6BD", alpha: 0.94, depth: 0.875, reach: 0.81 },
      { fill: "#F2C978", alpha: 0.84, depth: 0.932, reach: 0.86 },
      { fill: "#E4A044", alpha: 0.7, depth: 0.982, reach: 0.92 },
    ]);

    // Fine reflective threads make Amber feel lit rather than merely beige.
    ctx.save();
    const filament = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    filament.addColorStop(0, "rgba(255,255,255,0.12)");
    filament.addColorStop(0.55, "rgba(255,246,207,0.8)");
    filament.addColorStop(1, "rgba(199,123,35,0.18)");
    ctx.strokeStyle = filament;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.38 - i * 0.08;
      ctx.lineWidth = cardW * (0.003 - i * 0.0005);
      ctx.beginPath();
      ctx.moveTo(cardX - cardW * 0.03, cardY + cardH * (0.06 + i * 0.025));
      ctx.bezierCurveTo(
        cardX + cardW * 0.22,
        cardY + cardH * (0.02 + i * 0.02),
        cardX + cardW * 0.4,
        cardY + cardH * (0.15 + i * 0.01),
        cardX + cardW * 0.68,
        cardY + cardH * (0.1 + i * 0.018),
      );
      ctx.stroke();
    }
    ctx.restore();
  },
};

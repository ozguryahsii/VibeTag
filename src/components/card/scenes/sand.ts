import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, ribbon } from "@/components/card/paint";

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
    page: "#F8F3EA",
    card: "#FDF9F2",
    shadow: "rgba(112,78,44,0.14)",
    border: "rgba(221,198,165,0.9)",

    ink: "#30251C",
    inkSoft: "#7D6F61",
    accent: "#A87538",
    divider: "rgba(188,151,104,0.66)",

    score: ["#8D6636", "#C08A42"],
    avatarRing: ["#D7B47E", "#B9874E"],

    pillFill: "rgba(244,235,220,0.94)",
    pillBorder: "rgba(215,184,143,0.54)",
    pillInk: "#99703D",

    rule: "rgba(226,211,190,0.94)",
    raterStack: [
      ["#F1E1C7", "#D7BB90"],
      ["#EAD8BA", "#CEAF80"],
      ["#F5E9D5", "#DECAAA"],
    ],

    brand: "rgba(48,37,28,0.4)",
    mark: ["#DDBF8C", "#C99B5A", "#AA7943"],
    markAlpha: 0.78,
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

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FFFDF8");
    paper.addColorStop(1, "#FAF4E9");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    bloom(
      ctx,
      cardX + cardW * 0.14,
      cardY + cardH * 0.08,
      cardW * 0.34,
      "rgba(226,187,122,0.11)",
    );
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F4E7D1", alpha: 0.66, depth: 0.19, reach: 0.92 },
      { fill: "#E8D2AE", alpha: 0.48, depth: 0.12, reach: 0.67 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F5E9D4", alpha: 0.94, depth: 0.885, reach: 0.82 },
      { fill: "#EBCF9F", alpha: 0.8, depth: 0.94, reach: 0.87 },
      { fill: "#D7B275", alpha: 0.62, depth: 0.986, reach: 0.93 },
    ]);

    ribbon(ctx, cardX, cardY, cardW, cardH, "#E8D2AE", "#FFFDF8", 0.4, 0.025, 0.11);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#FFF9EC", "#D7B275", 0.62, 0.017, 0.085);

    ctx.save();
    ctx.strokeStyle = "rgba(171,125,65,0.14)";
    ctx.lineWidth = cardW * 0.002;
    for (let i = 0; i < 3; i++) {
      const y = cardY + cardH * (0.905 + i * 0.023);
      ctx.beginPath();
      ctx.moveTo(cardX - cardW * 0.03, y);
      ctx.bezierCurveTo(
        cardX + cardW * 0.24,
        y - cardH * 0.035,
        cardX + cardW * 0.56,
        y + cardH * 0.026,
        cardX + cardW * 1.03,
        y - cardH * 0.012,
      );
      ctx.stroke();
    }
    ctx.restore();
  },
};

import type { Scene } from "@/components/card/scene";
import { bloom as glow, crestBottom, crestTop, noise, sparkle } from "@/components/card/paint";

/**
 * Bloom — Vibe Score 91–92.
 *
 * Sunset with the pink brought forward and a soft halo behind the avatar. The
 * sparkle count doubles and they spread down the card instead of hugging the
 * top edge, so the whole surface feels alive rather than just its border.
 */
export const bloom: Scene = {
  key: "bloom",
  name: "Bloom",

  palette: {
    page: "#FCF6F3",
    card: "#FDF8F1",
    shadow: "rgba(236,71,109,0.22)",
    border: "#F5A5A0",

    ink: "#2C1E1E",
    inkSoft: "#7A6663",
    accent: "#EC476D",
    divider: "rgba(236,71,109,0.66)",

    score: ["#F7B94A", "#F0664F", "#E33A82"],
    avatarRing: ["#F8BE5B", "#F0714F", "#E9459A"],

    pillFill: "rgba(255,248,244,0.78)",
    pillBorder: "#F4BBB8",
    pillInk: "#E85F63",

    rule: "rgba(238,213,209,0.95)",
    raterStack: [
      ["#FFD2BE", "#FFB394"],
      ["#FFC2D4", "#FF9FC0"],
      ["#F0DAD6", "#D6B9B4"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#FFA84A", "#FA6A69", "#EA3C90"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(245,140,90,0.55)",
      embers: ["#EC476D", "#F7B94A"],
      count: 14,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FCF6F3";
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.85, h * 0.05, w * 0.72, "rgba(247,150,80,0.16)");
    glow(ctx, w * 0.13, h * 0.95, w * 0.74, "rgba(236,71,109,0.13)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#FDF8F1";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9C46E", alpha: 0.58, depth: 0.23, reach: 0.95 },
      { fill: "#F5865F", alpha: 0.8, depth: 0.19, reach: 0.74 },
      { fill: "#EC4F7E", alpha: 0.9, depth: 0.13, reach: 0.52 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9C87A", alpha: 0.52, depth: 0.89, reach: 0.83 },
      { fill: "#F58F6C", alpha: 0.7, depth: 0.935, reach: 0.86 },
      { fill: "#EC5385", alpha: 0.88, depth: 0.972, reach: 0.9 },
      { fill: "#E33A92", alpha: 0.64, depth: 0.995, reach: 0.94 },
    ]);

    // A halo where the avatar will land, so the portrait sits in light.
    glow(ctx, cx, cardY + u * 0.28, u * 0.5, "rgba(255,214,150,0.28)");

    for (let i = 0; i < 9; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.06 + noise(i * 5) * 0.88),
        cardY + cardH * (0.02 + noise(i * 13) * 0.94),
        cardW * (0.005 + noise(i * 17) * 0.005),
      );
    }
  },
};

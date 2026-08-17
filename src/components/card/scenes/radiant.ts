import type { Scene } from "@/components/card/scene";
import {
  cornerWash,
  diamondDust,
  edgeTwinkles,
  fineBurst,
  fineGlint,
  flowField,
  paperGrain,
  radialHairlines,
} from "@/components/card/fine-art";
import { bloom } from "@/components/card/paint";

/**
 * Radiant — Vibe Score 93–95.
 *
 * Luminous ivory stays open through the centre while fine currents enter from
 * the corners. Twenty hairline rays make the score feel radiant, never loud.
 */
export const radiant: Scene = {
  key: "radiant",
  name: "Radiant",

  palette: {
    page: "#FDF5ED",
    card: "#FFFAF2",
    shadow: "rgba(187,102,62,0.22)",
    border: "rgba(230,157,99,0.76)",

    ink: "#33211B",
    inkSoft: "#775F56",
    accent: "#DD5C49",
    divider: "rgba(220,91,72,0.55)",

    score: ["#E0A43E", "#EA7C47", "#E25755", "#D44370"],
    avatarRing: ["#E6B34A", "#E9774D", "#D94A70"],

    pillFill: "rgba(255,251,244,0.87)",
    pillBorder: "rgba(231,166,120,0.62)",
    pillInk: "#CB5945",

    rule: "rgba(228,197,173,0.82)",
    raterStack: [
      ["#F7D9AD", "#E6A467"],
      ["#F4C9BB", "#DF8B7A"],
      ["#EFDDC9", "#CEAD8D"],
    ],

    brand: "rgba(51,33,27,0.48)",
    mark: ["#E4AE42", "#E76E4F", "#D84472"],
    markAlpha: 0.97,
    // This tier draws its longer 20-line sunburst in surface(); a truthy rays
    // contract still marks it as celebratory without duplicating those lines.
    rays: { stroke: "rgba(220,124,66,0)", embers: ["#DFA642", "#D94D69"], count: 0 },
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FDF8F1");
    paper.addColorStop(0.52, "#FBF3E9");
    paper.addColorStop(1, "#FFF8F0");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.5, h * 0.45, w * 0.78, "rgba(229,164,71,0.09)");
    bloom(ctx, w * 0.1, h * 0.92, w * 0.62, "rgba(213,65,105,0.07)");
  },

  surface(g) {
    const { ctx, cardX, cardY, cardW, cardH, scoreCenterX, scoreCenterY, u } = g;
    const ivory = ctx.createRadialGradient(
      scoreCenterX,
      scoreCenterY,
      cardW * 0.04,
      scoreCenterX,
      scoreCenterY,
      cardW * 0.76,
    );
    ivory.addColorStop(0, "#FFFDF9");
    ivory.addColorStop(0.58, "#FFFAF2");
    ivory.addColorStop(1, "#FFF4E9");
    ctx.fillStyle = ivory;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    cornerWash(g, {
      edge: "topLeft",
      colors: ["#FFE1BE", "#F5A776", "#E96672"],
      reach: 0.8,
      depth: 0.23,
      alpha: 0.24,
    });
    cornerWash(g, {
      edge: "bottomRight",
      colors: ["#FFD6AC", "#F18C68", "#D94A72"],
      reach: 0.86,
      depth: 0.24,
      alpha: 0.26,
    });

    flowField(g, {
      count: 32,
      colors: ["#E7C17A", "#EA9270", "#D95772"],
      y: [0.005, 0.15, 0.065, 0.225],
      spread: 0.085,
      alpha: 0.19,
      lineWidth: 0.001,
      seed: 307,
    });
    flowField(g, {
      count: 30,
      colors: ["#E6C581", "#E98D68", "#D94D73"],
      y: [0.995, 0.86, 0.925, 0.765],
      spread: 0.08,
      alpha: 0.18,
      lineWidth: 0.001,
      seed: 311,
      reverse: true,
    });

    bloom(ctx, scoreCenterX, scoreCenterY, u * 0.52, "rgba(231,154,56,0.08)");
    radialHairlines(
      ctx,
      scoreCenterX,
      scoreCenterY,
      u * 0.43,
      u * 0.32,
      20,
      ["#DFA642", "#E6784E", "#D94D69"],
      0.27,
      317,
    );

    const bursts: [number, number, number, number][] = [
      [0.105, 0.125, 0.075, 0.43],
      [0.9, 0.32, 0.056, 0.34],
      [0.115, 0.805, 0.047, 0.27],
    ];
    bursts.forEach(([x, y, r, alpha], index) =>
      fineBurst(ctx, cardX + cardW * x, cardY + cardH * y, u * r, {
        colors: ["#DFA846", "#E77850", "#D84C70"],
        spokes: 26 + index * 2,
        alpha,
        seed: 321 + index * 23,
      }),
    );

    diamondDust(g, 15, ["#E0AA45", "#E06D56", "#D84B71"], 331, 0.47);
    fineGlint(
      ctx,
      cardX + cardW * 0.89,
      cardY + cardH * 0.68,
      u * 0.01,
      "#D94E70",
      0.42,
    );
    fineGlint(
      ctx,
      cardX + cardW * 0.1,
      cardY + cardH * 0.42,
      u * 0.007,
      "#E0A843",
      0.44,
    );
    paperGrain(g, "#806258", 230, 0.027, 337);
    edgeTwinkles(g, {
      count: 42,
      colors: ["#FFF8EA", "#F0BA50", "#E97553", "#D94373"],
      seed: 349,
      intensity: 1.02,
    });
  },
};

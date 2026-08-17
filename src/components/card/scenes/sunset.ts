import type { Scene } from "@/components/card/scene";
import {
  diamondDust,
  edgeTwinkles,
  fineBurst,
  fineGlint,
  flowField,
  paperGrain,
} from "@/components/card/fine-art";
import { bloom } from "@/components/card/paint";

/**
 * Sunset — Vibe Score 86–90.
 *
 * The first openly bright card. Fine apricot contours move through the paper,
 * but celebration is still restrained to one small burst and the first quiet
 * rays around the score.
 */
export const sunset: Scene = {
  key: "sunset",
  name: "Sunset",

  palette: {
    page: "#FBF6EF",
    card: "#FFD6C4",
    shadow: "rgba(183,112,66,0.18)",
    border: "rgba(230,145,112,0.78)",

    ink: "#34251F",
    inkSoft: "#78685F",
    accent: "#D86B4A",
    divider: "rgba(218,122,82,0.5)",

    score: ["#D89B43", "#E9854B", "#E26355", "#D9546E"],
    avatarRing: ["#E2B256", "#E6814E", "#D85869"],

    pillFill: "rgba(255,250,241,0.82)",
    pillBorder: "rgba(222,160,109,0.58)",
    pillInk: "#C86246",

    rule: "rgba(219,196,172,0.78)",
    raterStack: [
      ["#F3D7B4", "#DFA36C"],
      ["#F2C9BC", "#DC8E7C"],
      ["#EEDDCB", "#C9A98B"],
    ],

    brand: "rgba(52,37,31,0.44)",
    mark: ["#DEAB4A", "#E3744F", "#D6536C"],
    markAlpha: 0.9,
    rays: {
      stroke: "rgba(215,127,67,0.34)",
      embers: ["#D85A66", "#DDA646"],
      count: 10,
    },
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FCF8F2");
    paper.addColorStop(0.58, "#FAF4EC");
    paper.addColorStop(1, "#FFF8F0");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.08, w * 0.58, "rgba(224,157,76,0.1)");
    bloom(ctx, w * 0.15, h * 0.9, w * 0.66, "rgba(214,83,101,0.07)");
  },

  surface(g) {
    const { ctx, cardX, cardY, cardW, cardH, scoreCenterX, scoreCenterY, u } = g;
    const wash = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    wash.addColorStop(0, "#FFE5D2");
    wash.addColorStop(0.52, "#FFD1C0");
    wash.addColorStop(1, "#F7A89E");
    ctx.fillStyle = wash;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    flowField(g, {
      count: 24,
      colors: ["#FFF0DE", "#F4B184", "#E87970", "#FFF8EE"],
      y: [0.26, 0.39, 0.29, 0.47],
      spread: 0.105,
      alpha: 0.27,
      lineWidth: 0.00105,
      seed: 186,
    });
    flowField(g, {
      count: 18,
      colors: ["#FFEBD8", "#F2A27D", "#DE6675", "#FFF4E8"],
      y: [0.91, 0.79, 0.95, 0.81],
      spread: 0.075,
      alpha: 0.22,
      lineWidth: 0.0009,
      seed: 190,
      reverse: true,
    });
    flowField(g, {
      count: 16,
      colors: ["#FFF4E8", "#F2A783", "#E56C70"],
      y: [0.42, 0.58, 0.45, 0.64],
      spread: 0.07,
      alpha: 0.18,
      lineWidth: 0.001,
      seed: 192,
    });

    bloom(
      ctx,
      scoreCenterX,
      scoreCenterY,
      u * 0.42,
      "rgba(226,143,69,0.055)",
    );
    fineBurst(ctx, cardX + cardW * 0.12, cardY + cardH * 0.115, u * 0.07, {
      colors: ["#DCA846", "#E17E55", "#D95D69"],
      spokes: 25,
      alpha: 0.34,
      seed: 193,
    });

    diamondDust(g, 7, ["#DCAA4E", "#D96A67"], 197, 0.38);
    fineGlint(
      ctx,
      cardX + cardW * 0.89,
      cardY + cardH * 0.31,
      u * 0.009,
      "#DCA34A",
      0.42,
    );
    fineGlint(
      ctx,
      cardX + cardW * 0.1,
      cardY + cardH * 0.71,
      u * 0.006,
      "#D75B6D",
      0.34,
    );
    paperGrain(g, "#806A5B", 210, 0.025, 199);
    edgeTwinkles(g, {
      count: 20,
      colors: ["#FFF7E9", "#EFB452", "#E57859", "#D9586D"],
      seed: 257,
      intensity: 0.82,
    });
  },
};

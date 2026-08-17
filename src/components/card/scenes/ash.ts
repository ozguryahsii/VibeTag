import type { Scene } from "@/components/card/scene";
import { flowField, paperGrain } from "@/components/card/fine-art";

/**
 * Ash — Vibe Score 50–60.
 *
 * The first trace of warmth: smoke-grey paper, a quiet mushroom-beige wash
 * and no celebratory decoration yet.
 */
export const ash: Scene = {
  key: "ash",
  name: "Ash",

  palette: {
    page: "#F2F0EC",
    card: "#F8F5F1",
    shadow: "rgba(55,48,42,0.13)",
    border: "rgba(183,176,168,0.7)",

    ink: "#2D2A27",
    inkSoft: "#7A756F",
    accent: "#6E655D",
    divider: "rgba(151,142,133,0.62)",

    score: ["#34312E"],
    avatarRing: ["#B2AAA2"],
    avatarTint: "#8B837B",

    pillFill: "rgba(255,253,250,0.22)",
    pillBorder: "rgba(133,124,115,0.48)",
    pillInk: "#625B55",

    rule: "rgba(208,202,194,0.92)",
    raterStack: [
      ["#E3DED7", "#C4BDB4"],
      ["#DAD4CD", "#B9B1A8"],
      ["#E9E5DF", "#CEC7BE"],
    ],

    brand: "rgba(41,37,34,0.47)",
    mark: ["#4B4641", "#5A5149", "#3D3935"],
    markAlpha: 0.7,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#F8F6F2");
    wash.addColorStop(1, "#ECE8E3");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  },

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FCFBF9");
    paper.addColorStop(0.62, "#F8F5F1");
    paper.addColorStop(1, "#F2EEEA");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    flowField(geom, {
      count: 20,
      colors: ["#D8D3CD", "#BEB7AF", "#DED9D2"],
      y: [0.35, 0.45, 0.31, 0.41],
      spread: 0.115,
      alpha: 0.18,
      lineWidth: 0.001,
      seed: 24,
    });
    flowField(geom, {
      count: 10,
      colors: ["#DDD8D1", "#C3BBB3", "#E6E1DB"],
      y: [0.59, 0.52, 0.64, 0.57],
      spread: 0.075,
      alpha: 0.105,
      lineWidth: 0.0009,
      seed: 108,
      reverse: true,
    });
    // Two restrained champagne seams are the first hint of warmth.
    flowField(geom, {
      count: 2,
      colors: ["#D6BD91", "#C8A66D", "#E1CBA7"],
      y: [0.405, 0.49, 0.36, 0.455],
      spread: 0.038,
      alpha: 0.3,
      lineWidth: 0.00085,
      seed: 207,
    });
    paperGrain(geom, "#746E68", 180, 0.025, 43);

    // Muted, not monochrome: board 55 keeps a trace of real skin colour.
    ctx.filter = "grayscale(0.52) sepia(0.04)";
  },
};

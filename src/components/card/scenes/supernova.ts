import type { Scene, SceneGeom } from "@/components/card/scene";
import {
  fineBurst,
  fineGlint,
  fineHalo,
  paperGrain,
  radialHairlines,
} from "@/components/card/fine-art";
import { bloom, noise } from "@/components/card/paint";

/** Soft layered base wave; unlike two corner blobs it keeps a continuous,
 * ceremonial horizon across the finished card. */
function ceremonialBaseWave(g: SceneGeom): void {
  const { ctx, cardX, cardY, cardW, cardH } = g;
  const layers = [
    { lift: 0.145, alpha: 0.12 },
    { lift: 0.105, alpha: 0.13 },
    { lift: 0.07, alpha: 0.14 },
  ];

  ctx.save();
  layers.forEach(({ lift, alpha }, index) => {
    const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    gradient.addColorStop(0, index === 2 ? "#EFA05C" : "#F6C678");
    gradient.addColorStop(0.5, "#FFE8C7");
    gradient.addColorStop(1, index === 2 ? "#D94A72" : "#F09A73");
    ctx.fillStyle = gradient;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + cardH);
    ctx.lineTo(cardX + cardW, cardY + cardH);
    ctx.lineTo(cardX + cardW, cardY + cardH * (1 - lift * 0.58));
    ctx.bezierCurveTo(
      cardX + cardW * 0.8,
      cardY + cardH * (1 - lift * (1.02 + index * 0.04)),
      cardX + cardW * 0.64,
      cardY + cardH * (1 - lift * 0.38),
      cardX + cardW * 0.5,
      cardY + cardH * (1 - lift * 0.68),
    );
    ctx.bezierCurveTo(
      cardX + cardW * 0.35,
      cardY + cardH * (1 - lift * 1.06),
      cardX + cardW * 0.18,
      cardY + cardH * (1 - lift * 0.4),
      cardX,
      cardY + cardH * (1 - lift * 0.62),
    );
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

/** Mirrored corner threads: ceremonial, balanced and deliberately hairline. */
function mirroredThreadFans(g: SceneGeom): void {
  const { ctx, cardX, cardY, cardW, cardH } = g;
  const colors = ["#DFA33B", "#E96D4C", "#D73A70"];

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    for (const side of [-1, 1] as const) {
      const startX = side < 0 ? cardX - cardW * 0.015 : cardX + cardW * 1.015;
      const endX = cardX + cardW * (side < 0 ? 0.29 + t * 0.055 : 0.71 - t * 0.055);
      const controlX = cardX + cardW * (side < 0 ? 0.09 + t * 0.035 : 0.91 - t * 0.035);
      const topStartY = cardY + cardH * (0.025 + t * 0.105);
      const topEndY = cardY + cardH * (0.245 + t * 0.055);
      const bottomStartY = cardY + cardH * (0.975 - t * 0.105);
      const bottomEndY = cardY + cardH * (0.755 - t * 0.055);

      const topGradient = ctx.createLinearGradient(startX, topStartY, endX, topEndY);
      const bottomGradient = ctx.createLinearGradient(
        startX,
        bottomStartY,
        endX,
        bottomEndY,
      );
      colors.forEach((color, index) => {
        const stop = index / (colors.length - 1);
        topGradient.addColorStop(stop, side < 0 ? color : colors[colors.length - 1 - index]);
        bottomGradient.addColorStop(
          stop,
          side < 0 ? colors[colors.length - 1 - index] : color,
        );
      });

      ctx.globalAlpha = 0.075 + Math.sin(t * Math.PI) * 0.11;
      ctx.lineWidth = Math.max(0.7, cardW * (0.00072 + noise(601 + i * 13) * 0.00028));
      ctx.strokeStyle = topGradient;
      ctx.beginPath();
      ctx.moveTo(startX, topStartY);
      ctx.quadraticCurveTo(controlX, cardY + cardH * (0.12 + t * 0.08), endX, topEndY);
      ctx.stroke();

      ctx.strokeStyle = bottomGradient;
      ctx.beginPath();
      ctx.moveTo(startX, bottomStartY);
      ctx.quadraticCurveTo(
        controlX,
        cardY + cardH * (0.88 - t * 0.08),
        endX,
        bottomEndY,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Supernova — Vibe Score 100.
 *
 * Completion is calm rather than busier: a closed halo, sixty-four hairline
 * rays, mirrored thread fans and only four sparse, paired bursts.
 */
export const supernova: Scene = {
  key: "supernova",
  name: "Supernova",

  palette: {
    page: "#FAF3E9",
    card: "#FFFDF7",
    shadow: "rgba(181,105,50,0.28)",
    border: "rgba(218,151,69,0.82)",

    ink: "#2F2019",
    inkSoft: "#715C53",
    accent: "#D64C52",
    divider: "rgba(214,76,82,0.62)",

    score: ["#D2972C", "#E96A49", "#D9366D"],
    avatarRing: ["#DDA338", "#EA704F", "#D83C70"],

    pillFill: "rgba(255,253,247,0.92)",
    pillBorder: "rgba(224,163,91,0.66)",
    pillInk: "#BF4749",

    rule: "rgba(225,187,151,0.78)",
    raterStack: [
      ["#F9DBA4", "#DFA052"],
      ["#F7C2B2", "#DC7D68"],
      ["#EFBCCB", "#C96788"],
    ],

    brand: "rgba(47,32,25,0.5)",
    mark: ["#DCA035", "#E96749", "#D73770"],
    markAlpha: 1,
    // The scene owns a precise 64-line symmetric corona around the score.
    rays: { stroke: "rgba(216,111,66,0)", embers: ["#DCA037", "#D73870"], count: 0 },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w);
    paper.addColorStop(0, "#FFF9EF");
    paper.addColorStop(0.56, "#FBF3E8");
    paper.addColorStop(1, "#F8EFE3");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.12, h * 0.1, w * 0.56, "rgba(222,149,54,0.1)");
    bloom(ctx, w * 0.88, h * 0.1, w * 0.56, "rgba(222,149,54,0.1)");
    bloom(ctx, w * 0.12, h * 0.9, w * 0.62, "rgba(207,50,104,0.075)");
    bloom(ctx, w * 0.88, h * 0.9, w * 0.62, "rgba(207,50,104,0.075)");
  },

  surface(g) {
    const { ctx, cardX, cardY, cardW, cardH, avatarCenterY, scoreCenterY } = g;
    const ivory = ctx.createRadialGradient(
      cardX + cardW * 0.5,
      scoreCenterY,
      cardW * 0.02,
      cardX + cardW * 0.5,
      scoreCenterY,
      cardW * 0.9,
    );
    ivory.addColorStop(0, "#FFFDF9");
    ivory.addColorStop(0.55, "#FFF9EE");
    ivory.addColorStop(1, "#FFF1E7");
    ctx.fillStyle = ivory;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    ceremonialBaseWave(g);

    mirroredThreadFans(g);
    bloom(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.3, "rgba(226,155,63,0.085)");
    fineHalo(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.202, cardW * 0.202, {
      colors: ["#DDA039", "#E66B4D", "#D73970"],
      alpha: 0.3,
      lines: 2,
    });

    bloom(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.62, "rgba(224,133,51,0.12)");
    radialHairlines(
      ctx,
      cardX + cardW * 0.5,
      scoreCenterY,
      cardW * 0.52,
      cardW * 0.38,
      64,
      ["#DCA037", "#E96A4A", "#D73870", "#E6B457"],
      0.29,
      617,
    );
    fineHalo(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.415, cardW * 0.3, {
      colors: ["#D99C34", "#E96949", "#D73570"],
      alpha: 0.54,
      lines: 3,
    });

    const bursts: [number, number, number, number, number][] = [
      [0.11, 0.13, 0.075, 0.4, 631],
      [0.89, 0.13, 0.075, 0.4, 631],
      [0.075, 0.76, 0.043, 0.25, 647],
      [0.925, 0.76, 0.043, 0.25, 647],
    ];
    bursts.forEach(([x, y, r, alpha, seed]) =>
      fineBurst(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, {
        colors: ["#DDA13A", "#E86A4C", "#D73A70"],
        spokes: r > 0.05 ? 30 : 23,
        alpha,
        seed,
      }),
    );

    const pairedGlints: [number, number, number][] = [
      [0.1, 0.3, 0.009],
      [0.14, 0.42, 0.006],
      [0.09, 0.59, 0.007],
      [0.13, 0.87, 0.008],
    ];
    pairedGlints.forEach(([x, y, r], index) => {
      const color = index % 2 === 0 ? "#DDA039" : "#D73770";
      fineGlint(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, color, 0.48);
      fineGlint(
        ctx,
        cardX + cardW * (1 - x),
        cardY + cardH * y,
        cardW * r,
        color,
        0.48,
      );
    });
    paperGrain(g, "#795A4D", 270, 0.028, 659);
  },
};

import type { SceneGeom } from "@/components/card/scene";
import { noise } from "@/components/card/paint";

type FlowFieldOptions = {
  count: number;
  colors: string[];
  /** Normalized card-height positions for the four cubic-Bezier anchors. */
  y: [number, number, number, number];
  /** Total normalized card-height occupied by the parallel strands. */
  spread: number;
  alpha?: number;
  lineWidth?: number;
  seed?: number;
  reverse?: boolean;
};

/**
 * A field of hairline contours, matching the airy editorial currents used by
 * the approved visual boards. It deliberately draws strokes rather than
 * closed shapes, leaving the paper and content areas light.
 */
export function flowField(
  { ctx, cardX, cardY, cardW, cardH }: SceneGeom,
  {
    count,
    colors,
    y,
    spread,
    alpha = 0.22,
    lineWidth = 0.00135,
    seed = 0,
    reverse = false,
  }: FlowFieldOptions,
): void {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const eased = (t - 0.5) * spread;
    const jitter = (noise(seed + i * 17) - 0.5) * spread * 0.032;
    const offset = eased + jitter;
    const x0 = cardX - cardW * 0.09;
    const x3 = cardX + cardW * 1.09;
    const c1x = cardX + cardW * (0.2 + (noise(seed + i * 11 + 3) - 0.5) * 0.035);
    const c2x = cardX + cardW * (0.72 + (noise(seed + i * 13 + 7) - 0.5) * 0.035);
    const yy = y.map((v, index) =>
      cardY + cardH * (v + offset + Math.sin(t * Math.PI * 2 + index) * spread * 0.008),
    ) as [number, number, number, number];

    const gradient = ctx.createLinearGradient(x0, yy[0], x3, yy[3]);
    const ordered = reverse ? [...colors].reverse() : colors;
    ordered.forEach((color, index) =>
      gradient.addColorStop(index / Math.max(1, ordered.length - 1), color),
    );
    ctx.strokeStyle = gradient;
    // Canvas exports are typically downscaled in the app preview. A modest
    // optical correction keeps the hairlines visible after that resampling
    // without turning them into filled bands.
    ctx.globalAlpha = Math.min(
      1,
      alpha * 1.38 * (0.45 + Math.sin(t * Math.PI) * 0.55),
    );
    ctx.lineWidth =
      cardW * lineWidth * 1.85 * (0.72 + noise(seed + i * 19 + 9) * 0.55);
    ctx.beginPath();
    ctx.moveTo(x0, yy[0]);
    ctx.bezierCurveTo(c1x, yy[1], c2x, yy[2], x3, yy[3]);
    ctx.stroke();
  }
  ctx.restore();
}

type CornerWashOptions = {
  edge: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  /** Largest wash first, most saturated corner colour last. */
  colors: string[];
  reach?: number;
  depth?: number;
  alpha?: number;
};

/**
 * Translucent organic underpainting for the celebratory cards. The contours
 * sit on top of this wash, producing the layered watercolor-and-thread look
 * of the approved boards while the centre remains ivory.
 */
export function cornerWash(
  { ctx, cardX, cardY, cardW, cardH }: SceneGeom,
  {
    edge,
    colors,
    reach = 0.72,
    depth = 0.22,
    alpha = 0.18,
  }: CornerWashOptions,
): void {
  const right = edge === "topRight" || edge === "bottomRight";
  const bottom = edge === "bottomLeft" || edge === "bottomRight";

  ctx.save();
  colors.forEach((color, index) => {
    const scale = 1 - index * 0.16;
    const xCorner = right ? cardX + cardW : cardX;
    const yCorner = bottom ? cardY + cardH : cardY;
    const xEdge = xCorner + (right ? -1 : 1) * cardW * reach * scale;
    const yEdge = yCorner + (bottom ? -1 : 1) * cardH * depth * scale;
    const xControl = xCorner + (right ? -1 : 1) * cardW * reach * (0.6 + index * 0.025);
    const yControl = yCorner + (bottom ? -1 : 1) * cardH * depth * (0.7 + index * 0.04);

    ctx.globalAlpha = alpha * (0.75 + index * 0.13);
    const wash = ctx.createLinearGradient(xEdge, yEdge, xCorner, yCorner);
    wash.addColorStop(0, `${color}00`);
    wash.addColorStop(0.42, `${color}78`);
    wash.addColorStop(1, color);
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.moveTo(xCorner, yCorner);
    ctx.lineTo(xEdge, yCorner);
    ctx.bezierCurveTo(
      xControl,
      yCorner + (bottom ? -1 : 1) * cardH * depth * 0.04,
      xCorner + (right ? -1 : 1) * cardW * reach * (0.31 + index * 0.025),
      yControl,
      xCorner,
      yEdge,
    );
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

/** Deterministic pin-point paper grain; no bitmap texture or random flicker. */
export function paperGrain(
  { ctx, cardX, cardY, cardW, cardH }: SceneGeom,
  color: string,
  count = 170,
  alpha = 0.03,
  seed = 0,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const x = cardX + noise(seed + i * 23 + 1) * cardW;
    const y = cardY + noise(seed + i * 29 + 5) * cardH;
    const a = alpha * (0.3 + noise(seed + i * 31 + 11) * 0.7);
    ctx.globalAlpha = a;
    if (i % 4 === 0) {
      const len = cardW * (0.0012 + noise(seed + i * 37) * 0.0024);
      ctx.lineWidth = Math.max(0.55, cardW * 0.00055);
      ctx.beginPath();
      ctx.moveTo(x - len, y);
      ctx.lineTo(x + len, y + len * 0.25);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, cardW * (0.00045 + noise(seed + i * 41) * 0.00055), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function fineGlint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 0.72,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.7, r * 0.12);
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.05, 0, -r);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.05, r, 0);
  ctx.quadraticCurveTo(r * 0.18, r * 0.05, 0, r);
  ctx.quadraticCurveTo(-r * 0.18, r * 0.05, -r, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.6, r * 0.075), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function diamondDust(
  { ctx, cardX, cardY, cardW, cardH }: SceneGeom,
  count: number,
  colors: string[],
  seed = 0,
  alpha = 0.62,
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = cardX + cardW * (0.055 + noise(seed + i * 17) * 0.89);
    const y = cardY + cardH * (0.035 + noise(seed + i * 31 + 7) * 0.91);
    const r = cardW * (0.0014 + noise(seed + i * 43 + 3) * 0.0025);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = alpha * (0.42 + noise(seed + i * 47) * 0.58);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.restore();
}

type FineBurstOptions = {
  colors: string[];
  spokes?: number;
  alpha?: number;
  seed?: number;
  startAngle?: number;
  arc?: number;
};

/** Fine, irregular firework with dust-sized tips instead of cartoon dots. */
export function fineBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  {
    colors,
    spokes = 28,
    alpha = 0.55,
    seed = 0,
    startAngle = 0,
    arc = Math.PI * 2,
  }: FineBurstOptions,
): void {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < spokes; i++) {
    const a = startAngle + (i / spokes) * arc + (noise(seed + i * 7) - 0.5) * 0.035;
    const inner = r * (0.14 + noise(seed + i * 13 + 1) * 0.09);
    const outer = r * (0.68 + noise(seed + i * 17 + 2) * 0.32);
    const color = colors[i % colors.length];
    ctx.globalAlpha = Math.min(
      1,
      alpha * 1.18 * (0.48 + noise(seed + i * 19 + 5) * 0.52),
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.05, r * (0.012 + noise(seed + i * 23) * 0.012));
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    ctx.quadraticCurveTo(
      x + Math.cos(a + 0.015) * outer * 0.62,
      y + Math.sin(a + 0.015) * outer * 0.62,
      x + Math.cos(a) * outer,
      y + Math.sin(a) * outer,
    );
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.fillStyle = color;
      ctx.globalAlpha *= 0.66;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(a) * outer * 1.04,
        y + Math.sin(a) * outer * 1.04,
        Math.max(0.55, r * 0.008),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

type HaloOptions = {
  colors: string[];
  open?: number;
  rotation?: number;
  alpha?: number;
  lines?: number;
};

export function fineHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  { colors, open = 0, rotation = 0, alpha = 0.45, lines = 2 }: HaloOptions,
): void {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < lines; i++) {
    const inset = 1 + i * 0.085;
    const gradient = ctx.createLinearGradient(x - rx, y, x + rx, y);
    colors.forEach((color, index) =>
      gradient.addColorStop(index / Math.max(1, colors.length - 1), color),
    );
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = alpha * (1 - i * 0.38);
    ctx.lineWidth = Math.max(0.8, rx * (i === 0 ? 0.007 : 0.0035));
    ctx.beginPath();
    const start = rotation + open / 2;
    const end = rotation + Math.PI * 2 - open / 2;
    ctx.ellipse(x, y, rx * inset, ry * inset, -0.05, start, end);
    ctx.stroke();
  }
  ctx.restore();
}

export function radialHairlines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  count: number,
  colors: string[],
  alpha = 0.26,
  seed = 0,
): void {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const inner = 0.7 + noise(seed + i * 13) * 0.08;
    const outer = 0.96 + noise(seed + i * 17) * 0.18;
    ctx.strokeStyle = colors[i % colors.length];
    ctx.globalAlpha = alpha * (0.46 + noise(seed + i * 19) * 0.54);
    ctx.lineWidth = Math.max(0.65, rx * 0.0035);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * rx * inner, y + Math.sin(a) * ry * inner);
    ctx.lineTo(x + Math.cos(a) * rx * outer, y + Math.sin(a) * ry * outer);
    ctx.stroke();
  }
  ctx.restore();
}

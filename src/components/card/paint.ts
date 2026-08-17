import type { IconDef } from "@/lib/icons";

/**
 * Canvas primitives shared by every Vibe Card scene.
 *
 * Nothing here knows about scores or bands — these are brushes. A scene picks
 * up the brushes it wants; the shared composition in `draw.ts` uses the rest.
 */

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function bloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/** Deterministic jitter — scatter that never moves between renders. */
export function noise(i: number): number {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Darken (negative) or lighten (positive) a hex colour by a percentage. */
export function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const amt = Math.round(2.55 * pct);
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#FFFFFF",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const FINGERPRINT_PATHS = [
  "M8.5 27C15 13 27 5.5 40 5.5S66 13.5 72 28",
  "M4.5 52V43C4.5 24 20 12.5 40 12.5S75.5 25 75.5 44V52",
  "M13.5 63V44C13.5 29 24.8 20 40 20S66.8 30 66.8 45.5V63",
  "M22.7 73.5V46C22.7 34.7 29.9 27.6 40.1 27.6 51.3 27.6 59 35.4 59 47V64.5",
  "M40.6 35.2C33.4 35.2 29.3 40.3 29.3 47.5 29.3 58.3 34.2 76.9 38.5 88.7 40 92.9 44.3 93 46 88.8 50.5 77.6 55.7 59.2 55.7 47.6 55.7 40 49.9 35.2 40.6 35.2Z",
];

/** The Vibe Tag mark, used as a watermark in the card's top corner. */
export function fingerprint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  colors: [string, string, string] | null,
  alpha = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 80, width / 80);
  if (colors) {
    const g = ctx.createLinearGradient(5, 18, 76, 68);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.48, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.strokeStyle = g;
  } else {
    ctx.strokeStyle = "#C6B49D";
  }
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 3.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of FINGERPRINT_PATHS) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/** A 24×24 line icon centred at (x, y). */
export function icon(
  ctx: CanvasRenderingContext2D,
  def: IconDef,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of def.paths ?? []) ctx.stroke(new Path2D(d));
  for (const [cxx, cyy, r] of def.circles ?? []) {
    ctx.beginPath();
    ctx.arc(cxx, cyy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const d of def.fills ?? []) ctx.fill(new Path2D(d));
  ctx.restore();
}

export type Layer = { fill: string; alpha: number; depth: number; reach: number };

/**
 * A band of curved layers sweeping in from the top edge.
 *
 * `depth` is how far down the card it reaches, `reach` how far across the top
 * it starts — stacking three or four with falling alpha is what makes the
 * warm cards look like light rather than like stripes.
 */
export function crestTop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  layers: Layer[],
) {
  for (const l of layers) {
    ctx.save();
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = l.fill;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * l.reach, y);
    ctx.bezierCurveTo(
      x + w * (l.reach - 0.12),
      y + h * 0.025,
      x + w * 0.38,
      y + h * l.depth * 0.72,
      x,
      y + h * l.depth,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** The same idea rising from the bottom edge. `depth` is the start height. */
export function crestBottom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  layers: Layer[],
) {
  for (const l of layers) {
    ctx.save();
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = l.fill;
    ctx.beginPath();
    ctx.moveTo(x, y + h * l.depth);
    ctx.bezierCurveTo(
      x + w * 0.22,
      y + h * l.reach,
      x + w * 0.57,
      y + h * (l.depth + 0.06),
      x + w,
      y + h * (l.reach - 0.01),
    );
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** A soft diagonal ribbon — the aurora band's signature. */
export function ribbon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  from: string,
  to: string,
  offset: number,
  thickness: number,
  alpha: number,
) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = g;
  ctx.lineWidth = h * thickness;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.1, y + h * offset);
  ctx.bezierCurveTo(
    x + w * 0.28,
    y + h * (offset - 0.13),
    x + w * 0.66,
    y + h * (offset + 0.15),
    x + w * 1.1,
    y + h * (offset - 0.04),
  );
  ctx.stroke();
  ctx.restore();
}

/** A radial burst of spokes and embers. */
export function firework(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  colors: string[],
  seed: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  const spokes = 14;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + noise(seed) * 0.6;
    const len = r * (0.62 + noise(seed + i) * 0.38);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = r * 0.035;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.14, y + Math.sin(a) * r * 0.14);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();

    ctx.fillStyle = colors[(i + 1) % colors.length];
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(a) * len * 1.1,
      y + Math.sin(a) * len * 1.1,
      r * 0.045,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Scattered rectangles, tilted. Reserved for the very top of the ladder. */
export function confetti(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colors: string[],
  count: number,
  size: number,
  seed = 0,
) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const px = x + noise(i + seed) * w;
    const py = y + noise(i + seed + 500) * h;
    const a = noise(i + seed + 900) * Math.PI;
    const sw = size * (0.6 + noise(i + seed + 1300) * 0.9);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.globalAlpha = 0.5 + noise(i + seed + 1700) * 0.5;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-sw / 2, -sw / 5, sw, sw / 2.5);
    ctx.restore();
  }
  ctx.restore();
}

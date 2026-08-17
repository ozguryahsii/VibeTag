import { iconFor } from "@/lib/icons";
import { bandFor, type CardBand } from "@/lib/card-bands";
import { fill, type Dictionary } from "@/lib/i18n";
import { initialsOf } from "@/components/Avatar";
import { SCENES } from "@/components/card/scenes";
import type { CardLayoutKind, Scene } from "@/components/card/scene";
import type { BadgeTier } from "@/lib/badges";
import { TIER_STYLE } from "@/lib/tier-style";
import { fingerprint, icon, noise, roundRect, shade } from "@/components/card/paint";

/**
 * The Vibe Card composition.
 *
 * Written once and identical for every score. What changes with the score is
 * the scene — the page behind the card, the surface inside it, anything thrown
 * over the top, and the colours this file paints with. See `scene.ts`.
 *
 * The card is drawn on a real canvas at full export resolution, so the preview
 * is pixel-for-pixel what gets shared. No html2canvas, no screenshotting — the
 * growth loop should not be flaky.
 */

export type CardData = {
  name: string;
  username: string;
  score: number;
  ratingCount: number;
  percentile: number | null;
  tags: { key: string; label: string }[];
  /** Best tier per family, best first — already trimmed by the page. */
  badges: { key: string; label: string; icon: string; tier: BadgeTier }[];
  avatarUrl: string | null;
  avatarColor: string;
};

export const FORMATS = {
  story: { w: 1080, h: 1920, labelKey: "formatStory", hint: "Instagram · TikTok" },
  square: { w: 1080, h: 1080, labelKey: "formatSquare", hint: "Instagram · WhatsApp" },
  wide: { w: 1600, h: 900, labelKey: "formatWide", hint: "X · LinkedIn" },
} as const;

export type FormatKey = keyof typeof FORMATS;

export type DrawOptions = {
  ctx: CanvasRenderingContext2D;
  data: CardData;
  format: FormatKey;
  showScore: boolean;
  showBadges: boolean;
  photo: HTMLImageElement | null;
  d: Dictionary;
};

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function sans(weight: number, size: number) {
  return `${weight} ${size}px ${cssVar("--font-dm-sans", "DM Sans")}, sans-serif`;
}

function serif(weight: number, size: number) {
  const playfair = cssVar("--font-playfair", '"Playfair Display"');
  return `${weight} ${size}px Didot, "Bodoni 72", ${playfair}, Georgia, serif`;
}

/** One colour paints flat; several become a gradient along the given line. */
function paintOf(
  ctx: CanvasRenderingContext2D,
  stops: string[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): string | CanvasGradient {
  if (stops.length === 1) return stops[0];
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

/** Which design a score gets. Exported so the studio can name it on screen. */
export function sceneFor(score: number): { band: CardBand; scene: Scene } {
  const band = bandFor(score);
  return { band, scene: SCENES[band.key] };
}

export function drawCard({
  ctx,
  data,
  format,
  showScore,
  showBadges,
  photo,
  d,
}: DrawOptions): void {
  const { w, h } = FORMATS[format];
  ctx.canvas.width = w;
  ctx.canvas.height = h;

  const { scene } = sceneFor(data.score);
  const p = scene.palette;

  // ------------------------------------------------------------- geometry
  // Story keeps the approved portrait composition. Square and wide use the
  // available canvas as an actual card surface, then reflow the same content
  // with a height-derived unit so type and portraits stay optically consistent.
  const portraitRatio = 2.21;
  const pageInset = Math.min(w, h) * 0.06;
  const cardW =
    format === "story"
      ? Math.min(w - pageInset * 2, (h - pageInset * 2) / portraitRatio)
      : w - pageInset * 2;
  const cardH =
    format === "story" ? cardW * portraitRatio : h - pageInset * 2;
  const cardX = (w - cardW) / 2;
  const cardY = (h - cardH) / 2;
  const radius = Math.min(cardW, cardH) * 0.058;
  // Landscape compositions use a slightly larger optical unit than the old
  // portrait stack. This keeps names, pills and footer copy legible when a
  // 1600×900 export is scaled down in a social feed.
  const u = format === "story" ? cardW : cardH / 1.85;
  const cx = cardX + cardW / 2;

  // Badges occupy a permanent compact strip above the footer. Toggling them
  // never resizes or shifts the card, so exports remain directly comparable.
  const medals = showBadges ? data.badges.slice(0, 3) : [];
  const layout: CardLayoutKind = data.score >= 93 ? "celebratory" : "editorial";
  const isStory = format === "story";
  const isSquare = format === "square";

  const identityCenterX = isStory
    ? cx
    : isSquare
      ? cardX + cardW * 0.27
      : cardX + cardW * 0.18;
  const scoreCenterX = isStory
    ? cx
    : isSquare
      ? cardX + cardW * 0.7
      : cx;
  const traitCenterX = isStory
    ? cx
    : isSquare
      ? cx
      : cardX + cardW * 0.82;

  const formatY = (storyUnits: number, squareRatio: number, wideRatio: number) =>
    cardY +
    (isStory ? u * storyUnits : cardH * (isSquare ? squareRatio : wideRatio));

  const avatarCenterY = formatY(
    layout === "editorial" ? 0.49 : 0.305,
    0.28,
    0.39,
  );
  const nameY = formatY(layout === "editorial" ? 0.9 : 0.61, 0.5, 0.65);
  const dividerY = formatY(
    layout === "editorial" ? 0.965 : 0.65,
    0.56,
    0.72,
  );
  const myVibeY = formatY(
    layout === "editorial" ? 1.064 : 0.78,
    0.14,
    0.22,
  );
  const scoreCenterY = formatY(
    layout === "editorial" ? 1.26 : 1.01,
    0.31,
    0.43,
  );
  const scoreBaselineY = formatY(
    layout === "editorial" ? 1.39 : 1.18,
    0.43,
    0.57,
  );
  const vibeScoreY = formatY(
    layout === "editorial" ? 1.465 : 1.265,
    0.51,
    0.64,
  );
  const moodY = formatY(
    showScore
      ? layout === "editorial"
        ? 1.57
        : 1.41
      : layout === "editorial"
        ? 1.3
        : 1.05,
    showScore ? 0.6 : 0.34,
    showScore ? 0.72 : 0.42,
  );
  const pillStartY = formatY(
    showScore
      ? layout === "editorial"
        ? 1.635
        : 1.485
      : layout === "editorial"
        ? 1.365
        : 1.125,
    showScore ? 0.68 : 0.64,
    0.3,
  );
  const footerRuleY = formatY(
    layout === "editorial" ? 1.82 : 1.845,
    0.83,
    0.83,
  );
  const footerContentY = formatY(
    layout === "editorial" ? 1.95 : 1.98,
    0.92,
    0.92,
  );

  const geom = {
    ctx,
    w,
    h,
    cardX,
    cardY,
    cardW,
    cardH,
    radius,
    cx,
    u,
    layout,
    avatarCenterX: identityCenterX,
    avatarCenterY,
    scoreCenterX,
    scoreCenterY,
    footerRuleY,
  };

  // ------------------------------------------------------------- backdrop
  scene.backdrop(geom);

  // ---------------------------------------------------------------- card
  ctx.save();
  ctx.shadowColor = p.shadow;
  ctx.shadowBlur = u * 0.09;
  ctx.shadowOffsetY = u * 0.022;
  ctx.fillStyle = p.card;
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  scene.surface(geom);

  // --------------------------------------------------- fingerprint watermark
  fingerprint(
    ctx,
    cardX + cardW - u * 0.19,
    cardY + u * 0.045,
    u * 0.15,
    p.mark,
    p.markAlpha,
  );

  const center = (text: string, cy: number, centerX = cx) => {
    ctx.textAlign = "center";
    ctx.fillText(text, centerX, cy);
    ctx.textAlign = "left";
  };

  // ---------------------------------------------------------------- avatar
  const ar = u * 0.225;
  let y = avatarCenterY;

  ctx.save();
  ctx.shadowColor = "rgba(31,31,31,0.15)";
  ctx.shadowBlur = u * 0.05;
  ctx.shadowOffsetY = u * 0.012;
  ctx.beginPath();
  ctx.arc(identityCenterX, y, ar, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(identityCenterX, y, ar * 0.94, 0, Math.PI * 2);
  ctx.clip();
  if (photo && photo.complete && photo.naturalWidth > 0) {
    const s = Math.max((ar * 2) / photo.naturalWidth, (ar * 2) / photo.naturalHeight);
    const iw = photo.naturalWidth * s;
    const ih = photo.naturalHeight * s;
    ctx.drawImage(photo, identityCenterX - iw / 2, y - ih / 2, iw, ih);
  } else {
    const tint = p.avatarTint ?? data.avatarColor;
    const ag = ctx.createLinearGradient(
      identityCenterX - ar,
      y - ar,
      identityCenterX + ar,
      y + ar,
    );
    ag.addColorStop(0, `${tint}2E`);
    ag.addColorStop(1, `${tint}17`);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(identityCenterX - ar, y - ar, ar * 2, ar * 2);
    ctx.fillStyle = ag;
    ctx.fillRect(identityCenterX - ar, y - ar, ar * 2, ar * 2);
    ctx.fillStyle = shade(tint, -22);
    ctx.font = serif(400, ar * 0.82);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initialsOf(data.name), identityCenterX, y + ar * 0.04);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(identityCenterX, y, ar, 0, Math.PI * 2);
  ctx.strokeStyle = paintOf(
    ctx,
    p.avatarRing,
    identityCenterX - ar,
    y - ar,
    identityCenterX + ar,
    y + ar,
  );
  ctx.lineWidth = u * (p.avatarRing.length > 1 ? 0.008 : 0.006);
  ctx.stroke();

  // ------------------------------------------------------------------ name
  y = nameY;
  ctx.fillStyle = p.ink;
  ctx.font =
    layout === "editorial" ? serif(400, u * 0.068) : sans(700, u * 0.068);
  center(data.name, y, identityCenterX);

  // --------------------------------------------------------------- divider
  y = dividerY;
  const dw = u * 0.1;
  ctx.strokeStyle = p.divider;
  ctx.lineWidth = u * 0.002;
  ctx.beginPath();
  ctx.moveTo(identityCenterX - dw, y);
  ctx.lineTo(identityCenterX - u * 0.022, y);
  ctx.moveTo(identityCenterX + u * 0.022, y);
  ctx.lineTo(identityCenterX + dw, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(identityCenterX, y, u * 0.007, 0, Math.PI * 2);
  ctx.fillStyle = p.accent;
  ctx.fill();

  // -------------------------------------------------------------- MY VIBE
  y = myVibeY;
  ctx.fillStyle = p.accent;
  ctx.font = sans(600, u * (layout === "editorial" ? 0.038 : 0.04));
  ctx.letterSpacing = `${u * 0.0155}px`;
  center("MY VIBE", y, scoreCenterX);
  ctx.letterSpacing = "0px";

  if (showScore) {
    const scoreSize = u * (layout === "editorial" ? 0.4 : 0.42);
    const scoreCy = scoreCenterY;

    // ------------------------------------------------------------- rays
    if (p.rays) {
      const { stroke, embers, count } = p.rays;
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineCap = "round";
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.12;
        const inner = u * (0.27 + noise(i) * 0.025);
        const outer = inner + u * (0.045 + noise(i + 40) * 0.035);
        ctx.globalAlpha = 0.28 + noise(i + 7) * 0.42;
        ctx.lineWidth = u * 0.003;
        ctx.beginPath();
        ctx.moveTo(
          scoreCenterX + Math.cos(a) * inner,
          scoreCy + Math.sin(a) * inner * 0.8,
        );
        ctx.lineTo(
          scoreCenterX + Math.cos(a) * outer,
          scoreCy + Math.sin(a) * outer * 0.8,
        );
        ctx.stroke();
      }
      for (let i = 0; i < count - 2; i++) {
        const a = noise(i + 90) * Math.PI * 2;
        const dist = u * (0.22 + noise(i + 130) * 0.16);
        const sy = scoreCy + Math.sin(a) * dist * 0.82;
        // keep the label band clear
        if (sy > scoreCy + u * 0.12) continue;
        ctx.globalAlpha = 0.18 + noise(i + 200) * 0.4;
        ctx.fillStyle = i % 3 === 0 ? embers[0] : embers[1];
        ctx.beginPath();
        ctx.arc(
          scoreCenterX + Math.cos(a) * dist,
          sy,
          u * (0.0025 + noise(i + 300) * 0.003),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------ score
    y = scoreBaselineY;
    ctx.font = serif(400, scoreSize);
    ctx.fillStyle = paintOf(
      ctx,
      p.score,
      scoreCenterX - u * 0.2,
      y - scoreSize,
      scoreCenterX + u * 0.2,
      y,
    );
    center(String(data.score), y, scoreCenterX);

    // ------------------------------------------------------- VIBE SCORE
    // Cleared of the numeral rather than tucked under it: Didot and its
    // fallbacks draw old-style figures, so 2, 5, 7 and 9 hang below the
    // baseline and would otherwise cross the label.
    y = vibeScoreY;
    ctx.fillStyle = p.accent;
    ctx.font = sans(600, u * 0.0365);
    ctx.letterSpacing = `${u * 0.0135}px`;
    center("VIBE SCORE", y, scoreCenterX);
    ctx.letterSpacing = "0px";
  } else {
    y = cardY + u * (layout === "editorial" ? 1.15 : 0.88);
  }

  // -------------------------------------------------------------- mood line
  y = moodY;
  const moodText = !showScore
    ? d.card.seeMeAs
    : data.percentile && data.score >= 80
      ? fill(d.card.moodTop, { n: data.percentile })
      : data.score >= 85
        ? d.card.moodStandout
        : data.score >= 72
          ? d.card.moodGrowing
          : d.card.moodRoom;

  const moodWeight = layout === "editorial" ? 500 : 600;
  let moodFont = u * (layout === "editorial" ? 0.04 : 0.05);
  const glyphR = u * (layout === "editorial" ? 0.024 : 0.027);
  const moodChrome = glyphR * 2 + u * 0.022;
  ctx.font = sans(moodWeight, moodFont);
  let mw = ctx.measureText(moodText).width;
  const moodLimit = u * 0.82;
  if (mw + moodChrome > moodLimit) {
    moodFont *= (moodLimit - moodChrome) / mw;
    ctx.font = sans(moodWeight, moodFont);
    mw = ctx.measureText(moodText).width;
  }
  const moodStart = scoreCenterX - (mw + glyphR * 2 + u * 0.022) / 2;

  ctx.beginPath();
  ctx.arc(moodStart + glyphR, y - u * 0.013, glyphR, 0, Math.PI * 2);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = u * 0.0025;
  ctx.stroke();
  ctx.font = sans(400, u * 0.027);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.accent;
  ctx.fillText(p.moodGlyph, moodStart + glyphR, y - u * 0.012);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.font = sans(moodWeight, moodFont);
  ctx.fillStyle = p.accent;
  ctx.fillText(moodText, moodStart + glyphR * 2 + u * 0.022, y);

  // ------------------------------------------------------------ trait pills
  y = pillStartY;
  const pillH = u * (layout === "editorial" ? 0.098 : 0.118);
  const pillGap = u * (layout === "editorial" ? 0.018 : 0.025);
  const pillWeight = layout === "editorial" ? 500 : 600;
  let pillFont = u * (layout === "editorial" ? 0.036 : 0.041);
  // The calm reference keeps one restrained row; the celebratory reference
  // expands to a deliberate two-column grid. Non-story formats have room to
  // retain all four tags: square spans them, wide gives them their own column.
  const chosen = data.tags.slice(
    0,
    isStory ? (layout === "editorial" ? 3 : 4) : 4,
  );

  const limit = isStory
    ? u * (layout === "editorial" ? 0.9 : 0.88)
    : u * (isSquare ? 1.75 : 0.95);
  ctx.font = sans(pillWeight, pillFont);
  const iconBox = () => pillFont * 1.18;
  const measureWidths = () =>
    chosen.map(
      (t) =>
        ctx.measureText(t.label).width +
        iconBox() +
        u * (layout === "editorial" ? 0.07 : 0.088),
    );
  let widths = measureWidths();

  const rows: number[][] =
    (isStory && layout === "editorial") || isSquare
      ? [chosen.map((_, i) => i)]
      : chosen.reduce<number[][]>((acc, _, i) => {
        if (i % 2 === 0) acc.push([i]);
        else acc[acc.length - 1].push(i);
        return acc;
      }, []);

  if (rows.length > 0) {
    const widest = Math.max(
      ...rows.map(
        (r) => r.reduce((a, i) => a + widths[i], 0) + pillGap * (r.length - 1),
      ),
    );
    if (widest > limit) {
      const k = limit / widest;
      pillFont *= k;
      ctx.font = sans(pillWeight, pillFont);
      widths = measureWidths();
    }
  }

  for (const r of rows) {
    const total = r.reduce((a, i) => a + widths[i], 0) + pillGap * (r.length - 1);
    let x = traitCenterX - total / 2;
    for (const i of r) {
      const t = chosen[i];
      ctx.fillStyle = p.pillFill;
      ctx.strokeStyle = p.pillBorder;
      ctx.lineWidth = u * 0.0025;
      roundRect(ctx, x, y, widths[i], pillH, pillH / 2);
      ctx.fill();
      ctx.stroke();

      icon(
        ctx,
        iconFor(t.key),
        x + u * 0.03 + iconBox() / 2,
        y + pillH / 2,
        iconBox(),
        p.pillInk,
      );
      ctx.font = sans(pillWeight, pillFont);
      ctx.fillStyle = p.pillInk;
      ctx.textBaseline = "middle";
      ctx.fillText(t.label, x + u * 0.03 + iconBox() + u * 0.022, y + pillH / 2);
      ctx.textBaseline = "alphabetic";

      x += widths[i] + pillGap;
    }
    y += pillH + pillGap;
  }

  // ------------------------------------------------------------ footer lines
  const footLineY = footerRuleY;
  const footY = footerContentY;

  // ----------------------------------------------------------- badge medals
  // A narrow, always-reserved strip keeps the badge toggle useful without
  // changing the composition or introducing a second large hierarchy.
  if (medals.length > 0) {
    const medalR = u * 0.0215;
    const gap = u * 0.018;
    const cellW = u * 0.245;
    const total = cellW * medals.length + gap * (medals.length - 1);
    const startX = cx - total / 2;
    const my = footLineY - u * 0.055;

    for (let i = 0; i < medals.length; i++) {
      const m = medals[i];
      const [from, to] = TIER_STYLE[m.tier].canvas;
      const cellX = startX + i * (cellW + gap);
      const mx = cellX + medalR;

      const mg = ctx.createLinearGradient(
        mx - medalR,
        my - medalR,
        mx + medalR,
        my + medalR,
      );
      mg.addColorStop(0, from);
      mg.addColorStop(1, to);

      ctx.beginPath();
      ctx.arc(mx, my, medalR, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = u * 0.003;
      ctx.stroke();

      // The glyph never changes between tiers — only the metal does.
      icon(ctx, iconFor(m.icon), mx, my, medalR * 1.12, "#FFFFFF");

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = sans(700, u * 0.019);
      ctx.fillStyle = p.ink;
      ctx.fillText(
        m.label,
        cellX + medalR * 2 + u * 0.01,
        my,
        cellW - medalR * 2 - u * 0.012,
      );
      ctx.textBaseline = "alphabetic";
    }
  }

  // ----------------------------------------------------------- rater footer
  ctx.strokeStyle = p.rule;
  ctx.lineWidth = u * 0.003;
  ctx.beginPath();
  ctx.moveTo(cardX + u * 0.09, footLineY);
  ctx.lineTo(cardX + cardW - u * 0.09, footLineY);
  ctx.stroke();

  // Stand-in avatars: raters are anonymous by design, so these are decorative
  // silhouettes — never the actual people who rated you.
  const stackR = u * 0.056;
  const shown = Math.min(3, data.ratingCount);
  let sx = cardX + u * 0.075 + stackR;

  for (let i = 0; i < shown; i++) {
    ctx.beginPath();
    ctx.arc(sx, footY, stackR, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, footY, stackR * 0.86, 0, Math.PI * 2);
    ctx.clip();
    const [from, to] = p.raterStack[i % p.raterStack.length];
    const pg = ctx.createLinearGradient(
      sx - stackR,
      footY - stackR,
      sx + stackR,
      footY + stackR,
    );
    pg.addColorStop(0, from);
    pg.addColorStop(1, to);
    ctx.fillStyle = pg;
    ctx.fillRect(sx - stackR, footY - stackR, stackR * 2, stackR * 2);

    // Three tiny fictional portrait illustrations. They communicate “people”
    // much more clearly than the old white head-and-shoulders glyphs while
    // preserving rater anonymity (these never represent actual accounts).
    const skin = ["#E7B188", "#C98963", "#D8A47D"][i % 3];
    const hair = ["#553225", "#241F1D", "#6A4331"][i % 3];
    ctx.fillStyle = shade(to, -12 - i * 3);
    ctx.beginPath();
    ctx.ellipse(
      sx,
      footY + stackR * 0.78,
      stackR * 0.68,
      stackR * 0.58,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(
      sx + (i - 1) * stackR * 0.035,
      footY - stackR * 0.08,
      stackR * 0.34,
      stackR * 0.44,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(
      sx,
      footY - stackR * 0.35,
      stackR * (i === 0 ? 0.42 : 0.37),
      stackR * (i === 0 ? 0.28 : 0.23),
      i === 2 ? -0.16 : 0.08,
      Math.PI,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "rgba(54,39,33,0.72)";
    for (const dx of [-0.12, 0.12]) {
      ctx.beginPath();
      ctx.arc(sx + stackR * dx, footY - stackR * 0.06, stackR * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    sx += stackR * 1.25;
  }

  ctx.textBaseline = "middle";
  const textX = shown > 0 ? sx + stackR * 0.62 : cardX + u * 0.09;
  ctx.font = sans(500, u * (layout === "editorial" ? 0.032 : 0.036));
  ctx.fillStyle = p.inkSoft;
  ctx.fillText(d.common.ratedBy, textX, footY - u * 0.022);
  ctx.font = sans(500, u * (layout === "editorial" ? 0.043 : 0.047));
  ctx.fillStyle = p.ink;
  ctx.fillText(
    `${data.ratingCount} ${d.common.people}`,
    textX,
    footY + u * 0.03,
    cardX + cardW - u * 0.07 - textX,
  );
  ctx.textBaseline = "alphabetic";

  ctx.restore(); // end card clip

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.strokeStyle = p.border;
  ctx.lineWidth = u * 0.003;
  ctx.stroke();
  ctx.restore();

  // Anything that belongs in front of the card — bursts, confetti.
  scene.overlay?.(geom);
}

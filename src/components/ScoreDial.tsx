"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Vibe Score hero: a gradient arc that fills while the number counts
 * up from 0. Spotify-Wrapped style reveal — the moment the app is built
 * around, so it gets its own easing and a one-time shine sweep.
 */
export function ScoreDial({
  score,
  label = "VIBE SCORE",
  caption,
  size = 236,
}: {
  score: number;
  label?: string;
  caption?: string;
  size?: number;
}) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      return;
    }
    const start = performance.now();
    const duration = 1400;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setShown(Math.round(eased * score));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [score]);

  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sweep = 0.78; // 280° arc, open at the bottom
  const arc = c * sweep;
  const progress = (shown / 100) * arc;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-[234deg]"
        aria-hidden
      >
        <defs>
          <linearGradient id="dial" x1="0" y1="0" x2={size} y2={size}>
            <stop offset="0%" stopColor="#FF8A3D" />
            <stop offset="100%" stopColor="#FF5C77" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F0E5DD"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#dial)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${c}`}
        />
      </svg>

      <div className="relative text-center">
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-muted mb-1">
          MY VIBE
        </div>
        <div
          className="font-black leading-none grad-text tabular-nums"
          style={{ fontSize: size * 0.36, letterSpacing: "-0.04em" }}
        >
          {shown}
        </div>
        <div className="text-[11px] font-extrabold tracking-[0.2em] text-muted mt-2">
          {label}
        </div>
        {caption && (
          <div className="text-[12px] font-semibold text-orange mt-1.5">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}

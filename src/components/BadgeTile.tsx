"use client";

import { useState } from "react";
import { TIER_STYLE } from "@/lib/tier-style";
import type { BadgeTier } from "@/lib/badges";
import { iconFor } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { useD } from "@/components/LocaleProvider";
import { Card, Meter } from "@/components/ui";

/**
 * One badge on the shelf, and the sheet that opens when it is pressed.
 *
 * A tile has room for four facts; what it cannot say is where the badge
 * actually stands — how far along the bar is, what exactly is still missing,
 * when it was won. That lives in the sheet, so the shelf stays scannable and
 * the detail is one tap away instead of nowhere (decided 2026-08-28).
 *
 * Everything arrives as plain strings, already labelled and localised by the
 * server page: this component decides only what a press shows.
 */
export type BadgeTileProps = {
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  /** 0..1, already capped below 1 for unearned badges by lib/badges. */
  progress: number;
  label: string;
  tierText: string;
  requirement: string;
  /** Formatted date, or null when unearned (or the date is unknown). */
  earnedDate: string | null;
  progressText: string;
};

export function BadgeTile(props: BadgeTileProps) {
  const d = useD();
  const [open, setOpen] = useState(false);
  const style = TIER_STYLE[props.tier];
  const { earned } = props;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left active:scale-[0.97] transition-transform"
        aria-haspopup="dialog"
      >
        <Card
          padded={false}
          className="flex h-full flex-col items-center p-2.5 text-center"
          style={
            earned
              ? { borderColor: style.ring, background: "#FFFDF9" }
              : { opacity: 0.62 }
          }
        >
          {/* Same glyph at every tier — only the metal climbs. */}
          <span
            className={`grid h-10 w-10 place-items-center rounded-full ${
              earned ? style.grad : "bg-cream border border-line"
            }`}
          >
            <IconGlyph
              def={iconFor(props.icon)}
              size={19}
              color={earned ? "#fff" : "#B5A99F"}
              strokeWidth={earned ? 2 : 1.8}
            />
          </span>

          <p
            className={`mt-1.5 text-[11.5px] font-extrabold leading-[1.15] ${
              earned ? "" : "text-muted"
            }`}
          >
            {props.label}
          </p>
          <p
            className="text-[9.5px] font-bold leading-tight mt-0.5"
            style={{ color: style.ink }}
          >
            {props.tierText}
          </p>

          {earned ? (
            <p className="mt-1 text-[9.5px] font-bold text-muted tabular-nums">
              {props.earnedDate ?? "—"}
            </p>
          ) : (
            <div className="mt-1.5 w-full">
              <Meter value={props.progress * 100} />
              <p className="mt-1 text-[9.5px] font-bold text-muted tabular-nums">
                {props.progressText}
              </p>
            </div>
          )}
        </Card>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6"
          role="dialog"
          aria-label={props.label}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[330px] rounded-[26px] bg-warmwhite p-6 text-center"
            style={{ boxShadow: "0 24px 64px rgba(40,24,12,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
                earned ? style.grad : "bg-cream border border-line"
              }`}
            >
              <IconGlyph
                def={iconFor(props.icon)}
                size={28}
                color={earned ? "#fff" : "#B5A99F"}
                strokeWidth={2}
              />
            </span>

            <p className="mt-3 text-[17px] font-extrabold leading-tight">
              {props.label}
            </p>
            <p
              className="mt-0.5 text-[11px] font-bold tracking-[0.14em] uppercase"
              style={{ color: style.ink }}
            >
              {props.tierText}
            </p>

            <div className="mt-4 rounded-[18px] bg-cream p-3.5 text-left">
              <p className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-muted">
                {d.badgesPage.detailHow}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink/85">
                {props.requirement}
              </p>
            </div>

            <div className="mt-3 rounded-[18px] bg-cream p-3.5 text-left">
              <p className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-muted">
                {earned ? d.badgesPage.detailEarned : d.badgesPage.detailProgress}
              </p>
              {earned ? (
                <>
                  <div className="mt-2">
                    <Meter value={100} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] font-bold" style={{ color: style.ink }}>
                    {props.earnedDate
                      ? `${d.badgesPage.detailEarned} · ${props.earnedDate}`
                      : d.badgesPage.detailEarned}
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-2">
                    <Meter value={props.progress * 100} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] font-bold text-muted tabular-nums">
                    {props.progressText}
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 h-11 w-full rounded-full bg-white border border-line font-bold text-[13px] text-muted"
            >
              {d.common.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

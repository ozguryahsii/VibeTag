import type { BadgeTier } from "@/lib/badges";

/**
 * How a tier looks, in one place.
 *
 * The badges page draws with CSS and the Vibe Card draws on a canvas, which
 * cannot read CSS variables. Two copies of these colours would drift, and the
 * one that drifts is always the one nobody is looking at — so both read from
 * here, and `globals.css` carries the same values for the gradient utilities.
 */
export const TIER_STYLE: Record<
  BadgeTier,
  {
    /** Tailwind utility declared in globals.css. */
    grad: string;
    /** Readable ink on cream, for labels and dates. */
    ink: string;
    /** Canvas needs literal colours: [from, to] of the same gradient. */
    canvas: [string, string];
    ring: string;
  }
> = {
  BRONZE: {
    grad: "grad-bronze",
    ink: "#a9642f",
    canvas: ["#D99A63", "#8D5227"],
    ring: "rgba(169,100,47,0.28)",
  },
  SILVER: {
    grad: "grad-silver",
    ink: "#8d867d",
    canvas: ["#D8D2C8", "#8D867D"],
    ring: "rgba(141,134,125,0.3)",
  },
  GOLD: {
    grad: "grad-gold",
    ink: "#b8801f",
    canvas: ["#F6D16A", "#C1842A"],
    ring: "rgba(184,128,31,0.3)",
  },
};

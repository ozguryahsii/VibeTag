/**
 * Line icons for Vibe Tags.
 *
 * One source of truth, drawn two ways: as <svg> in the app and as Path2D on
 * the Vibe Card canvas. Emoji were the quick option, but they carry someone
 * else's art direction into the middle of the brand card — these are thin,
 * warm, and consistent with the rest of the system.
 *
 * All geometry is authored in a 24×24 box, stroked (round cap/join).
 */

export type IconDef = {
  /** Stroked paths. */
  paths?: string[];
  /** Stroked circles: [cx, cy, r]. */
  circles?: [number, number, number][];
  /** Filled paths (used for dots and solid accents). */
  fills?: string[];
};

export const ICONS: Record<string, IconDef> = {
  bolt: { paths: ["M13.2 2.5 5 13.8h5.6L10 21.5l8.4-11.6h-5.7z"] },
  heart: {
    paths: [
      "M12 20.6c-4.7-2.7-8.5-5.8-8.5-9.6A4.6 4.6 0 0 1 12 8.1a4.6 4.6 0 0 1 8.5 2.9c0 3.8-3.8 6.9-8.5 9.6z",
    ],
  },
  shield: { paths: ["M12 2.6 20 6v5.6c0 4.9-3.3 8.3-8 9.8-4.7-1.5-8-4.9-8-9.8V6z"] },
  shieldCheck: {
    paths: [
      "M12 2.6 20 6v5.6c0 4.9-3.3 8.3-8 9.8-4.7-1.5-8-4.9-8-9.8V6z",
      "M8.7 12.1 11 14.4l4.4-4.6",
    ],
  },
  bulb: {
    paths: [
      "M12 3.2a5.8 5.8 0 0 0-3.4 10.5c.7.5 1.1 1.2 1.1 2v.6h4.6v-.6c0-.8.4-1.5 1.1-2A5.8 5.8 0 0 0 12 3.2z",
      "M9.9 18.6h4.2",
      "M10.6 20.9h2.8",
    ],
  },
  crown: { paths: ["M3.4 17.4 5.2 7.2l4.4 3.9L12 5.4l2.4 5.7 4.4-3.9 1.8 10.2z", "M5 20.4h14"] },
  target: { circles: [[12, 12, 8.6], [12, 12, 4.6]], fills: ["M12 10.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z"] },
  sparkle: {
    paths: [
      "M12 3.4c.9 4.1 1.6 4.8 5.7 5.7-4.1.9-4.8 1.6-5.7 5.7-.9-4.1-1.6-4.8-5.7-5.7 4.1-.9 4.8-1.6 5.7-5.7z",
      "M17.6 15.2c.4 1.9.8 2.3 2.7 2.7-1.9.4-2.3.8-2.7 2.7-.4-1.9-.8-2.3-2.7-2.7 1.9-.4 2.3-.8 2.7-2.7z",
    ],
  },
  smile: {
    circles: [[12, 12, 8.8]],
    paths: ["M8.4 14.2a4.4 4.4 0 0 0 7.2 0"],
    fills: [
      "M9.2 9.1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
      "M14.8 9.1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
    ],
  },
  clock: { circles: [[12, 12, 8.8]], paths: ["M12 7.2V12l3.2 1.9"] },
  message: {
    paths: [
      "M20.4 11.6a8.4 8.4 0 0 1-11.8 7.7L3.6 20.7l1.5-4.6A8.4 8.4 0 1 1 20.4 11.6z",
    ],
  },
  users: {
    circles: [[9.2, 8.6, 3.4]],
    paths: [
      "M3.2 19.8c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6",
      "M16 5.6a3.4 3.4 0 0 1 0 6.6",
      "M17.4 14.6c2.1.6 3.4 2.4 3.4 5.2",
    ],
  },
  briefcase: {
    paths: [
      "M3.6 8.6h16.8v10a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6z",
      "M9 8.6V6.4a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.4v2.2",
    ],
  },
  gift: {
    paths: [
      "M4.2 11.4h15.6v7.4a1.6 1.6 0 0 1-1.6 1.6H5.8a1.6 1.6 0 0 1-1.6-1.6z",
      "M3.4 7.8h17.2v3.6H3.4z",
      "M12 7.8v12.6",
      "M12 7.8C10.6 4.4 5.6 4.4 6.6 7.2c.5 1.3 3.2 1.6 5.4.6z",
    ],
  },
  wave: {
    paths: [
      "M2.8 10.4c2-2.4 4-2.4 6 0s4 2.4 6 0 4-2.4 6.4 0",
      "M2.8 16c2-2.4 4-2.4 6 0s4 2.4 6 0 4-2.4 6.4 0",
    ],
  },
  headphones: {
    paths: [
      "M4.2 14.4v-2.2a7.8 7.8 0 0 1 15.6 0v2.2",
      "M4.2 13.6h2.2a1.4 1.4 0 0 1 1.4 1.4v3.2a1.4 1.4 0 0 1-1.4 1.4H5.6a1.4 1.4 0 0 1-1.4-1.4z",
      "M19.8 13.6h-2.2a1.4 1.4 0 0 0-1.4 1.4v3.2a1.4 1.4 0 0 0 1.4 1.4h.8a1.4 1.4 0 0 0 1.4-1.4z",
    ],
  },
  heartHands: {
    paths: [
      "M12 13.6c-2.9-1.7-5-3.6-5-6a2.9 2.9 0 0 1 5-1.8 2.9 2.9 0 0 1 5 1.8c0 2.4-2.1 4.3-5 6z",
      "M3.6 20.8c1.8-2.2 4.6-3.4 8.4-3.4s6.6 1.2 8.4 3.4",
    ],
  },
  check: { circles: [[12, 12, 8.8]], paths: ["M8.3 12.2 11 14.9l5-5.4"] },
  scales: {
    paths: [
      "M12 4.2v15.6",
      "M6.4 7.4h11.2",
      "M6.4 7.4 3.4 13.6h6z",
      "M17.6 7.4l-3 6.2h6z",
      "M8 20.4h8",
    ],
  },
  leaf: {
    paths: [
      "M20.4 4.2C20.4 12.8 15.6 17.4 9 17.4a5.6 5.6 0 0 1 0-11.2c4 0 7.6-.6 11.4-2z",
      "M4.4 20.4C6.8 15 11.2 11.4 16.6 9.6",
    ],
  },

  /** The brand mark itself, in the same 24-box as everything else. */
  fingerprint: {
    paths: [
      // ridges wrap down the sides — without the vertical tails a stack of
      // bare semicircles reads as a wifi glyph, not a fingerprint
      "M2.6 17.4v-4.8a9.4 9.4 0 0 1 18.8 0v4.8",
      "M6 18.4v-5a6 6 0 0 1 12 0v5",
      "M9.4 19.2v-5.2a2.6 2.6 0 0 1 5.2 0v5.2",
      "M8.6 11.8 12 21.4l3.4-9.6",
    ],
  },
};

/** Which icon each Vibe Tag wears. */
export const TAG_ICON: Record<string, keyof typeof ICONS> = {
  positiveEnergy: "bolt",
  reliable: "check",
  kind: "heart",
  problemSolver: "bulb",
  leader: "crown",
  focused: "target",
  creative: "sparkle",
  supportive: "heartHands",
  funny: "smile",
  punctual: "clock",
  trustworthy: "shieldCheck",
  goodListener: "headphones",
  communicator: "message",
  teamPlayer: "users",
  inspiring: "sparkle",
  professional: "briefcase",
  generous: "gift",
  calm: "wave",
};

/** Traits get icons from the same set, so the app never mixes vocabularies. */
export const TRAIT_ICON: Record<string, keyof typeof ICONS> = {
  reliability: "check",
  communication: "message",
  kindness: "heart",
  helpfulness: "heartHands",
  professionalism: "briefcase",
  responsibility: "shieldCheck",
  teamwork: "users",
  problemSolving: "bulb",
  diligence: "target",
  leadership: "crown",
  punctuality: "clock",
  honesty: "shield",
  empathy: "heartHands",
  supportiveness: "gift",
  funToBeAround: "smile",
  creativity: "sparkle",
  workQuality: "sparkle",
  fairness: "scales",
  respect: "leaf",
  positivity: "bolt",
};

export function traitIconFor(traitKey: string): IconDef {
  return ICONS[TRAIT_ICON[traitKey] ?? "check"];
}

export function iconFor(tagKey: string): IconDef {
  return ICONS[TAG_ICON[tagKey] ?? "sparkle"];
}

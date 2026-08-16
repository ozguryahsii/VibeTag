/**
 * Comment moderation.
 *
 * A word list is a floor, not a solution: it misses context, sarcasm and
 * novel spellings, and it will occasionally flag something innocent. It sits
 * here to stop the obvious cases at the door — the real safety net is the
 * report button plus a human queue (see `Report` in the schema).
 */

const BLOCKED = [
  // tr
  "orospu",
  "piç",
  "yavşak",
  "amk",
  "amcık",
  "sikik",
  "sikeyim",
  "siktir",
  "gerizekalı",
  "salak",
  "aptal",
  "şerefsiz",
  "namussuz",
  "pezevenk",
  "ibne",
  "gavat",
  "oç",
  // en
  "fuck",
  "bitch",
  "asshole",
  "retard",
  "whore",
  "slut",
  "bastard",
];

/** Contact details do not belong in a public, anonymous note. */
const CONTACT = [
  /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/, // email
  /\b(?:\+?90[\s-]?)?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/, // TR mobile
];

/**
 * Fold the cheap evasions: repeats, leet digits, spacing — and Turkish
 * diacritics.
 *
 * The diacritic fold matters more than it looks. Turkish has two i's, and
 * typing the ASCII one is the single easiest way past a word list:
 * "gerizekali" is not "gerizekalı" to a string comparison, but it is to a
 * reader. Both the input and the word list go through this, so folding cannot
 * introduce a mismatch — only remove one.
 */
const TR_FOLD: Record<string, string> = {
  ı: "i",
  ş: "s",
  ğ: "g",
  ç: "c",
  ö: "o",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğçöüâîû]/g, (c) => TR_FOLD[c] ?? c)
    .replace(/[0@]/g, "o")
    .replace(/1|\||!/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5|\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

/**
 * The failure carries a reason key, not a sentence: the note is written by
 * one person and the warning is read by them in whatever language they have
 * the app set to, so the copy has to be resolved at render time.
 */
export type ModerationReason = "abusive" | "contact" | "link";

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: ModerationReason };

export function moderateComment(raw: string): ModerationResult {
  const text = raw.trim();
  if (!text) return { ok: true };

  const norm = normalize(text);
  const spaceless = norm.replace(/\s/g, "");

  for (const word of BLOCKED) {
    const w = normalize(word).replace(/\s/g, "");
    if (spaceless.includes(w)) {
      return { ok: false, reason: "abusive" };
    }
  }

  for (const re of CONTACT) {
    if (re.test(text)) {
      return { ok: false, reason: "contact" };
    }
  }

  if (/(https?:\/\/|www\.)/i.test(text)) {
    return { ok: false, reason: "link" };
  }

  return { ok: true };
}

/** Reason keys; the labels live in `d.report.reasons`. */
export const REPORT_REASONS = [
  "UNFAIR",
  "ABUSIVE",
  "HARASSMENT",
  "FAKE",
  "SPAM",
  "OTHER",
] as const;

/**
 * Reporting a rating and reporting a conversation are not the same complaint.
 * "Unfair" makes no sense about a DM, and "harassment" makes no sense about a
 * score, so each surface offers only what it can actually mean.
 */
export const RATING_REPORT_REASONS = [
  "UNFAIR",
  "ABUSIVE",
  "FAKE",
  "SPAM",
  "OTHER",
] as const;

export const THREAD_REPORT_REASONS = [
  "HARASSMENT",
  "ABUSIVE",
  "SPAM",
  "FAKE",
  "OTHER",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function isReportReason(v: unknown): v is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(v as string);
}

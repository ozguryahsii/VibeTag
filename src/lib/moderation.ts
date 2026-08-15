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

/** Fold the cheap evasions: repeats, leet digits, spacing. */
function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[0@]/g, "o")
    .replace(/1|\||!/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5|\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

export type ModerationResult =
  | { ok: true }
  | { ok: false; error: string };

export function moderateComment(raw: string): ModerationResult {
  const text = raw.trim();
  if (!text) return { ok: true };

  const norm = normalize(text);
  const spaceless = norm.replace(/\s/g, "");

  for (const word of BLOCKED) {
    const w = normalize(word).replace(/\s/g, "");
    if (spaceless.includes(w)) {
      return {
        ok: false,
        error:
          "Bu not hakaret içeriyor gibi görünüyor. Vibe Tag olumlu geri bildirim için — eleştirini kırıcı olmayan bir dille yazabilir misin?",
      };
    }
  }

  for (const re of CONTACT) {
    if (re.test(text)) {
      return {
        ok: false,
        error: "Notlarda telefon veya e-posta paylaşılamaz.",
      };
    }
  }

  if (/(https?:\/\/|www\.)/i.test(text)) {
    return { ok: false, error: "Notlarda bağlantı paylaşılamaz." };
  }

  return { ok: true };
}

export const REPORT_REASONS = [
  { key: "UNFAIR", label: "Haksız / gerçeği yansıtmıyor" },
  { key: "ABUSIVE", label: "Hakaret veya taciz içeriyor" },
  { key: "FAKE", label: "Sahte hesap ya da sahte değerlendirme" },
  { key: "SPAM", label: "Spam veya reklam" },
  { key: "OTHER", label: "Diğer" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

export function isReportReason(v: unknown): v is ReportReason {
  return REPORT_REASONS.some((r) => r.key === v);
}

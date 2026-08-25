import { describe, expect, it } from "vitest";
import {
  LEGAL_SLUGS,
  OPERATOR_ADDRESS,
  OPERATOR_NAME,
  VENUE_CITY,
  legalDoc,
} from "@/lib/legal";
import type { Locale } from "@/lib/i18n/config";

const LOCALES: Locale[] = ["tr", "en"];

/** Everything a document says, as one string, for a plain contains-check. */
function textOf(slug: (typeof LEGAL_SLUGS)[number], locale: Locale): string {
  const doc = legalDoc(slug, locale);
  return [
    doc.title,
    doc.intro,
    ...doc.sections.flatMap((s) => [s.heading, ...s.body, ...(s.list ?? [])]),
  ].join("\n");
}

const all = LOCALES.flatMap((locale) =>
  LEGAL_SLUGS.map((slug) => ({ slug, locale, text: textOf(slug, locale) })),
);

/**
 * KVKK art. 10 makes naming the controller and an address for notice a
 * condition of processing at all, and the terms are unenforceable against
 * a person they never identify a counterparty to. Neither failure shows up
 * on screen: a document with the operator silently missing from one of six
 * renderings looks exactly like a complete one.
 */
describe("the operator is identified everywhere it has to be", () => {
  it("names who runs the service, in both languages", () => {
    for (const { slug, locale, text } of all) {
      expect(text, `${slug}/${locale}`).toContain(OPERATOR_NAME);
    }
  });

  it("gives an address that can receive notice, in both languages", () => {
    for (const { slug, locale, text } of all) {
      expect(text, `${slug}/${locale}`).toContain(OPERATOR_ADDRESS);
    }
  });

  it("names the venue for non-consumer disputes in the terms", () => {
    for (const locale of LOCALES) {
      expect(textOf("terms", locale)).toContain(VENUE_CITY);
    }
  });

  /*
   * A consumer's own forum is not ours to move. If the venue clause ever
   * stops reserving it, the whole clause becomes void under Turkish consumer
   * law — and it would still read as a working sentence.
   */
  it("keeps a consumer's own forum reserved alongside it", () => {
    expect(textOf("terms", "tr")).toMatch(/tüketici mahkemesi|hakem heyeti/i);
    expect(textOf("terms", "en")).toMatch(/consumer (arbitration board|court)/i);
  });
});

/**
 * The unfilled blanks, tracked deliberately.
 *
 * Not a style rule — the page carries a standing "not yet in force" notice,
 * and this list is what that notice is about. A new bracket appearing
 * unnoticed would ship a placeholder as though it were an answer; a filled
 * one silently regressing to a bracket would do the same. Both are caught by
 * pinning the set exactly.
 */
const OPEN_PLACEHOLDERS = [
  "[AB/AEA TEMSİLCİSİ]",
  "[ABD BAŞVURULARI İÇİN ÜCRETSİZ TELEFON]",
  "[APPLICATION FORM LINK — IF ANY]",
  "[BAŞVURU FORMU BAĞLANTISI — VARSA]",
  "[EU/EEA REPRESENTATIVE]",
  "[KEP ADDRESS — IF ANY]",
  "[KEP ADRESİ — VARSA]",
  "[LIABILITY CAP FOR FREE USERS]",
  "[MERSİS NO — VARSA]",
  "[MERSİS NUMBER — IF ANY]",
  "[TOLL-FREE NUMBER FOR US REQUESTS]",
  "[VERBİS KAYDI — GEREKİYORSA]",
  "[VERBİS REGISTRATION — IF REQUIRED]",
  "[ÜCRETSİZ KULLANIM İÇİN SORUMLULUK TAVANI]",
];

describe("placeholders still waiting on a real answer", () => {
  it("is exactly the set we know about", () => {
    const found = new Set<string>();
    for (const { text } of all) {
      for (const m of text.matchAll(/\[[^\]]+\]/g)) found.add(m[0]);
    }
    expect([...found].sort()).toEqual([...OPEN_PLACEHOLDERS].sort());
  });

  it("no longer asks a sole trader for company-only facts", () => {
    for (const { slug, locale, text } of all) {
      expect(text, `${slug}/${locale}`).not.toMatch(
        /TÜZEL KİŞİ|LEGAL ENTITY|İŞLETME ADRESİ|BUSINESS ADDRESS/,
      );
    }
  });
});

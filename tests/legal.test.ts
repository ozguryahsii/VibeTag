import { describe, expect, it } from "vitest";
import {
  FREE_TIER_LIABILITY_CAP_EN,
  FREE_TIER_LIABILITY_CAP_TR,
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
  "[EU/EEA REPRESENTATIVE]",
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

/**
 * The liability cap is a ceiling on what Vibe Tag can owe, and the two ways
 * it fails are both invisible on screen.
 *
 * Written per account, it multiplies by however many accounts somebody cares
 * to register — a cap that anyone can raise is not a cap. Written as zero, it
 * is void under TBK art. 115 and as an unfair consumer term, and a void cap
 * leaves unlimited liability behind it. So the clause has to say a real
 * figure, and has to say the figure attaches to the person.
 */
describe("the liability cap for unpaid use", () => {
  it("states a figure rather than an unfilled promise", () => {
    expect(textOf("terms", "tr")).toContain(FREE_TIER_LIABILITY_CAP_TR);
    expect(textOf("terms", "en")).toContain(FREE_TIER_LIABILITY_CAP_EN);
  });

  it("refuses a zero cap in both languages", () => {
    expect(textOf("terms", "tr")).toContain("Sıfır tavan uygulanmaz");
    expect(textOf("terms", "en")).toContain("A zero cap is not applied");
  });

  it("attaches the cap to the person, not to the account", () => {
    const tr = textOf("terms", "tr");
    expect(tr).toContain("hesap başına değil kişi başınadır");
    // The point of the rule: a second account must not buy a second ceiling.
    expect(tr).toContain("birden fazla hesap açılmış olması tavanı çoğaltmaz");

    const en = textOf("terms", "en");
    expect(en).toContain("per person, not per account");
    expect(en).toContain("opening more than one account does not multiply it");
  });

  /*
   * The carve-outs are what keeps the cap enforceable at all; a cap that
   * also covered intent or a mandatory consumer right would be struck out
   * whole, taking the figure with it.
   */
  it("keeps the cap off intent, gross negligence and consumer rights", () => {
    expect(textOf("terms", "tr")).toMatch(/kasıt\/ağır ihmal/);
    expect(textOf("terms", "tr")).toMatch(/emredici tüketici hakk/);
    expect(textOf("terms", "en")).toMatch(/intent\/gross negligence/);
    expect(textOf("terms", "en")).toMatch(/mandatory consumer right/);
  });
});

/**
 * A controller with no MERSİS, KEP or VERBİS entry says so rather than
 * leaving the reader to wonder whether it was withheld. If a registration is
 * ever taken out, these assertions are the reminder that three documents
 * currently claim otherwise.
 */
describe("registrations a sole trader does not have", () => {
  it("says plainly that there are none", () => {
    expect(textOf("privacy", "tr")).toContain(
      "MERSİS ve VERBİS kaydı ile KEP adresi bulunmamaktadır",
    );
    expect(textOf("kvkk", "tr")).toContain("VERBİS kaydı bulunmamaktadır");
    expect(textOf("privacy", "en")).toContain(
      "no MERSİS or VERBİS registration",
    );
    expect(textOf("kvkk", "en")).toContain("no VERBİS registration");
  });
});

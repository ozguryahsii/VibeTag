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
 * Nothing is left blank.
 *
 * The texts went into force on 2026-08-25 with the standing draft notice
 * removed, so a bracket surviving anywhere now ships as though it were an
 * answer — to the one audience that reads these documents when something has
 * already gone wrong.
 */
describe("no unfilled blanks remain", () => {
  it("has no bracketed placeholder in any document", () => {
    for (const { slug, locale, text } of all) {
      expect(text.match(/\[[^\]]+\]/g), `${slug}/${locale}`).toBeNull();
    }
  });

  it("no longer asks a sole trader for company-only facts", () => {
    for (const { slug, locale, text } of all) {
      expect(text, `${slug}/${locale}`).not.toMatch(
        /TÜZEL KİŞİ|LEGAL ENTITY|İŞLETME ADRESİ|BUSINESS ADDRESS/,
      );
    }
  });

  /*
   * No GDPR art. 27 representative has been appointed. Naming one anyway
   * would be a false statement made to precisely the people the policy is
   * for, and it would read as complete — which is why it is asserted rather
   * than left to a careful reading. If one is ever appointed, this test is
   * where the claim becomes allowed again.
   */
  it("claims no EU/EEA representative, and routes those requests to the mailbox", () => {
    expect(textOf("privacy", "tr")).not.toMatch(/m\.\s?27|temsilcisi:/);
    expect(textOf("privacy", "tr")).toContain(
      "AB/AEA'da yerleşik kullanıcılar dâhil tüm veri sahibi talepleri doğrudan {email} adresinden karşılanır",
    );
    expect(textOf("privacy", "en")).not.toMatch(/Art\.\s?27|representative:/);
    expect(textOf("privacy", "en")).toContain(
      "including those from users in the EU/EEA, are handled directly at {email}",
    );
  });
});

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

/**
 * Child safety (CSAE).
 *
 * Google Play will not publish a social app without a public page setting
 * out its standards against child sexual abuse and exploitation, and the
 * page has to keep saying the things the policy requires — an edit that
 * quietly drops the reporting route or the 18+ line would be a policy
 * violation nobody would notice from the screen.
 */
describe("the child safety standards", () => {
  const docs = LOCALES.map((locale) => ({
    locale,
    text: textOf("child-safety", locale),
  }));

  it("is published in both languages", () => {
    expect(docs).toHaveLength(2);
    for (const { text } of docs) expect(text.length).toBeGreaterThan(500);
  });

  it("names CSAE and CSAM explicitly", () => {
    for (const { locale, text } of docs) {
      expect(text, locale).toContain("CSAE");
      expect(text, locale).toContain("CSAM");
    }
  });

  it("states the 18+ limit", () => {
    for (const { text } of docs) expect(text).toMatch(/18/);
  });

  it("keeps a way to report, in the app and by email", () => {
    for (const { locale, text } of docs) {
      // {email} is substituted at render time; what matters here is that the
      // route survives an edit.
      expect(text, locale).toContain("{email}");
      expect(text.toLowerCase(), locale).toMatch(/bildir|report/);
    }
  });

  it("commits to reporting to the authorities", () => {
    for (const { locale, text } of docs) {
      expect(text, locale).toContain("NCMEC");
      expect(text.toLowerCase(), locale).toMatch(/maka|authorit/);
    }
  });
});

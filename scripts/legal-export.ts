/**
 * Print the three legal texts, in both languages, as JSON or Markdown.
 *
 * Read from `lib/legal.ts` — the same object the app renders — so what
 * counsel marks up is word for word what a user sees. Copying the texts into
 * a document by hand is how the reviewed version and the shipped version stop
 * being the same document.
 *
 *   npm run legal --silent            > docs/legal.md
 *   npm run legal --silent -- --json  > legal.json
 */
import { LEGAL_SLUGS, legalDoc } from "../src/lib/legal";
import { SUPPORT_EMAIL } from "../src/lib/support";
import type { Locale } from "../src/lib/i18n/config";

const LOCALES: Locale[] = ["tr", "en"];

const LOCALE_NAME: Record<Locale, string> = {
  tr: "Türkçe",
  en: "İngilizce (uygulamanın İngilizce dilindeki hâli)",
};

/** The app substitutes the support address at render time; so must this. */
const withEmail = (s: string) => s.replaceAll("{email}", SUPPORT_EMAIL);

const docs = LOCALES.flatMap((locale) =>
  LEGAL_SLUGS.map((slug) => {
    const doc = legalDoc(slug, locale);
    return {
      locale,
      slug,
      title: doc.title,
      updated: doc.updated,
      intro: withEmail(doc.intro),
      sections: doc.sections.map((s) => ({
        heading: s.heading,
        body: s.body.map(withEmail),
        list: (s.list ?? []).map(withEmail),
      })),
    };
  }),
);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ supportEmail: SUPPORT_EMAIL, docs }, null, 2));
  process.exit(0);
}

const out: string[] = [];
const w = (s = "") => out.push(s);

w("# Vibe Tag — hukuki metinler");
w();
w("Bu dosya elle yazılmadı: `npm run legal --silent > docs/legal.md` komutu");
w("uygulamanın gösterdiği metinlerin ta kendisini `src/lib/legal.ts`'ten üretir.");
w("Ekranda ne yazıyorsa burada da o yazıyor.");
w();
w(`Son güncelleme: **${docs[0].updated}** · İletişim adresi: **${SUPPORT_EMAIL}**`);
w();
w("## Durum");
w();
w(
  "- Metinler **2026-08-24 tarihinde avukat tarafından incelendi ve revize edildi.** " +
    "Bu dosya o revizyonun ta kendisidir. Henüz yürürlükte değil: köşeli parantezli " +
    "alanlar (şirket unvanı, adres, MERSİS/VERBİS, ilgili e-postalar, yetkili mahkeme, " +
    "ücretsiz kullanıcı sorumluluk tavanı) gerçek bilgilerle doldurulmadan yayımlanmaz. " +
    "Uygulamada da bunu söyleyen kalıcı bir uyarı var.",
);
w(
  "- **Tüzel kişi bilgileri eksik.** Veri sorumlusu olarak yalnızca " +
    "«[TÜZEL KİŞİ / İŞLETME UNVANI]» yazıyor; ticari unvan, adres, MERSİS ve VERBİS " +
    "durumu doldurulacak. Metinde bunu belirten köşeli parantezler var.",
);
w(
  "- **Yayın öncesi doldurulacak diğer alanlar:** ilgili e-postalar (gizlilik, " +
    "içerik bildirimleri, güvenlik, KVKK, itiraz, ABD talepleri, AB/AEA temsilcisi " +
    "— tek adres mi yoksa ayrı ayrı mı olacağına karar verilecek), tüketici " +
    "olmayanlar için yetkili mahkeme şehri, ücretsiz kullanıcılar için sorumluluk " +
    "tavanı tutarı, ve varsa KEP/posta adresi.",
);
w();
w("---");
w();

for (const locale of LOCALES) {
  w(`# ${LOCALE_NAME[locale]}`);
  w();
  for (const doc of docs.filter((x) => x.locale === locale)) {
    w(`## ${doc.title}`);
    w();
    w(`*Yürürlük: ${doc.updated} · Adres: /legal/${doc.slug}*`);
    w();
    w(doc.intro);
    w();
    for (const s of doc.sections) {
      w(`### ${s.heading}`);
      w();
      for (const p of s.body) {
        w(p);
        w();
      }
      for (const item of s.list) {
        w(`- ${item}`);
      }
      if (s.list.length) w();
    }
    w("---");
    w();
  }
}

console.log(out.join("\n"));

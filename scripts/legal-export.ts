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
w("## Avukatın bilmesi gereken notlar");
w();
w(
  "- Metinler **hukukçu tarafından hazırlanmadı.** Uygulamanın ne yaptığı doğru " +
    "anlatılıyor — her cümle koddaki bir tabloya veya kontrole dayanıyor — ama " +
    "hukuki denetimden geçmedi. Uygulamada da bunu söyleyen kalıcı bir uyarı var.",
);
w(
  "- **Tüzel kişi bilgileri eksik.** KVKK metninde veri sorumlusu olarak yalnızca " +
    "«Vibe Tag» yazıyor; ticari unvan, adres, MERSİS ve VERBİS kaydı yayına " +
    "çıkmadan önce eklenecek. Metinde bunu belirten bir parantez var.",
);
w(
  "- **Sorumluluk sınırlaması bilinçli olarak yumuşak yazıldı** («emredici " +
    "hukukun izin verdiği ölçüde»). Tüketici ve veri koruma yükümlülükleri " +
    "sözleşmeyle kaldırılamıyor; bunu görmezden gelen bir madde ilk elenen madde " +
    "olur ve metnin geri kalanının inandırıcılığını da götürür. Daha sert bir " +
    "ifade tercih edilecekse sınırın nerede olduğunu avukat söylemeli.",
);
w(
  "- **Anonimlik bir vaat değil, ürünün kuralı.** Değerlendirmeler arayüzde " +
    "hiçbir zaman kişiye bağlanmıyor, ama veritabanında kimin kimi " +
    "değerlendirdiği kayıtlı — sahtecilik tespiti, itiraz ve kötüye kullanım " +
    "incelemesi için. Gold üyelik kendisini değerlendirenleri gösteriyor. Bu " +
    "ayrımın metinde doğru kurulduğu ayrıca kontrol edilmeli.",
);
w(
  "- **Ödeme bilgisi hiç bize ulaşmıyor.** Satın alma App Store ve Google Play " +
    "üzerinden yapılıyor; bize sadece aboneliğin durumu geliyor. Cayma hakkı ve " +
    "iade akışının mağaza kurallarıyla çelişmediği kontrol edilmeli.",
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

/**
 * Build the legal texts as a .docx for counsel to mark up.
 *
 * Plain, printable, and deliberately dull: a lawyer works with Track Changes
 * and margin comments, so the page has wide margins, numbered headings and no
 * design to fight with. Both languages, one file.
 *
 *   npm run legal --silent -- --json > /tmp/legal.json
 *   npm i --no-save docx
 *   node scripts/legal-docx.cjs /tmp/legal.json vibetag-hukuki-metinler.docx
 *
 * `docx` is deliberately not a dependency: this runs once per review round,
 * and the Docker build installs devDependencies too.
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, PageNumber, Header, Footer, LevelFormat, convertInchesToTwip,
} = require("docx");

const [, , IN = "legal.json", OUT = "vibetag-hukuki-metinler.docx"] = process.argv;
const { supportEmail, docs } = JSON.parse(fs.readFileSync(IN, "utf8"));

const INK = "1A1A1A";
const MUTED = "5F5F5F";
const ACCENT = "9E2A2B";

const SERIF = "Cambria";
const SANS = "Calibri";

function run(text, o = {}) {
  return new TextRun({
    text: String(text ?? ""),
    font: o.mono ? "Consolas" : o.sans ? SANS : SERIF,
    size: o.size ?? 22, // 11pt
    bold: o.bold ?? false,
    italics: o.italic ?? false,
    color: o.color ?? INK,
  });
}

function p(text, o = {}) {
  return new Paragraph({
    alignment: o.align,
    spacing: { before: o.before ?? 0, after: o.after ?? 160, line: 276 },
    indent: o.indent,
    numbering: o.numbering,
    border: o.border,
    children: Array.isArray(text) ? text : [run(text, o)],
  });
}

const kids = [];
const push = (...x) => kids.push(...x);

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 0, after: 240 },
    children: [new TextRun({ text, font: SANS, size: 34, bold: true, color: ACCENT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 140 },
    children: [new TextRun({ text, font: SANS, size: 28, bold: true, color: INK })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: SANS, size: 24, bold: true, color: INK })],
  });
}

const rule = {
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9C9C9", space: 8 },
};

// ------------------------------------------------------------------ cover
push(
  new Paragraph({
    spacing: { before: 600, after: 80 },
    children: [
      new TextRun({
        text: "VIBE TAG",
        font: SANS, size: 20, bold: true, color: ACCENT,
        characterSpacing: 60,
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "Hukuki metinler — inceleme kopyası", font: SANS, size: 48, bold: true, color: INK }),
    ],
  }),
  p(
    "Gizlilik Politikası, KVKK Aydınlatma Metni ve Kullanım Şartları. " +
      "Uygulamada yayında olan metinlerin birebir aynısı; bu dosya elle yazılmadı, " +
      "uygulamanın kaynağından üretildi.",
    { size: 24, color: MUTED, after: 120 },
  ),
  p(
    `Yürürlük tarihi: ${docs[0].updated}  ·  İletişim: ${supportEmail}  ·  https://vibetag.net`,
    { size: 20, color: MUTED, after: 320, border: rule },
  ),
);

push(h2("Sayın Avukatım, bu metinlerin durumu"));
push(
  p(
    "Metinleri hukukçu hazırlamadı. Uygulamanın ne yaptığı doğru anlatılıyor — " +
      "her cümlenin arkasında koddaki bir tablo ya da bir kontrol var — ama hukuki " +
      "denetimden geçmedi. Uygulamada da bunu söyleyen kalıcı bir uyarı duruyor ve " +
      "siz onaylayana kadar orada kalacak.",
  ),
  p(
    "Aşağıdaki başlıklar özellikle dikkatinizi rica ettiğimiz yerler. " +
      "Değişikliklerinizi doğrudan bu dosyaya, «Değişiklikleri İzle» açıkken " +
      "yazabilirsiniz; olduğu gibi geri gönderin, uygulamaya biz işleriz.",
    { after: 240 },
  ),
);

const FLAGS = [
  [
    "Tüzel kişi bilgileri eksik",
    "KVKK metninde veri sorumlusu olarak yalnızca «Vibe Tag» yazıyor. Ticari unvan, " +
      "adres, MERSİS numarası ve VERBİS kaydı yayına çıkmadan önce eklenecek; metinde " +
      "bunu belirten bir parantez var. Hangi bilgilerin zorunlu olduğunu ve VERBİS " +
      "kaydının bu ölçekte gerekip gerekmediğini sizden öğrenmek istiyoruz.",
  ],
  [
    "Sorumluluk sınırlaması bilinçli olarak yumuşak",
    "İlgili maddeler «emredici hukukun izin verdiği ölçüde» kaydıyla yazıldı. " +
      "Tüketici ve veri koruma yükümlülükleri sözleşmeyle kaldırılamadığı için, bunu " +
      "yok sayan bir madde ilk elenen madde olur ve metnin geri kalanının " +
      "inandırıcılığını da götürür. Sınırın nerede olduğunu ve daha korumacı bir " +
      "ifadenin mümkün olup olmadığını belirtmenizi rica ediyoruz.",
  ],
  [
    "Anonimlik: bir vaat değil, ürünün kuralı",
    "Değerlendirmeler arayüzde hiçbir zaman kişiye bağlanarak gösterilmiyor. Ancak " +
      "veritabanında kimin kimi değerlendirdiği kayıtlı — sahtecilik tespiti, itiraz " +
      "hakkı ve kötüye kullanım incelemesi bunu gerektiriyor. Ayrıca Gold üyelik, " +
      "kişiye kendisini değerlendirenleri gösteriyor. Bu üç katmanın metinde doğru ve " +
      "yanıltmayacak biçimde kurulduğunu kontrol etmenizi istiyoruz.",
  ],
  [
    "Kişisel veri, üçüncü kişi tarafından giriliyor",
    "Bir kullanıcı hakkındaki değerlendirmeyi başka bir kullanıcı yazıyor. Yani " +
      "kişisel veriyi ilgili kişinin kendisi değil, bir başkası üretiyor. Bunun KVKK " +
      "açısından hukuki sebebinin doğru gösterilip gösterilmediği ve ilgili kişinin " +
      "itiraz/silme haklarının nasıl işletilmesi gerektiği kritik başlığımız.",
  ],
  [
    "Ödeme bilgisi bize hiç ulaşmıyor",
    "Satın alma App Store ve Google Play üzerinden yapılıyor; bize yalnızca " +
      "aboneliğin durumu geliyor. Kart bilgisi hiçbir aşamada sunucumuza gelmiyor. " +
      "Cayma hakkı, iade ve abonelik iptali anlatımının mağaza kurallarıyla ve " +
      "Mesafeli Sözleşmeler Yönetmeliği ile çelişmediğini kontrol etmenizi rica ederiz.",
  ],
  [
    "Yaş sınırı ve çocukların verisi",
    "Uygulama 13 yaş ve üzeri için konumlandırılıyor. Türkiye'de veli onayı " +
      "gerektiren yaş eşiği ve bunun uygulamada nasıl karşılanacağı konusunda " +
      "yönlendirmenize ihtiyacımız var.",
  ],
  [
    "Yurt dışına aktarım",
    "E-posta iletimi (Resend) ve trafik altyapısı (Cloudflare) için sunucular yurt " +
      "dışında olabiliyor. Aktarımın hangi mekanizmayla (açık rıza, taahhütname, " +
      "standart sözleşme) meşrulaştırılması gerektiğini belirtmenizi rica ederiz.",
  ],
];

FLAGS.forEach(([title, body], i) => {
  push(
    p([run(`${i + 1}. ${title}`, { bold: true, sans: true, size: 23 })], {
      before: 200, after: 60,
    }),
    p(body, { indent: { left: convertInchesToTwip(0.25) }, after: 140 }),
  );
});

// ------------------------------------------------------------------ texts
const LOCALE_TITLE = {
  tr: "Türkçe metinler — yayında olan hâli",
  en: "İngilizce metinler — uygulamanın İngilizce dilindeki hâli",
};

for (const locale of ["tr", "en"]) {
  const mine = docs.filter((x) => x.locale === locale);
  push(h1(LOCALE_TITLE[locale]));
  if (locale === "en") {
    push(
      p(
        "Uygulama iki dilli. Aşağıdakiler Türkçe metinlerin karşılığı olarak " +
          "yazıldı; İngilizce kullanan üyeler bu metni görüyor. Türkçe metinde " +
          "yapacağınız değişikliklerin buraya da yansıtılması gerekiyor — çeviriyi " +
          "biz yaparız, siz yalnızca Türkçe üzerinde çalışmanız yeterli.",
        { color: MUTED, after: 240 },
      ),
    );
  }

  for (const doc of mine) {
    push(h2(doc.title));
    push(
      p(`Yürürlük: ${doc.updated}  ·  Uygulamadaki adresi: /legal/${doc.slug}`, {
        size: 19, color: MUTED, after: 200, border: rule,
      }),
    );
    push(p(doc.intro, { after: 200 }));

    for (const s of doc.sections) {
      push(h3(s.heading));
      for (const body of s.body) push(p(body));
      for (const item of s.list) {
        push(
          p(`•  ${item}`, {
            indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.18) },
            after: 100,
          }),
        );
      }
    }
  }
}

// ------------------------------------------------------------------ doc
const doc = new Document({
  creator: "Vibe Tag",
  title: "Vibe Tag — Hukuki metinler (inceleme kopyası)",
  description: "Gizlilik Politikası, KVKK Aydınlatma Metni ve Kullanım Şartları",
  styles: { default: { document: { run: { font: SERIF, size: 22, color: INK } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 portrait
          // Wide right margin: this is a document to write in the margin of.
          margin: { top: 1134, bottom: 1134, left: 1134, right: 1985 },
        },
      },
      headers: {
        default: new Header({
          children: [
            p(
              [run("Vibe Tag — hukuki metinler, inceleme kopyası", { size: 17, color: MUTED, sans: true })],
              { after: 0, border: rule },
            ),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "", font: SANS, size: 17, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 17, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children: kids,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("written", OUT, buf.length, "bytes");
});

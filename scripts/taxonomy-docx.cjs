/**
 * Build the editable taxonomy workbook (.docx) from the taxonomy JSON.
 *
 * Everything is a real Word table so it can be typed into, have rows added,
 * and be sent back. Each table carries an empty "Notun" column and, where new
 * entries make sense, blank rows ready to fill.
 *
 *   npm run taxonomy --silent -- --json > /tmp/taxonomy.json
 *   npm i --no-save docx
 *   node scripts/taxonomy-docx.cjs /tmp/taxonomy.json vibetag-taksonomi.docx
 *
 * `docx` is deliberately not a dependency: this runs once per review round on
 * a laptop, and the Docker build installs devDependencies too.
 */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageOrientation, TableLayoutType, VerticalAlign,
} = require("docx");

const [, , IN = "taxonomy.json", OUT = "vibetag-taksonomi.docx"] = process.argv;
const d = JSON.parse(fs.readFileSync(IN, "utf8"));

const REL = Object.fromEntries(d.relationships.map((r) => [r.key, r]));
const TAG = Object.fromEntries(d.tags.map((t) => [t.key, t]));
const GLABEL = Object.fromEntries(d.groups.map((g) => [g.key, g.label]));

const METRIC = {
  "trait:reliability": "Güvenilirlik puanı",
  "trait:positivity": "Pozitif enerji puanı",
  "trait:teamwork": "Takım çalışması puanı",
  "trait:kindness": "Kibarlık puanı",
  "trait:honesty": "Dürüstlük puanı",
  "trait:problemSolving": "Problem çözme puanı",
  "trait:empathy": "Empati puanı",
  "count:ratings": "Değerlendirme sayısı",
  "count:score": "Vibe Score",
  "count:workRatings": "Profesyonel çevreden değerlendirme sayısı",
  "count:circles": "Farklı çevre sayısı",
  "count:energyTag": "«Positive Energy» etiketi veren kişi sayısı",
};

// ---------------------------------------------------------------- palette
const INK = "2D211C";
const CORAL = "C2323F";
const MUTED = "7A6C62";
const HEADFILL = "F1E7D8";
const NOTEFILL = "FCFAF6";
const LINE = "D9CBBA";

// A4 landscape, 1.4 cm side margins.
const PAGE_W = 16838;
const MARGIN = 794;
const USABLE = PAGE_W - MARGIN * 2; // 15250

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border };

function txt(text, o = {}) {
  return new TextRun({
    text: String(text ?? ""),
    font: o.mono ? "Consolas" : "Calibri",
    size: o.size ?? 19, // half-points → 9.5pt
    bold: o.bold ?? false,
    italics: o.italic ?? false,
    color: o.color ?? INK,
  });
}

function para(text, o = {}) {
  return new Paragraph({
    alignment: o.align,
    spacing: { before: o.before ?? 0, after: o.after ?? 0 },
    children: Array.isArray(text) ? text : [txt(text, o)],
  });
}

function cell(children, o = {}) {
  return new TableCell({
    width: { size: o.width, type: WidthType.DXA },
    shading: o.fill
      ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill }
      : undefined,
    margins: { top: 70, bottom: 70, left: 108, right: 108 },
    verticalAlign: VerticalAlign.TOP,
    columnSpan: o.span,
    children: Array.isArray(children) ? children : [children],
  });
}

/** A table from a header list and rows of plain strings (or paragraph arrays). */
function table(headers, widths, rows, o = {}) {
  const head = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(
        para(h, { bold: true, size: 17, color: MUTED }),
        { width: widths[i], fill: HEADFILL },
      ),
    ),
  });
  const body = rows.map(
    (r) =>
      new TableRow({
        cantSplit: true,
        children: r.map((c, i) =>
          cell(
            typeof c === "string" || typeof c === "number"
              ? para(c, { size: o.size ?? 19 })
              : c,
            { width: widths[i], fill: o.noteCol === i ? NOTEFILL : undefined },
          ),
        ),
      }),
  );
  return new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders,
    rows: [head, ...body],
  });
}

/** n empty rows, so a new entry can just be typed in. */
function blanks(n, widths, noteCol) {
  return Array.from({ length: n }, () => widths.map(() => ""));
}

const kids = [];
const push = (...x) => kids.push(...x);
const gap = (h = 160) => new Paragraph({ spacing: { after: h }, children: [] });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 150 },
    children: [new TextRun({ text, font: "Calibri", size: 32, bold: true, color: CORAL })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 110 },
    children: [new TextRun({ text, font: "Calibri", size: 25, bold: true, color: INK })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 90 },
    children: [new TextRun({ text, font: "Calibri", size: 21, bold: true, color: INK })],
  });
}
function note(text) {
  return para(text, { size: 18, color: MUTED, after: 130 });
}

// ---------------------------------------------------------------- cover
push(
  new Paragraph({
    spacing: { before: 300, after: 60 },
    children: [
      new TextRun({
        text: "VIBE TAG · ÇALIŞMA KOPYASI",
        font: "Consolas", size: 17, bold: true, color: CORAL,
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 140 },
    children: [
      new TextRun({
        text: "Değerlendirme taksonomisi ve rozet tablosu",
        font: "Calibri", size: 48, bold: true, color: INK,
      }),
    ],
  }),
  para(
    "Uygulamanın bugün sorduğu her soru, verilebilen her etiket ve kazanılabilen her rozet. " +
      "Bu dosya elle yazılmadı — kodun çalıştığı modüllerden üretildi, o yüzden ekranda ne varsa burada da o var.",
    { size: 21, color: MUTED, after: 220 },
  ),
);

push(
  table(
    ["Bu dosya nasıl kullanılır"],
    [USABLE],
    [
      [[
        para("Her tablonun en sağında boş bir «Notun» sütunu var — değişmesini istediğin şeyi doğrudan oraya yaz.", { size: 19, after: 70 }),
        para("Satır eklemek için son satırın sonuna gelip Tab'a bas; Word yeni satır açar. Silmek istediğin satırı olduğu gibi sil.", { size: 19, after: 70 }),
        para("En sondaki «Eklemek istediklerim» bölümünde yeni tanışıklık, yeni kriter, yeni etiket ve yeni rozet için hazır boş tablolar var.", { size: 19, after: 70 }),
        para("Bitince dosyayı olduğu gibi geri gönder; farkları uygulamaya işlerim.", { size: 19 }),
      ]],
    ],
  ),
  para(
    [
      txt("Bu çıktı ", { size: 17, color: MUTED }),
      txt("v2.10", { size: 17, color: MUTED, mono: true, bold: true }),
      txt(" sürümünden üretildi · npm run taxonomy", { size: 17, color: MUTED }),
    ],
    { before: 130 },
  ),
  gap(240),
);

// ---------------------------------------------------------------- rules
push(h1("1 · Kurallar"));
push(note("Bir değerlendirmenin sınırları. Hepsi tek tek değiştirilebilir sayılar — hiçbiri koda gömülü değil."));
{
  const wds = [4200, 3400, USABLE - 7600];
  push(
    table(
      ["Ayar", "Bugünkü değer", "Notun"],
      wds,
      [
        ["Kriter puanı ölçeği", "1 – 5", ""],
        ["Bir değerlendirmede etiket", `en az ${d.limits.minTags}, en fazla ${d.limits.maxTags}`, ""],
        ["Değerlendirme güncelleme aralığı", `${d.limits.cooldownDays} gün`, ""],
        ["Çevre sayısı", String(d.groups.length), ""],
        ["Tanışıklık seçeneği", String(d.relationships.length), ""],
        ["Kriter havuzu", String(d.traits.length), ""],
        ["Etiket havuzu", String(d.tags.length), ""],
        ["Rozet", `${d.badges.length} aile × 3 kademe = ${d.badges.length * 3}`, ""],
        ["Nötr başlangıç puanı", "78 (4 değerlendirme ağırlığında)", ""],
      ],
      { noteCol: 2 },
    ),
  );
}

// ---------------------------------------------------------------- flow
push(h1("2 · Cevaplar nereye işliyor?"));
push(note("Değerlendiren kişi dört şey bırakır. Her biri farklı bir yere gider."));
{
  const wds = [2600, USABLE - 2600 - 4200, 4200];
  push(
    table(
      ["Girdi", "Etkilediği yer", "Notun"],
      wds,
      [
        [
          "Tanışıklık seçimi",
          "Hangi kriterlerin sorulacağını ve hangi etiketlerin verilebileceğini belirler (bağlam kilidi). Profildeki «Nereden tanınıyor?» dağılımını ve çevre bazlı puanı besler.",
          "",
        ],
        [
          "Kriter puanları (1–5)",
          "0–100'e çevrilir. Ağırlıklı ortalaması Vibe Score'u oluşturur; her kriter ayrıca kendi «Güçlü yönler» çubuğunu ve gelişim alanlarını besler. Rozetlerin çoğu doğrudan buraya bakar.",
          "",
        ],
        [
          "Etiketler",
          "Sayılır. Profil kartındaki ve Vibe Card'daki en çok oy alan 5 etiketi belirler. «İyi Enerji» rozeti, Positive Energy etiketinin kaç kişiden geldiğini de kabul eder.",
          "",
        ],
        [
          "Not (yorum)",
          "Puana hiç etki etmez. Profilde anonim not olarak görünür — hiçbir yerde kime ait olduğu yazılmaz.",
          "",
        ],
      ],
      { noteCol: 2 },
    ),
  );
}

push(h2("Vibe Score formülü"));
push(
  new Paragraph({
    spacing: { after: 60 },
    children: [txt("her cevap (1..5)  →  (cevap − 1) / 4 × 100          # 0..100", { mono: true, size: 18 })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [txt("ham skor          =  ağırlıklı ortalama              # ağırlık = güven ağırlığı", { mono: true, size: 18 })],
  }),
  new Paragraph({
    spacing: { after: 130 },
    children: [txt("Vibe Score        =  (ham skor × Σağırlık + 78 × 4) / (Σağırlık + 4)", { mono: true, size: 18, bold: true })],
  }),
  note(
    "Baştaki 78 × 4, az veriyle uç sonuç çıkmasını engelleyen nötr başlangıçtır: üç kişinin oyladığı bir profil 100 göstermez. " +
      "Kriter puanlarında da aynı mantık 3 birim güçle uygulanır. Sahtecilik korumasına takılan değerlendirmeler ağırlık = 0 alır: silinmez, ama skora hiç girmez.",
  ),
);
{
  const wds = [3000, USABLE - 3000];
  push(table(["Formül hakkında notun", ""], wds, [["", ""]], { noteCol: 1 }));
}

// ---------------------------------------------------------------- circles
push(h1("3 · Tanışıklık kategorileri"));
push(
  note(
    "Her şey tek bir zorunlu cevaptan akar: «Bu kişiyi nereden tanıyorsun?». " +
      "Pazardan alışveriş yaptığın kasiyer kibarlıktan puan alır, liderlikten asla. " +
      "Her tanışıklığın altındaki tabloda o tanışıklıkta sorulan sorular var; sonundaki boş satırlara yeni soru yazabilirsin.",
  ),
);

for (const g of d.groups) {
  const rels = g.relationships.map((k) => REL[k]);
  push(h2(`${g.emoji} ${g.label} — ${g.key}`));
  push(note(`${g.blurb}. ${rels.length} tanışıklık, ${g.tags.length} etiket.`));
  push(
    para(
      [
        txt("Bu çevrede verilebilen etiketler: ", { size: 18, bold: true, color: MUTED }),
        txt(g.tags.map((t) => TAG[t].en).join(" · "), { size: 18, color: MUTED }),
      ],
      { after: 140 },
    ),
  );

  for (const r of rels) {
    push(h3(`${r.emoji} ${r.tr}   (${r.key})`));
    const wds = [620, 3000, USABLE - 620 - 3000 - 4600, 4600];
    const rows = r.traits.map((t, i) => [
      String(i + 1),
      t.tr,
      t.question,
      "",
    ]);
    rows.push(...blanks(2, wds));
    push(table(["#", "Kriter", "Sorulan soru", "Notun"], wds, rows, { noteCol: 3 }));
    push(gap(120));
  }
}

// ---------------------------------------------------------------- traits
push(h1("4 · Kriter havuzu"));
push(
  note(
    "Bir kriter kaç tanışıklıkta soruluyorsa o kadar veri toplar. Tek bir tanışıklıktan sorulan kriter, " +
      "ona bağlı rozeti de fiilen o tanışıklığın arkasına kilitler.",
  ),
);
{
  const wds = [2500, 3100, 900, USABLE - 2500 - 3100 - 900 - 3600, 3600];
  const rows = [...d.traits]
    .sort((a, b) => b.askedBy.length - a.askedBy.length)
    .map((t) => [
      `${t.emoji} ${t.tr}`,
      t.question,
      String(t.askedBy.length),
      t.askedBy.map((k) => REL[k].tr).join(", "),
      "",
    ]);
  rows.push(...blanks(3, wds));
  push(
    table(
      ["Kriter", "Sorulan soru", "Kaç yerde", "Hangi tanışıklıklarda", "Notun"],
      wds,
      rows,
      { noteCol: 4, size: 18 },
    ),
  );
}

// ---------------------------------------------------------------- tags
push(h1("5 · Etiket havuzu"));
push(
  note(
    "Etiketler her zaman İngilizce görünür — marka dili. Bir etiket yalnızca izin verdiği çevrelerden gelen " +
      "değerlendirmelerde seçilebilir.",
  ),
);
{
  const wds = [3000, 2600, USABLE - 3000 - 2600 - 4200, 4200];
  const rows = d.tags.map((t) => [
    `${t.emoji} ${t.en}`,
    t.tr,
    t.groups.map((g) => GLABEL[g]).join(", "),
    "",
  ]);
  rows.push(...blanks(3, wds));
  push(table(["Etiket (EN)", "Türkçesi", "Verilebildiği çevreler", "Notun"], wds, rows, { noteCol: 3 }));
}

// ---------------------------------------------------------------- badges
push(h1("6 · Rozetler"));
push(
  note(
    "On aile, her birinin bronz / gümüş / altın kademesi. Kademeler ayrı ayrı kazanılır ve kaybedilmez — " +
      "altına ulaşan üçünü birden taşır. Bir ailede birden çok koşul varsa hepsi sağlanmalıdır; tek istisna " +
      "«İyi Enerji», orada biri yeter. Eşikler koşulların yazıldığı sırayla okunur.",
  ),
);
{
  const wds = [2500, 4400, 1150, 1150, 1150, USABLE - 2500 - 4400 - 3450];
  const rows = d.badges.map((b) => {
    const runs = [];
    b.metrics.forEach((m, i) => {
      if (i > 0) {
        runs.push(
          txt(b.any ? "  VEYA  " : "  VE  ", {
            size: 16, bold: true, color: b.any ? CORAL : MUTED,
          }),
        );
      }
      runs.push(txt(METRIC[m], { size: 18 }));
    });
    return [
      [
        para(b.tr, { bold: true, size: 19, after: 30 }),
        para(b.key, { mono: true, size: 16, color: MUTED }),
      ],
      [new Paragraph({ children: runs })],
      b.tiers.BRONZE.join(" / "),
      b.tiers.SILVER.join(" / "),
      b.tiers.GOLD.join(" / "),
      "",
    ];
  });
  rows.push(...blanks(3, wds));
  push(
    table(
      ["Rozet", "Koşullar", "Bronz", "Gümüş", "Altın", "Notun"],
      wds,
      rows,
      { noteCol: 5, size: 18 },
    ),
  );
}

push(h2("Doğrulama rozetleri"));
push(
  note(
    "Bunlar kazanılan değil, ispatlanan rozetler. Rozet merdiveninin dışında dururlar ve profil kartının " +
      "sol üst köşesinde görünürler.",
  ),
);
{
  const wds = [3000, 4600, 2200, 2200, USABLE - 3000 - 4600 - 4400];
  const rows = d.verifications.map((v) => [
    v.tr,
    v.description,
    v.icon,
    v.available ? "Aktif" : "Sağlayıcı bekliyor",
    "",
  ]);
  rows.push(...blanks(2, wds));
  push(table(["Doğrulama", "Ne demek", "Simge", "Durum", "Notun"], wds, rows, { noteCol: 4 }));
}

// ---------------------------------------------------------------- gaps
const badgeTraits = new Set(
  d.badges.flatMap((b) => b.metrics.filter((m) => m.startsWith("trait:")).map((m) => m.slice(6))),
);
const unused = d.traits.filter((t) => !badgeTraits.has(t.key));
const narrow = d.traits.filter((t) => t.askedBy.length <= 2);
const badgeFor = {};
for (const b of d.badges) {
  for (const m of b.metrics) if (m.startsWith("trait:")) badgeFor[m.slice(6)] = b;
}

push(h1("7 · Gözden geçirirken dikkat çekenler"));
push(note("Kod okunarak değil, yukarıdaki tablodan hesaplandı. Yeni kategori, kriter veya rozet eklerken bakılacak yerler."));

push(h2(`${unused.length} kriterin bağlı olduğu hiçbir rozet yok`));
push(
  note(
    "Bu kriterler Vibe Score'a ve «Güçlü yönler» çubuklarına girer, ama kimseye kazanılacak bir şey vaat etmez: " +
      unused.map((t) => t.tr).join(", ") + ".",
  ),
);

push(h2("Dar kapılı kriterler"));
push(
  note(
    "En fazla iki tanışıklıktan sorulabiliyorlar. Bir rozete bağlıysalar, o rozet fiilen o tanışıklığın arkasında kilitli demektir.",
  ),
);
{
  const wds = [3000, 5200, 3000, USABLE - 3000 - 5200 - 3000];
  push(
    table(
      ["Kriter", "Nereden sorulabiliyor", "Bağlı rozet", "Notun"],
      wds,
      narrow.map((t) => [
        t.tr,
        t.askedBy.map((k) => REL[k].tr).join(", "),
        badgeFor[t.key] ? badgeFor[t.key].tr : "— yok",
        "",
      ]),
      { noteCol: 3 },
    ),
  );
}

push(h2("Çevre başına kapalı etiketler"));
push(note("Bir çevreden hiç verilemeyen etiket, o çevreden gelen değerlendirmelerle asla ilk 5'e giremez."));
{
  const wds = [3000, 1400, USABLE - 3000 - 1400 - 3800, 3800];
  const allTags = d.tags.map((t) => t.key);
  push(
    table(
      ["Çevre", "Açık", "Kapalı etiketler", "Notun"],
      wds,
      d.groups.map((g) => {
        const closed = allTags.filter((k) => !g.tags.includes(k));
        return [
          `${g.emoji} ${g.label}`,
          `${g.tags.length}/${allTags.length}`,
          closed.length ? closed.map((k) => TAG[k].en).join(", ") : "hepsi açık",
          "",
        ];
      }),
      { noteCol: 3 },
    ),
  );
}

// ---------------------------------------------------------------- blank forms
push(h1("8 · Eklemek istediklerim"));
push(
  note(
    "Boş tablolar. Doldurduğun her satırı uygulamaya eklerim; boş bıraktıklarını yok sayarım. " +
      "Satır yetmezse son satırın sonunda Tab'a basınca yenisi açılır.",
  ),
);

push(h2("Yeni tanışıklık kategorisi"));
{
  const wds = [3400, 2400, USABLE - 3400 - 2400 - 4600, 4600];
  push(
    table(
      ["Tanışıklık adı", "Hangi çevre", "Sorulacak kriterler", "Açıklama / not"],
      wds,
      blanks(5, wds),
      { noteCol: 3 },
    ),
  );
}

push(h2("Yeni kriter (soru)"));
{
  const wds = [3000, 4400, USABLE - 3000 - 4400 - 4600, 4600];
  push(
    table(
      ["Kriter adı", "Sorulacak soru", "Hangi tanışıklıklarda sorulsun", "Açıklama / not"],
      wds,
      blanks(6, wds),
      { noteCol: 3 },
    ),
  );
}

push(h2("Yeni etiket"));
{
  const wds = [3000, 3000, USABLE - 3000 - 3000 - 4600, 4600];
  push(
    table(
      ["Etiket (EN)", "Türkçesi", "Hangi çevrelerde verilebilsin", "Açıklama / not"],
      wds,
      blanks(6, wds),
      { noteCol: 3 },
    ),
  );
}

push(h2("Yeni rozet"));
{
  const wds = [2800, 4400, 1300, 1300, 1300, USABLE - 2800 - 4400 - 3900];
  push(
    table(
      ["Rozet adı", "Koşul(lar)", "Bronz", "Gümüş", "Altın", "Açıklama / not"],
      wds,
      blanks(6, wds),
      { noteCol: 5 },
    ),
  );
}

push(h2("Aklıma gelen diğer şeyler"));
{
  const wds = [USABLE];
  push(table(["Serbest notlar"], wds, blanks(8, wds), { noteCol: 0 }));
}

// ---------------------------------------------------------------- document
const doc = new Document({
  creator: "Vibe Tag",
  title: "Vibe Tag — Değerlendirme taksonomisi ve rozet tablosu",
  description: "Çalışma kopyası: kategoriler, sorular, etiketler ve rozetler",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 19, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 800, bottom: 800, left: MARGIN, right: MARGIN },
        },
      },
      children: kids,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("written", OUT, buf.length, "bytes");
});

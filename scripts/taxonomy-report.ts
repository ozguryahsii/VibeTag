/**
 * Print the whole rating taxonomy and the badge table.
 *
 * Read straight from the modules the app runs on, never typed out by hand: a
 * reference sheet copied from the code drifts from it within a week, and the
 * drift is invisible because both look right on their own.
 *
 *   npm run taxonomy --silent        > docs/taxonomy.md
 *   npm run taxonomy --silent -- --json > taxonomy.json
 *
 * `--silent` matters: without it npm prints its own two banner lines into
 * whatever the output is redirected to.
 */
import {
  CONTEXT_GROUPS,
  RELATIONSHIPS,
  RELATIONSHIP_KEYS,
  TRAITS,
  VIBE_TAGS,
  VIBE_TAG_KEYS,
  MAX_VIBE_TAGS_PER_RATING,
  MIN_VIBE_TAGS_PER_RATING,
  RATING_UPDATE_COOLDOWN_DAYS,
  allowedVibeTags,
  type ContextGroup,
} from "../src/lib/taxonomy";
import { BADGE_FAMILIES, BADGE_TIERS } from "../src/lib/badges";
import { VERIFICATIONS } from "../src/lib/verification";
import { tr } from "../src/lib/i18n/tr";

const GROUP_KEYS = Object.keys(CONTEXT_GROUPS) as ContextGroup[];

const relationships = RELATIONSHIP_KEYS.map((k) => {
  const r = RELATIONSHIPS[k];
  return {
    key: r.key,
    group: r.group,
    tr: r.label,
    en: r.en,
    emoji: r.emoji,
    traits: r.traits.map((t) => ({
      key: t,
      tr: TRAITS[t].label,
      en: TRAITS[t].en,
      question: TRAITS[t].hint,
    })),
    tags: allowedVibeTags(r.key).map((t) => t.key),
  };
});

/** Which relationships may ever ask about a given trait. */
function askedBy(traitKey: string) {
  return relationships.filter((r) => r.traits.some((t) => t.key === traitKey));
}

const report = {
  limits: {
    traitScale: "1..5",
    minTags: MIN_VIBE_TAGS_PER_RATING,
    maxTags: MAX_VIBE_TAGS_PER_RATING,
    cooldownDays: RATING_UPDATE_COOLDOWN_DAYS,
  },
  groups: GROUP_KEYS.map((key) => ({
    key,
    ...CONTEXT_GROUPS[key],
    relationships: relationships.filter((r) => r.group === key).map((r) => r.key),
    tags: VIBE_TAG_KEYS.filter((t) => VIBE_TAGS[t].groups.includes(key)),
  })),
  relationships,
  traits: Object.values(TRAITS).map((t) => ({
    key: t.key,
    tr: t.label,
    en: t.en,
    emoji: t.emoji,
    question: t.hint,
    askedBy: askedBy(t.key).map((r) => r.key),
  })),
  tags: VIBE_TAG_KEYS.map((k) => ({ ...VIBE_TAGS[k] })),
  badges: BADGE_FAMILIES.map((f) => ({
    key: f.key,
    tr: tr.badges[f.key as keyof typeof tr.badges]?.label ?? f.key,
    icon: f.icon,
    any: f.any ?? false,
    metrics: f.metrics.map((m) => `${m.kind}:${m.key}`),
    tiers: Object.fromEntries(BADGE_TIERS.map((t) => [t, f.tiers[t]])),
  })),
  verifications: VERIFICATIONS.map((v) => ({
    ...v,
    tr: tr.verifications[v.key].label,
    description: tr.verifications[v.key].description,
  })),
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

// ------------------------------------------------------------- markdown

const METRIC_TR: Record<string, string> = {
  "trait:reliability": "Güvenilirlik puanı",
  "trait:positivity": "Pozitif enerji puanı",
  "trait:teamwork": "Takım çalışması puanı",
  "trait:kindness": "Kibarlık puanı",
  "trait:honesty": "Dürüstlük puanı",
  "trait:problemSolving": "Problem çözme puanı",
  "trait:empathy": "Empati puanı",
  "count:ratings": "Toplam değerlendirme sayısı",
  "count:score": "Vibe Score",
  "count:workRatings": "Profesyonel çevreden gelen değerlendirme sayısı",
  "count:circles": "Kaç farklı çevreden değerlendirme aldığı (4 üzerinden)",
  "count:energyTag": "«Positive Energy» etiketini kaç kişinin verdiği",
};

const out: string[] = [];
const w = (s = "") => out.push(s);

w("# Değerlendirme taksonomisi ve rozet tablosu");
w();
w(
  "Bu dosya elle yazılmadı — `npm run taxonomy --silent > docs/taxonomy.md`",
);
w(
  "komutu uygulamanın çalıştığı modüllerden üretir. Tabloyu değiştirmek için",
);
w("`src/lib/taxonomy.ts`, `src/lib/badges.ts` ve `src/lib/verification.ts`");
w("dosyaları düzenlenir, sonra bu komut yeniden çalıştırılır.");
w();
w("## Kurallar");
w();
w("| | |");
w("|---|---|");
w(`| Kriter puanı ölçeği | ${report.limits.traitScale} (1 = en düşük, 5 = en yüksek) |`);
w(
  `| Bir değerlendirmede etiket | en az ${report.limits.minTags}, en fazla ${report.limits.maxTags} |`,
);
w(`| Değerlendirme güncelleme aralığı | ${report.limits.cooldownDays} gün |`);
w(`| Tanışıklık kategorisi | ${report.groups.length} çevre, ${relationships.length} seçenek |`);
w(`| Kriter (soru) havuzu | ${report.traits.length} |`);
w(`| Etiket havuzu | ${report.tags.length} |`);
w(`| Rozet | ${report.badges.length} aile × 3 kademe = ${report.badges.length * 3} |`);
w();
w("## Cevaplar nereye işliyor?");
w();
w("| Girdi | Etkilediği yer |");
w("|---|---|");
w(
  "| Tanışıklık seçimi | Hangi kriterlerin sorulacağını ve hangi etiketlerin verilebileceğini belirler (bağlam kilidi). Profildeki «Nereden tanınıyor?» dağılımını ve çevre bazlı puanı besler. |",
);
w(
  "| Kriter puanları (1–5) | 0–100'e çevrilir. Ağırlıklı ortalaması Vibe Score'u oluşturur; her kriter ayrıca kendi «Güçlü yönler» çubuğunu ve gelişim alanlarını besler. Rozetlerin çoğu doğrudan bu kriter puanlarına bakar. |",
);
w(
  "| Etiketler | Sayılır. Profildeki ve Vibe Card'daki en çok oy alan 5 etiketi belirler; «Good Energy» rozeti Positive Energy etiketinin sayısını da kabul eder. |",
);
w(
  "| Not (yorum) | Puana etki etmez. Profilde anonim not olarak görünür (§9 — hiçbir zaman kime ait olduğu yazılmaz). |",
);
w();
w("### Vibe Score nasıl hesaplanıyor?");
w();
w("```");
w("her kriter puanı (1..5)  →  (puan - 1) / 4 × 100      # 0..100");
w("ham skor  = ağırlıklı ortalama (ağırlık = değerlendirmenin güven ağırlığı)");
w("Vibe Score = (ham skor × toplam ağırlık + 78 × 4) / (toplam ağırlık + 4)");
w("```");
w();
w(
  "Baştaki `78 × 4`, az veriyle uç sonuç çıkmasını engelleyen nötr başlangıçtır:",
);
w(
  "üç kişinin oyladığı bir profil 100 göstermez. Sahtecilik korumasına takılan",
);
w("değerlendirmeler `ağırlık = 0` alır — silinmez ama skora hiç girmez.");
w(
  "Kriter puanlarında da aynı mantık 3 birim güçle uygulanır, o yüzden tek bir",
);
w("beşlik bir kriteri 100 yapmaz.");
w();

w("## Tanışıklık kategorileri");
w();
for (const g of report.groups) {
  w(`### ${g.emoji} ${g.label} — \`${g.key}\``);
  w();
  w(`${g.blurb}. Bu çevrede verilebilen etiketler (${g.tags.length}):`);
  w();
  w(g.tags.map((t) => `\`${VIBE_TAGS[t].en}\``).join(" · "));
  w();
  for (const r of relationships.filter((x) => x.group === g.key)) {
    w(`#### ${r.emoji} ${r.tr} — \`${r.key}\``);
    w();
    w(`Sorulan kriterler (${r.traits.length}):`);
    w();
    w("| # | Kriter | Soru | EN |");
    w("|---|---|---|---|");
    r.traits.forEach((t, i) => {
      w(`| ${i + 1} | ${t.tr} | ${t.question} | ${t.en} |`);
    });
    w();
  }
}

w("## Kriter havuzu");
w();
w("Bir kriter kaç tanışıklıkta soruluyorsa o kadar veri toplar. Yalnızca tek");
w("bir tanışıklıkta sorulan kriterler, o kritere bağlı rozeti de fiilen o");
w("tanışıklığın arkasına kilitler — aşağıdaki son sütun bunun için var.");
w();
w("| Kriter | Soru | EN | Kaç tanışıklıkta | Hangileri |");
w("|---|---|---|---|---|");
for (const t of [...report.traits].sort((a, b) => b.askedBy.length - a.askedBy.length)) {
  w(
    `| ${t.emoji} ${t.tr} | ${t.question} | ${t.en} | ${t.askedBy.length} | ${t.askedBy
      .map((k) => RELATIONSHIPS[k as never] && RELATIONSHIPS[k as never]["label"])
      .join(", ")} |`,
  );
}
w();

w("## Etiket havuzu");
w();
w("| Etiket (EN) | TR | Verilebildiği çevreler |");
w("|---|---|---|");
for (const t of report.tags) {
  w(
    `| ${t.emoji} ${t.en} | ${t.tr} | ${t.groups
      .map((g) => CONTEXT_GROUPS[g].label)
      .join(", ")} |`,
  );
}
w();

w("## Rozetler");
w();
w("On aile, her birinin bronz / gümüş / altın kademesi var. Kademeler ayrı");
w("ayrı kazanılır ve kaybedilmez: altına ulaşan üçünü birden taşır. Bir");
w("ailenin şartlarında birden çok koşul varsa **hepsi** sağlanmalıdır —");
w("«veya» yazan tek aile Good Energy'dir.");
w();
w("| Rozet | Anahtar | Koşul(lar) | Bronz | Gümüş | Altın |");
w("|---|---|---|---|---|---|");
for (const b of report.badges) {
  const conds = b.metrics.map((m) => METRIC_TR[m] ?? m).join(b.any ? " **veya** " : " **ve** ");
  const cell = (tier: string) =>
    (b.tiers[tier] as number[]).map((n) => `${n}`).join(" / ");
  w(
    `| **${b.tr}** | \`${b.key}\` | ${conds} | ${cell("BRONZE")} | ${cell("SILVER")} | ${cell("GOLD")} |`,
  );
}
w();
w("Eşik değerleri koşulların yazıldığı sırayla okunur: `75 / 3` = ilk koşul 75,");
w("ikinci koşul 3. Kriter puanları 0–100 ölçeğinde, sayımlar adet olarak.");
w();

w("## Gözden geçirirken dikkat çekenler");
w();
w("Aşağıdakiler kod okunarak değil, tablodan hesaplanarak çıkarıldı — yeni");
w("kategori, kriter veya rozet eklerken bakılacak boşluklar.");
w();

// Traits no badge ever looks at.
const badgeTraits = new Set(
  report.badges.flatMap((b) =>
    b.metrics.filter((m) => m.startsWith("trait:")).map((m) => m.slice(6)),
  ),
);
const unusedTraits = report.traits.filter((t) => !badgeTraits.has(t.key));
w(
  `**${unusedTraits.length} kriterin bağlı olduğu hiçbir rozet yok.** Bu kriterler`,
);
w("Vibe Score'a ve «Güçlü yönler» çubuklarına girer, ama kimseye kazanılacak");
w("bir şey vaat etmez:");
w();
w(unusedTraits.map((t) => `${t.tr} (\`${t.key}\`)`).join(", ") + ".");
w();

// Traits reachable through only one or two relationships.
const narrow = report.traits.filter((t) => t.askedBy.length <= 2);
w(
  `**${narrow.length} kriter en fazla iki tanışıklıktan sorulabiliyor.** Bir kritere`,
);
w("bağlı rozet varsa, o rozet fiilen o tanışıklığın arkasında kilitlidir:");
w();
w("| Kriter | Sorulduğu tanışıklık(lar) | Bağlı rozet |");
w("|---|---|---|");
for (const t of narrow) {
  const badge = report.badges.find((b) => b.metrics.includes(`trait:${t.key}`));
  w(
    `| ${t.tr} | ${t.askedBy
      .map((k) => RELATIONSHIPS[k as never]["label"])
      .join(", ")} | ${badge ? `**${badge.tr}**` : "— (yok)"} |`,
  );
}
w();

// Tags a whole circle can never give.
w("**Çevre başına kapalı etiketler.** Bir çevreden hiç verilemeyen etiketler,");
w("o çevreden gelen değerlendirmelerle asla ilk 5'e giremez:");
w();
w("| Çevre | Kapalı etiketler |");
w("|---|---|");
for (const g of report.groups) {
  const closed = VIBE_TAG_KEYS.filter((k) => !g.tags.includes(k));
  w(
    `| ${g.emoji} ${g.label} | ${
      closed.length ? closed.map((k) => VIBE_TAGS[k].en).join(", ") : "— (hepsi açık)"
    } |`,
  );
}
w();

w("## Doğrulama rozetleri");
w();
w("Bunlar kazanılan değil, ispatlanan rozetlerdir; rozet merdiveninin dışında");
w("durur ve profil kartının sol üst köşesinde görünür.");
w();
w("| Doğrulama | Anahtar | Simge | Açıklama | Durum |");
w("|---|---|---|---|---|");
for (const v of report.verifications) {
  w(
    `| ${v.tr} | \`${v.key}\` | \`${v.icon}\` | ${v.description} | ${
      v.available ? "Aktif" : "Sağlayıcı bekliyor (yakında)"
    } |`,
  );
}
w();

console.log(out.join("\n"));

/**
 * Seed data — a believable little society so every screen has something
 * real to render. Deterministic: same DB every run.
 *
 *   npm run db:reset
 *
 * Demo logins (password for all: "vibetag")
 *   ozgur@vibetag.app  — Gold   (Vibe Identity)
 *   elif@vibetag.app   — Silver (Vibe Insights)
 *   mert@vibetag.app   — Free
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import {
  RELATIONSHIPS,
  allowedVibeTags,
  type RelationshipKey,
} from "../src/lib/taxonomy";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

// deterministic PRNG (mulberry32)
let seed = 0x5eed1234;
function rnd(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

const COLORS = ["#FF8A3D", "#FF5C77", "#FF7AA2", "#8B5CF6", "#E8845C", "#5AA9E6"];

const PEOPLE: [string, string][] = [
  ["Elif Demir", "elifdemir"],
  ["Mert Kaya", "mertkaya"],
  ["Zeynep Aslan", "zeynepaslan"],
  ["Can Yıldız", "canyildiz"],
  ["Deniz Arslan", "denizarslan"],
  ["Ahmet Yılmaz", "ahmetyilmaz"],
  ["Selin Koç", "selinkoc"],
  ["Burak Şahin", "buraksahin"],
  ["Ayşe Çelik", "aysecelik"],
  ["Emre Doğan", "emredogan"],
  ["Ceren Aydın", "cerenaydin"],
  ["Kaan Özkan", "kaanozkan"],
  ["Melis Kurt", "meliskurt"],
  ["Onur Taş", "onurtas"],
  ["İrem Polat", "irempolat"],
  ["Serkan Ateş", "serkanates"],
  ["Buse Erdem", "buseerdem"],
  ["Tolga Güneş", "tolgagunes"],
  ["Nazlı Bulut", "nazlibulut"],
  ["Kerem Aksoy", "keremaksoy"],
  ["Gizem Yalçın", "gizemyalcin"],
  ["Barış Ünal", "barisunal"],
  ["Ece Turan", "eceturan"],
  ["Umut Kılıç", "umutkilic"],
  ["Sena Akın", "senaakin"],
  ["Furkan Tekin", "furkantekin"],
  ["Pelin Sarı", "pelinsari"],
  ["Doruk Eren", "dorukeren"],
  ["Nehir Baş", "nehirbas"],
  ["Alp Karaca", "alpkaraca"],
  ["Derya Şen", "deryasen"],
  ["Yiğit Duman", "yigitduman"],
  ["Aslı Kaplan", "aslikaplan"],
  ["Berk Toprak", "berktoprak"],
  ["Melike Ay", "melikeay"],
  ["Kuzey Özdemir", "kuzeyozdemir"],
  ["Sıla Yavuz", "silayavuz"],
  ["Efe Balcı", "efebalci"],
  ["Duru Işık", "duruisik"],
  ["Arda Çetin", "ardacetin"],
];

const BIOS = [
  "Ürün tasarımcısı · İstanbul",
  "Yazılım geliştirici",
  "Kahve, kod ve uzun yürüyüşler",
  "Freelance içerik üreticisi",
  "İnsanlarla çalışmayı seviyorum",
  "Girişimci · 2 kedi babası",
  "Mimar · Ankara",
  "Pazarlama ekibinde",
  null,
  null,
];

const COMMENTS: Record<string, string[]> = {
  PROFESSIONAL: [
    "Söz verdiği işi zamanında teslim etti, iletişimi çok netti.",
    "Zor bir dönemde ekibi bir arada tuttu.",
    "Detaylara verdiği önem işin kalitesini görünür şekilde artırıyor.",
    "Fikir ayrılıklarında bile saygılı ve yapıcı kalabiliyor.",
    "Sorumluluk almaktan hiç kaçınmadı.",
  ],
  SOCIAL: [
    "Zor günümde arayan ilk kişi oldu.",
    "Yanında olmak insanı iyi hissettiriyor.",
    "Her ortama enerji katıyor, gerçekten.",
    "Dinlemeyi bilen ender insanlardan.",
  ],
  COMMERCE: [
    "Çok ilgiliydi, tüm sorularımı sabırla yanıtladı.",
    "Fiyat ve teslim konusunda son derece şeffaftı.",
    "Beklediğimden hızlı ve temiz bir iş çıktı.",
    "Sorun çıktığında hemen çözüm üretti.",
  ],
  OTHER: [
    "Toplulukta herkese yardım etmeye çalışıyor.",
    "Online da olsa güven veren bir iletişimi var.",
  ],
};

const REL_KEYS = Object.keys(RELATIONSHIPS) as RelationshipKey[];

/**
 * High-but-honest score. Real people rating people they chose to rate skew
 * generous, so 4–5 dominates and 1–2 is rare; `bias` (0..0.5) is how well
 * this particular person is regarded.
 */
function score(bias: number): number {
  const r = rnd();
  if (r < 0.3 + bias) return 5;
  if (r < 0.88 + bias * 0.25) return 4;
  if (r < 0.985) return 3;
  return 2;
}

async function main() {
  console.log("→ temizleniyor");
  await prisma.ratingRevision.deleteMany();
  await prisma.ratingTrait.deleteMany();
  await prisma.ratingVibeTag.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const pw = hashPassword("vibetag");

  console.log("→ kullanıcılar");
  const ozgur = await prisma.user.create({
    data: {
      name: "Özgür Yahşi",
      username: "ozguryahsi",
      email: "ozgur@vibetag.app",
      passwordHash: pw,
      bio: "Kurucu · ürün geliştiriyorum",
      avatarColor: "#FF8A3D",
      plan: "GOLD",
      isVerified: true,
      createdAt: daysAgo(240),
    },
  });

  const others = [];
  for (let i = 0; i < PEOPLE.length; i++) {
    const [name, username] = PEOPLE[i];
    const email =
      username === "elifdemir"
        ? "elif@vibetag.app"
        : username === "mertkaya"
          ? "mert@vibetag.app"
          : `${username}@vibetag.app`;

    others.push(
      await prisma.user.create({
        data: {
          name,
          username,
          email,
          passwordHash: pw,
          bio: pick(BIOS),
          avatarColor: COLORS[i % COLORS.length],
          plan:
            username === "elifdemir"
              ? "SILVER"
              : username === "mertkaya"
                ? "FREE"
                : rnd() > 0.85
                  ? "SILVER"
                  : "FREE",
          isVerified: rnd() > 0.7,
          createdAt: daysAgo(30 + Math.floor(rnd() * 200)),
        },
      }),
    );
  }

  type RatingSpec = {
    ratedUserId: string;
    raterUserId: string;
    relationship: RelationshipKey;
    bias: number;
    withComment: boolean;
    ageDays: number;
    hideIdentity?: boolean;
    protect?: boolean;
  };

  async function writeRating(s: RatingSpec) {
    const rel = RELATIONSHIPS[s.relationship];
    const traits = rel.traits.map((traitKey) => ({
      traitKey,
      score: score(s.bias),
    }));

    const tagPool = allowedVibeTags(s.relationship);
    const tagCount = 2 + Math.floor(rnd() * 3);
    const tags = new Set<string>();
    while (tags.size < Math.min(tagCount, tagPool.length)) {
      tags.add(pick(tagPool).key);
    }

    const bank = COMMENTS[rel.group];
    const created = daysAgo(s.ageDays);

    await prisma.rating.create({
      data: {
        ratedUserId: s.ratedUserId,
        raterUserId: s.raterUserId,
        relationship: s.relationship,
        comment: s.withComment ? pick(bank) : null,
        hideIdentity: s.hideIdentity ?? false,
        isProtected: s.protect ?? false,
        fraudFlags: s.protect ? '["NEW_ACCOUNT","FLAT_PATTERN"]' : "[]",
        weight: s.protect ? 0.42 : 1,
        createdAt: created,
        updatedAt: created,
        traits: { create: traits },
        vibeTags: { create: [...tags].map((tagKey) => ({ tagKey })) },
      },
    });
  }

  console.log("→ Özgür'ün değerlendirmeleri");
  // A deliberately mixed portfolio so the Insights breakdown is interesting:
  // work-heavy, then friends, then customers.
  const ozgurRaters = others.slice(0, 34);
  const mix: RelationshipKey[] = [
    ...Array(8).fill("sameProject"),
    ...Array(4).fill("sameCompany"),
    ...Array(2).fill("wasMyManager"),
    ...Array(2).fill("wasMyEmployee"),
    ...Array(3).fill("closeFriend"),
    ...Array(4).fill("friend"),
    ...Array(2).fill("socialCircle"),
    ...Array(1).fill("familyCircle"),
    ...Array(3).fill("receivedService"),
    ...Array(2).fill("knowAsCustomer"),
    ...Array(2).fill("community"),
    ...Array(1).fill("online"),
  ];

  for (let i = 0; i < ozgurRaters.length; i++) {
    await writeRating({
      ratedUserId: ozgur.id,
      raterUserId: ozgurRaters[i].id,
      relationship: mix[i % mix.length],
      bias: 0.42,
      withComment: i % 4 === 0,
      ageDays: 3 + i * 4,
      hideIdentity: i === 5,
      protect: i === 11,
    });
  }

  console.log("→ Özgür başkalarını değerlendiriyor");
  for (let i = 0; i < 9; i++) {
    await writeRating({
      ratedUserId: others[i].id,
      raterUserId: ozgur.id,
      relationship: pick(REL_KEYS),
      bias: 0.4,
      withComment: i % 3 === 0,
      ageDays: 10 + i * 6,
    });
  }
  // One of them is already updated once, so the 30-day lock is visible in the UI.
  const locked = await prisma.rating.findFirst({
    where: { raterUserId: ozgur.id },
    orderBy: { createdAt: "desc" },
  });
  if (locked) {
    await prisma.$transaction([
      prisma.ratingRevision.create({
        data: {
          ratingId: locked.id,
          version: 1,
          snapshot: JSON.stringify({
            relationship: locked.relationship,
            comment: locked.comment,
            note: "ilk sürüm",
          }),
        },
      }),
      prisma.rating.update({
        where: { id: locked.id },
        data: { updateCount: 1, lastUpdatedAt: daysAgo(6) },
      }),
    ]);
  }

  console.log("→ topluluk içi değerlendirmeler");
  for (const target of others) {
    const raterCount = 3 + Math.floor(rnd() * 14);
    const pool = others.filter((u) => u.id !== target.id);
    const used = new Set<string>();

    for (let i = 0; i < raterCount; i++) {
      const rater = pick(pool);
      if (used.has(rater.id)) continue;
      used.add(rater.id);

      await writeRating({
        ratedUserId: target.id,
        raterUserId: rater.id,
        relationship: pick(REL_KEYS),
        bias: 0.08 + rnd() * 0.44,
        withComment: rnd() > 0.72,
        ageDays: 2 + Math.floor(rnd() * 160),
      });
    }
  }

  const [users, ratings] = await Promise.all([
    prisma.user.count(),
    prisma.rating.count(),
  ]);
  console.log(`\n✓ ${users} kullanıcı, ${ratings} değerlendirme oluşturuldu.`);
  console.log("  Giriş: ozgur@vibetag.app / vibetag  (Gold)");
  console.log("         elif@vibetag.app  / vibetag  (Silver)");
  console.log("         mert@vibetag.app  / vibetag  (Free)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

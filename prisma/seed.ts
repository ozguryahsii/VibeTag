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
import { buildVibeProfile } from "../src/lib/vibe";
import { earnedBadges } from "../src/lib/badges";

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

/**
 * Seeded coordinates so the "nearby" list has something to sort. Most people
 * sit around İstanbul at varying distances, a handful are in other cities, and
 * some share nothing at all — which is the realistic mix the list has to cope
 * with. Stored at ~100 m precision, the same as the app itself does.
 */
const CITIES: [number, number][] = [
  [41.0082, 28.9784], // İstanbul
  [39.9334, 32.8597], // Ankara
  [38.4237, 27.1428], // İzmir
];

function seededLocation(i: number): {
  shareLocation: boolean;
  lat: number | null;
  lng: number | null;
  locationAt: Date | null;
} {
  // Roughly a third keep location off, which is the honest default.
  if (rnd() < 0.3) {
    return { shareLocation: false, lat: null, lng: null, locationAt: null };
  }
  const [baseLat, baseLng] = i % 9 === 4 ? pick(CITIES.slice(1)) : CITIES[0];
  const spread = 0.45; // ≈ 50 km
  const lat = baseLat + (rnd() - 0.5) * spread;
  const lng = baseLng + (rnd() - 0.5) * spread;
  return {
    shareLocation: true,
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
    locationAt: daysAgo(Math.floor(rnd() * 10)),
  };
}

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
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.earnedBadge.deleteMany();
  await prisma.inviteGrant.deleteMany();
  await prisma.inviteClaim.deleteMany();
  await prisma.invite.deleteMany();
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
      isAdmin: true,
      locale: "tr",
      shareLocation: true,
      lat: 41.043,
      lng: 29.008,
      locationAt: daysAgo(1),
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
          ...seededLocation(i),
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

  console.log("→ davetler ve bildirimler");
  const invite = await prisma.invite.create({
    data: {
      code: "ozgurvibe",
      inviterId: ozgur.id,
      label: "Davet linkim",
    },
  });
  // A revoked link, so the dead-link state is visible in the demo.
  await prisma.invite.create({
    data: {
      code: "ozgureski",
      inviterId: ozgur.id,
      label: "Eski link",
      revokedAt: new Date(Date.now() - 2 * 86_400_000),
    },
  });

  for (const u of others.slice(0, 6)) {
    await prisma.inviteGrant.create({
      data: { inviteId: invite.id, ownerId: ozgur.id, userId: u.id },
    });
    await prisma.inviteClaim.create({
      data: { inviteId: invite.id, userId: u.id },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: ozgur.id,
        type: "NEW_RATING",
        href: "/home",
        createdAt: daysAgo(1),
      },
      {
        userId: ozgur.id,
        type: "INVITE_JOINED",
        href: "/invite",
        createdAt: daysAgo(3),
      },
      {
        userId: ozgur.id,
        type: "BADGE_EARNED",
        vars: JSON.stringify({ badgeKey: "communityFavorite" }),
        href: "/home",
        createdAt: daysAgo(9),
        readAt: daysAgo(8),
      },
    ],
  });

  console.log("→ rozetler");
  // Backfill what the seeded profiles have already earned, so the badge shelf
  // and the "you earned it" event agree from the first render.
  for (const u of [ozgur, ...others]) {
    const rows = await prisma.rating.findMany({
      where: { ratedUserId: u.id, hiddenAt: null },
      select: {
        id: true,
        relationship: true,
        weight: true,
        createdAt: true,
        traits: { select: { traitKey: true, score: true } },
        vibeTags: { select: { tagKey: true } },
      },
    });
    const profile = buildVibeProfile(
      rows.map((r) => ({
        id: r.id,
        relationship: r.relationship as RelationshipKey,
        weight: r.weight,
        createdAt: r.createdAt,
        traits: r.traits.map((t) => ({
          traitKey: t.traitKey as never,
          score: t.score,
        })),
        vibeTags: r.vibeTags.map((t) => ({ tagKey: t.tagKey as never })),
      })),
    );
    const keys = earnedBadges(profile).map((b) => b.key);
    if (keys.length) {
      await prisma.earnedBadge.createMany({
        data: keys.map((key) => ({ userId: u.id, key })),
      });
    }
  }

  console.log("→ moderasyon kuyruğu");
  // A queue with nothing in it cannot be judged, so seed a few real-looking
  // cases: one about a rating, one about an account, one already closed.
  const disputed = await prisma.rating.findFirst({
    where: { ratedUserId: ozgur.id, comment: { not: null } },
    select: { id: true },
  });
  if (disputed) {
    await prisma.report.create({
      data: {
        reporterId: ozgur.id,
        ratingId: disputed.id,
        reason: "UNFAIR",
        note: "Bu kişiyle hiç birlikte çalışmadım, yorum gerçeği yansıtmıyor.",
        createdAt: daysAgo(2),
      },
    });
  }
  await prisma.report.create({
    data: {
      reporterId: others[3].id,
      reportedUserId: others[11].id,
      reason: "FAKE",
      note: "Aynı gün on kişiyi birden değerlendirmiş, hesap sahte görünüyor.",
      createdAt: daysAgo(1),
    },
  });
  await prisma.report.create({
    data: {
      reporterId: others[5].id,
      reportedUserId: others[9].id,
      reason: "SPAM",
      status: "DISMISSED",
      reviewerId: ozgur.id,
      reviewedAt: daysAgo(4),
      createdAt: daysAgo(6),
    },
  });

  console.log("→ arkadaşlıklar ve mesajlar");
  for (const u of others.slice(0, 5)) {
    await prisma.friendship.create({
      data: {
        requesterId: ozgur.id,
        addresseeId: u.id,
        status: "ACCEPTED",
        acceptedAt: daysAgo(20),
      },
    });
  }
  // one pending request waiting for Özgür to answer
  await prisma.friendship.create({
    data: { requesterId: others[7].id, addresseeId: ozgur.id, status: "PENDING" },
  });

  const friend = others[0];
  const [fa, fb] = ozgur.id < friend.id ? [ozgur.id, friend.id] : [friend.id, ozgur.id];
  const thread = await prisma.conversation.create({
    data: { userAId: fa, userBId: fb, kind: "FRIEND", lastMessageAt: daysAgo(1) },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: thread.id,
        senderId: friend.id,
        body: "Değerlendirmeni yaptım, gerçekten keyifliydi birlikte çalışmak.",
        createdAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        conversationId: thread.id,
        senderId: ozgur.id,
        body: "Çok teşekkürler! Ben de senin profiline bir Vibe bıraktım.",
        createdAt: daysAgo(1),
      },
    ],
  });

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

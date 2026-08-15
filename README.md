# Vibe Tag

**Social Reputation & Human Identity Platform**

> "İnsanlar beni nasıl görüyor?"

Vibe Tag bir puanlama uygulaması değil. İnsanların çevrelerindeki kişilerin
onlarda gördüğü **güzel özellikleri** keşfettiği, bunu paylaşılabilir bir dijital
sosyal kimliğe dönüştüren bir platform.

Bu repo, ürün konseptinin ve **Human Warm** tema sisteminin birleştirildiği
çalışan bir MVP'dir — mobil-öncelikli, gerçek veritabanı, gerçek kurallar.

---

## Hızlı başlangıç

```bash
npm install
cp .env.example .env
npm run db:reset      # şema + demo verisi (41 kullanıcı, ~400 değerlendirme)
npm run dev           # http://localhost:3000
```

### Demo hesapları (şifre hepsinde `vibetag`)

| E-posta               | Plan   | Ne görürsün                                    |
| --------------------- | ------ | ---------------------------------------------- |
| `ozgur@vibetag.app`   | Gold   | Vibe Identity — kimin değerlendirdiği görünür  |
| `elif@vibetag.app`    | Silver | Vibe Insights — çevre dağılımı + anonim detay  |
| `mert@vibetag.app`    | Free   | My Vibe, Vibe Score, Vibe Card                 |

Planı uygulama içinden **Profil → Üyelik** ekranından anında değiştirebilirsin
(demo amaçlı; gerçek üründe ödeme sağlayıcısına bağlanır).

---

## Ekranlar

| Ekran            | Yol                | İçerik                                                      |
| ---------------- | ------------------ | ----------------------------------------------------------- |
| Welcome          | `/`                | "Discover how people see you."                              |
| My Vibe          | `/home`            | Vibe Score dial, Vibe Tags, AI özeti, rozetler              |
| Rate Someone     | `/rate/[username]` | 4 adımlı, bağlam kilitli değerlendirme akışı                |
| Public profile   | `/u/[username]`    | Skor, etiketler, çevre dağılımı, anonim notlar              |
| Vibe Insights    | `/insights`        | Premium analiz (Silver) + kimlik görünümü (Gold)            |
| Vibe Card        | `/card`            | Story / kare / geniş formatta gerçek PNG üretimi            |
| Profil & Üyelik  | `/settings`        | Avatar, bio, plan, gizlilik açıklamaları                    |

---

## Ürün kuralları nerede yaşıyor?

Bu ürünün tamamı güven üzerine kurulu, o yüzden kurallar UI'da değil sunucuda
zorlanıyor.

### 1. Bağlam kilidi — `src/lib/taxonomy.ts`

Bir değerlendirme başlamadan önce **"Bu kişiyi nereden tanıyorsun?"** sorusu
zorunlu. Verilen cevap, o değerlendirmede sorulabilecek kriterleri ve
verilebilecek Vibe Tag'leri belirler.

```
receivedService (Hizmet aldım)
  → Kibarlık, İletişim, Yardımseverlik, Profesyonellik, İş kalitesi, Dakiklik
  → Liderlik ❌  Arkadaşlık özellikleri ❌  Aile ilişkileri ❌

sameProject (Aynı projede çalıştık)
  → Güvenilirlik, Sorumluluk, Takım çalışması, Problem çözme, Çalışkanlık, İletişim
```

`assertAllowed()` bu kuralı sunucu tarafında bir kez daha doğrular — istemciyi
atlayan bir istek de reddedilir.

### 2. Tek kişi, tek oy — `prisma/schema.prisma`

`@@unique([ratedUserId, raterUserId])`. İkinci bir oy oluşturulamaz; yalnızca
mevcut oy güncellenebilir.

### 3. Ayda bir güncelleme + tam geçmiş — `src/lib/actions/rating.ts`

Güncelleme 30 günde bir. Her güncellemede eski sürümün tam anlık görüntüsü
`RatingRevision` tablosuna yazılır — hiçbir veri kaybolmaz.

### 4. Anonimlik — `src/app/(app)/insights/page.tsx`

Frontend'de kim ne verdi görünmez; veritabanında her şey kayıtlıdır. Gold üyelik
kimliği açar, **ama**:

- değerlendiren "kimliğimi gizle" dediyse → her zaman anonim,
- sahte oy dedektörü oyu korumaya aldıysa → her zaman anonim,
- yorum sahibi hiçbir planda gösterilmez.

### 5. Sahte oy tespiti — `src/lib/fraud.ts`

Şüpheli oylar silinmez, **ağırlığı düşürülür** (`weight` 0..1) ve korumaya
alınır. Bakılan sinyaller: çok yeni hesap, itibar geçmişi olmayan değerlendiren,
kısa sürede oy patlaması, karşılıklı tam puan alışverişi, herkese aynı tekdüze
puanı veren profil.

### 6. Skor — `src/lib/vibe.ts`

Ağırlıklı ortalama, 78 puanlık nötr bir öncüle doğru Bayes çekmesiyle
yumuşatılır (`PRIOR_STRENGTH = 4`). Böylece 2 kişiden 5 alan biri 100'e
fırlamaz; skor kanıt biriktikçe gerçeğe yaklaşır. Ekranda gösterilen her sayı
ham veriden yeniden türetilebilir.

---

## AI katmanı

`src/lib/insights.ts` içindeki `generateVibeSummary()` şu an **deterministik ve
açıklanabilir** bir motor: ürettiği her cümle, kullanıcının kendi de görebildiği
bir sayıya dayanır. Bir güven ürününde uydurulmuş bir iltifat, hiç iltifat
etmemekten kötüdür.

Barındırılan bir LLM'e geçmek istendiğinde tek değiştirilecek yer bu fonksiyon —
dönüş tipi (`VibeSummary`) UI'ın beklediği sözleşmedir.

---

## Tema — Human Warm

Tüm token'lar `src/app/globals.css` içinde tek yerde tanımlı.

| Rol                | Değer                                     |
| ------------------ | ----------------------------------------- |
| Ana arka plan      | `#FAF7F2` Soft Cream                      |
| Kart içi           | `#FFF8F5` Warm White                      |
| Vibe Orange        | `#FF8A3D`                                 |
| Vibe Coral         | `#FF5C77`                                 |
| Vibe Pink          | `#FF7AA2`                                 |
| Accent (premium/AI)| `#8B5CF6` Soft Purple                     |
| Metin / ikincil    | `#1F1F1F` / `#6B6B6B`                     |
| Çizgi              | `#F0E5DD`                                 |
| Kart yarıçapı      | `24px`                                    |
| Gölge              | `0 10px 40px rgba(255,138,61,0.12)`       |
| Font               | Inter (400–900), `next/font` ile self-host |

Gradientler: skor `#FF8A3D → #FF5C77`, kart `#FF9A3D → #FF5C77 → #FF7AA2`,
premium `#FF8A3D → #8B5CF6`.

Logo **Vibe Fingerprint** (`src/components/Logo.tsx`): parmak izi çizgileri +
içinde V, turuncu→mercan→mor geçişiyle.

Animasyonlar: skor 0'dan sayarak açılır (`ScoreDial`, easeOutExpo), kartlar
alttan yükselir, gradient yavaşça sürüklenir. Hepsi
`prefers-reduced-motion` ile kapanır.

---

## Vibe Card

`src/components/VibeCardStudio.tsx` kartı **gerçek çözünürlükte bir `<canvas>`**
üzerine çizer — önizleme ile indirilen PNG birebir aynıdır.

- Story `1080×1920`, Kare `1080×1080`, Geniş `1600×900`
- 4 tema: Sunset / Ember / Aura / Cream
- Skoru gizleme seçeneği (sadece etiketlerle paylaşım)
- `navigator.share` varsa doğrudan paylaşım sayfası, yoksa PNG indirme

---

## Teknoloji

| Katman     | Seçim                          | Not                                                      |
| ---------- | ------------------------------ | -------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19 | Server Components + Server Actions                    |
| Dil        | TypeScript (strict)            |                                                          |
| Stil       | Tailwind CSS v4                | Tema token'ları `@theme` ile                             |
| Veritabanı | Prisma + SQLite                | Şema PostgreSQL uyumlu — `provider`'ı değiştirmek yeterli |
| Auth       | scrypt + httpOnly cookie session | Firebase/Auth0'a taşınabilir                           |

Ürün planındaki React Native hedefi için: tüm iş mantığı (`src/lib/*`) UI'dan
bağımsız saf TypeScript — mobil istemci aynı kuralları paylaşabilir.

### Production'a geçerken

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # production build
npm run start      # production sunucusu
npm run typecheck  # tip kontrolü
npm run db:push    # şemayı veritabanına uygula
npm run db:seed    # demo verisi
npm run db:reset   # sıfırla + şema + demo verisi
```

---

## Yol haritası

Konseptte tanımlı olup bu MVP'de yer almayanlar:

- Davet akışı (link/QR ile çevre daveti)
- Push bildirimleri ("3 yeni kişi seni değerlendirdi")
- Gerçek ödeme entegrasyonu
- Sahte oy tespitinin periyodik toplu yeniden hesaplaması
- Freelancer / işe alım güven profili görünümleri

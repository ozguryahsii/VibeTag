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

Veritabanı PostgreSQL — geliştirmede de, canlıda da. İkisini farklı motorda
çalıştırmak, az önce yakaladığımız türden hataların kaynağı: SQLite'ın `LIKE`'ı
harf duyarsız, Postgres'inki değil, ve geliştirme veritabanı her şey yolunda
diyor.

```bash
npm install
cp .env.example .env

docker compose up -d db   # yerel Postgres (tek komut)
npm run db:reset          # migration + demo verisi (41 kullanıcı, ~400 değerlendirme)
npm run dev               # http://localhost:3000
```

Container **5433** portunda açılıyor, 5432'de değil — Mac'te Postgres.app ya
da Homebrew'un postgresql'i çoğu zaman varsayılan portu zaten tutuyor.

### Zaten bir PostgreSQL çalışıyorsa

Docker'a hiç gerek yok, mevcut sunucunu kullan:

```bash
createdb vibetag
```

`.env` içinde:

```
DATABASE_URL="postgresql://$(whoami)@localhost:5432/vibetag"
```

Docker da yoksa Postgres de yoksa:
`brew install postgresql@16 && brew services start postgresql@16`. Ya da
Neon/Supabase'de ücretsiz bir geliştirme veritabanı açıp bağlantı adresini
yapıştır — yerel kurulum gerekmez.

### Takıldığın yer

| Hata | Sebep |
| --- | --- |
| `Bind for 0.0.0.0:5433 failed: port is already allocated` | 5433 de dolu. `.env`'de `DB_PORT`'u değiştir (5434 gibi) ve `DATABASE_URL`'deki portu da aynı yap. |
| `P1000: Authentication failed` | Container ayakta değil ve Prisma **başka** bir Postgres'e bağlanıyor. `docker compose ps` ile kontrol et. |
| `P1001: Can't reach database server` | Container henüz hazır değil. `docker compose ps` çıktısında `healthy` yazmasını bekle. |

Ne çalışıyor diye bakmak için: `lsof -nP -iTCP:5432 -sTCP:LISTEN`

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
| Davet            | `/invite`          | Kişisel davet linki, QR, paylaşım ve katılım sayısı         |
| Davet karşılama  | `/i/[code]`        | Public — davet edenin profiliyle açılır                     |
| Bildirimler      | `/notifications`   | Yeni değerlendirme, davet kabulü, rozet                     |
| Mesajlar         | `/messages`        | Sohbetler; sağa kaydır arşivle, sola kaydır sil             |
| Profil & Üyelik  | `/settings`        | Avatar, fotoğraf kasası, bio, plan, gizlilik, hesap silme   |
| Yönetim paneli   | `/admin`           | Üye/plan/rozet sayıları, premium dağılımı — sadece admin    |
| Üyeler           | `/admin/members`   | Ara, elle plan ver ya da geri al                            |
| İndirim kodları  | `/admin/codes`     | Kod oluştur, kapat, kaç kere kimin kullandığını gör         |

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

- sahte oy dedektörü oyu korumaya aldıysa → her zaman anonim,
- "kimliğimi gizle" seçeneği kaldırıldı; o seçenek varken gizlenmiş eski
  değerlendirmeler verildikleri sözü korur → her zaman anonim.

Kimliğin görünürlüğü artık değerlendirenin değil, değerlendirilenin planına
bağlıdır.

### 5. Sahte oy tespiti — `src/lib/fraud.ts`

Şüpheli oylar silinmez, **ağırlığı düşürülür** (`weight` 0..1). Ağırlık eşiğin
altına inerse oy **korumaya alınır ve ağırlığı sıfırlanır** — yani hiçbir
puana, hiçbir ortalamaya ve hiçbir rozete sayılmaz; kayıt yerinde durur,
moderasyon görebilir. Bakılan sinyaller: çok yeni hesap, itibar geçmişi olmayan değerlendiren,
kısa sürede oy patlaması, karşılıklı tam puan alışverişi, herkese aynı tekdüze
puanı veren profil.

### 6. Davet — `src/lib/invite.ts`

Uygulamanın tek kapısı davet linki. Kimse yabancıları gezinerek bulmuyor;
sizi tanıyan biri link veriyor, o da zaten değerlendirme akışının sorduğu
ilişkinin ta kendisi.

**Her link ayrı üretilir ve sınırlıdır.** Tek kalıcı bir kod, "sadece davet
ettiklerim değerlendirebilir" ayarını ilk elden ele geçişte işlevsiz bırakırdı.
Üç hazır seçenek var: tek kişilik (1 kullanım · 7 gün), küçük grup
(10 · 14 gün), açık link (sınırsız). Sahibi istediği linki iptal edebilir.

İki kavram bilinçli olarak ayrı:

- **`InviteClaim`** — hesabın kökeni. Kişi başına bir tane, yalnızca kayıt
  anında. Sahte hesap tespitine sinyal verir.
- **`InviteGrant`** — "bu kişi linkimle geldi, beni değerlendirebilir."
  İki kişi arasındaki izin. Davet-only politikası bunu kontrol eder.

Ayrım şart, çünkü **zaten hesabı olan** birine link gönderdiğinizde ona claim
oluşmaz — sadece claim'e bakan bir kontrol, davet ettiğiniz mevcut kullanıcıyı
kapıda bırakırdı.

### 7. Engelleme ve bildirme — `src/lib/actions/safety.ts`

**Engelleme geçmişi silmez.** Engellenen kişi yeni değerlendirme yapamaz ve
mevcut değerlendirmesini güncelleyemez, ama verdiği puan sayılmaya devam eder.
Aksi hâlde engelleme tuşu skor temizleme aracına dönerdi: düşük puan vereni
engelle, puanın yükselsin. Haksız bulunan değerlendirme için doğru yol
bildirmek.

**Bildirme kimlik açmaz.** Bir değerlendirmeyi yalnızca hakkında olan kişi
bildirebilir; sistem ona yazarın kim olduğunu söylemez, yazara da bildirildiğini
söylemez. İkisi de aracı ya kimlik ifşasına ya da misillemeye çevirirdi.

**Yorum filtresi** (`src/lib/moderation.ts`) hakaret, iletişim bilgisi ve bağlantı
içeren notları gönderim anında reddeder. Bir kelime listesi taban seviyedir,
çözüm değil — asıl ağ bildir düğmesi ve insan incelemesidir.

### 8. Gizlilik ayarı

Puanlama herkese açıktır. `commentPolicy` yazılı notu kapılar ve iki değeri
vardır: `EVERYONE` ya da `CIRCLE` (kullanıcının davet ettikleri ve arkadaşları,
tek grup olarak). Taciz notta yaşar, puanda değil — o yüzden kapı notun
üstündedir ve ayar notu yazanın değil, hakkında yazılanın elindedir.

### 9. Skor — `src/lib/vibe.ts`

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
| Başlık/gövde fontu | Inter (400–900), `next/font` ile self-host |
| Editöryel font     | DM Serif Display — isim ve Vibe Score      |

Gradientler: skor `#FF8A3D → #FF5C77`, kart `#FF9A3D → #FF5C77 → #FF7AA2`,
premium `#FF8A3D → #8B5CF6`.

Logo **Vibe Fingerprint** (`src/components/Logo.tsx`): parmak izi çizgileri +
içinde V, turuncu→mercan→mor geçişiyle.

**İkonlar** (`src/lib/icons.ts`): 24×24 kutuda, ince çizgili tek bir set.
Aynı kaynak hem React'te (`<TagIcon>`, `<TraitIcon>`) hem Vibe Card canvas'ında
(`Path2D`) kullanılır — emoji yok, çünkü emoji markanın ortasına başka birinin
sanat yönetimini taşıyor ve iki ekranda aynı kriter farklı görünüyordu.

**Avatar** (`src/components/Avatar.tsx`): yüklenen fotoğraf, yoksa kişinin kendi
gradientinde monogram. Fotoğraf cihazda 512px kareye küçültülüp JPEG olarak
gönderilir.

Animasyonlar: skor 0'dan sayarak açılır (`ScoreDial`, easeOutExpo), kartlar
alttan yükselir, gradient yavaşça sürüklenir. Hepsi
`prefers-reduced-motion` ile kapanır.

---

## Vibe Card

`src/components/VibeCardStudio.tsx` kartı **gerçek çözünürlükte bir `<canvas>`**
üzerine çizer — önizleme ile indirilen PNG birebir aynıdır.

- Story `1080×1920`, Kare `1080×1080`, Geniş `1600×900`
- 4 tema: Auto / Glow / Calm / Aura — Auto tonu skora göre seçer
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

### Production

Adım adım deploy: **[DEPLOY.md](DEPLOY.md)** — Vercel + Neon ve kendi
sunucun (Docker + Caddy) için iki ayrı yol, ve yayına almadan önce koşulacak
kontroller.

Kısaca: `Dockerfile` kendi sunucun için hazır (`output: "standalone"`),
`/api/health` veritabanına dokunarak cevap veriyor, migration'lar
`npm run db:deploy` ile uygulanıyor.

---

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # production build
npm run start      # production sunucusu
npm run typecheck  # tip kontrolü
npm run test       # testler (vitest)
npm run test:watch # testleri izleyerek çalıştır

npm run db:up      # yerel Postgres'i başlat (docker)
npm run db:down    # durdur
npm run db:reset   # sıfırla + migration + demo verisi
npm run db:migrate # şema değişikliğinden sonra yeni migration üret
npm run db:deploy  # mevcut migration'ları uygula (canlıda bu çalışır)
npm run db:seed    # sadece demo verisi
npm run db:studio  # veritabanını tarayıcıda gez
```

`db:reset` veritabanını sıfırdan kurar; verilerin gitmesini istemiyorsan
`npm run db:deploy && npm run db:seed` yeterli.

Şemayı değiştirdiğinde `npm run db:migrate` çalıştır ve üretilen
`prisma/migrations/…` klasörünü commit'e dahil et — canlıdaki veritabanı
yalnızca bu dosyalardan güncelleniyor.

---

## Testler

`npm run test`. Kapsam bilinçli olarak dar: bozulduğunda ekranda hiçbir şeyin
yanlış görünmediği, yani kimsenin fark etmeyeceği kurallar.

| Dosya | Neyi koruyor |
| --- | --- |
| `context-lock.test.ts` | Bağlam kilidi — kasiyer liderlikten puanlanamaz |
| `rating-rules.test.ts` | 30 günlük güncelleme sınırı ve §15 kimlik görünürlüğü |
| `scoring.test.ts` | Skorun cömert ama temkinli davranışı, çevre dağılımı |
| `badges.test.ts` | Rozet eşikleri; kilitli bir rozet asla %100 göstermez |
| `moderation.test.ts` | Küfür filtresi ve kaçamakları, bildirim sebepleri |
| `geo.test.ts` | "~100 metreye yuvarlanır" sözünün tutulduğu |
| `i18n.test.ts` | İki sözlüğün aynı şekli ve aynı `{placeholder}`'ları |

---

## Yol haritası

Konseptte tanımlı olup bu sürümde yer almayanlar:

- Fotoğrafların object storage'a (R2/S3) taşınması — şu an data URL
- E-posta doğrulama ve şifre sıfırlama
- Gerçek ödeme entegrasyonu — plan değişimi şu an anlık ve ücretsiz
- Yasal metinlerin hukukçu onayı (`src/lib/legal.ts` taslak olarak işaretli)
- Freelancer / işe alım güven profili görünümleri

# App Store ve Google Play'e çıkış rehberi

Bu depo mağazaya hazır: `mobile/` altında iOS ve Android projeleri, ikonlar ve
açılış ekranları üretilmiş hâlde duruyor. Aşağısı Özgür'ün yürüyeceği yol —
sırayla, hangi adımın nerede yapıldığıyla birlikte.

Kabuğun mantığı: uygulama, WebView içinde **https://vibetag.net**'i açar
(`mobile/capacitor.config.ts` → `server.url`). Yani siteye atılan her deploy
aynı anda uygulamalara da gider; içerik değişikliği için mağaza incelemesi
gerekmez. Kabuğun kendine ait olan şeyler: ikon, açılış ekranı, durum çubuğu
ve sunucunun okuduğu `VibeTagShell` user-agent damgası.

---

## 0 · Ön koşullar

| Ne | Durum / nereden |
|---|---|
| Apple Developer hesabı ($99/yıl) | ✅ alındı |
| Google Play Console hesabı ($25, tek seferlik) | ❌ [play.google.com/console/signup](https://play.google.com/console/signup) |
| macOS + Xcode (iOS derlemesi için şart) | Mac'ine güncel Xcode kur |
| Android Studio (Android derlemesi için) | Mac'e kurulabilir, aynı makine yeter |
| Paket kimliği | `net.vibetag.app` — **Play'e ilk yüklemeden sonra asla değişemez.** Değiştirmek istiyorsan şimdi söyle. |

## 1 · İnceleme hesabı (iki mağaza için de şart)

İncelemeciler bizim e-postamızı okuyamaz; zorunlu OTP = otomatik ret.
Sunucuda bir kez:

1. Uygulamada normal yoldan bir hesap aç: ör. `review@vibetag.net`.
2. Sunucudaki `.env`'e ekle ve yeniden başlat:
   ```
   REVIEW_ACCOUNT_EMAIL="review@vibetag.net"
   REVIEW_ACCOUNT_OTP="742916"        # 6 haneli, kendin seç
   ```
3. Bu e-posta + şifre + sabit kodu her iki mağazanın "review notes" alanına
   yaz. Sadece bu hesap bu kodla girebilir; ikisi de boşsa bu yol hiç yok.

## 2 · iOS — ilk derleme ve TestFlight

Mac'te:

```bash
git clone <repo> && cd VibeTag/mobile
npm install
npx cap sync ios
npx cap open ios        # Xcode açılır
```

Xcode'da:
1. **Signing & Capabilities** → Team olarak developer hesabını seç,
   "Automatically manage signing" açık kalsın. Bundle id `net.vibetag.app`
   olarak gelir; Apple hesabında kayıtlı değilse Xcode kendisi kaydeder.
2. Gerçek bir iPhone bağla, çalıştır (▶). Uygulama vibetag.net'i açmalı,
   açılışta krem arka planlı logo görünmeli.
3. **Product → Archive** → "Distribute App" → App Store Connect → Upload.

App Store Connect'te ([appstoreconnect.apple.com](https://appstoreconnect.apple.com)):
1. **My Apps → + → New App**: platform iOS, isim "Vibe Tag", dil Türkçe,
   bundle id `net.vibetag.app`, SKU `vibetag`.
2. Yüklenen build TestFlight'ta belirir (işlenmesi ~15 dk). Önce kendi
   telefonunda TestFlight ile kullan — mağazaya bundan sonra geç.

## 3 · Android — ilk derleme ve kapalı test

Mac'te:

```bash
cd VibeTag/mobile
npx cap sync android
npx cap open android    # Android Studio açılır
```

1. **Build → Generate Signed Bundle** → yeni bir keystore oluştur.
   ⚠️ Keystore dosyasını ve şifresini yedekle — kaybı, uygulamayı bir daha
   asla güncelleyememek demek. (Play "app signing by Google" devralır ama
   upload key yine sende.)
2. Çıkan `.aab` dosyasını Play Console → yeni uygulama → Internal testing'e
   yükle.
3. **Yeni kişisel hesap kuralı:** Üretime çıkmadan önce Play, 12+ testçiyle
   14 gün kesintisiz kapalı test ister. Testçi e-postalarını (arkadaşlar)
   Internal/Closed testing listesine ekle ve süreyi bekletmeye şimdiden
   başla — takvimdeki en uzun bekleme bu.

## 4 · Mağaza formları — cevaplar hazır

### Gizlilik / veri güvenliği formu (ikisinde de aynı öz)

Topladığımız veri, hepsi hesaba bağlı, hiçbiri reklam/izleme için değil:

| Veri | Amaç | Not |
|---|---|---|
| E-posta, isim | Hesap | zorunlu |
| Fotoğraflar | Profil içeriği | kullanıcı yükler |
| Kaba konum | "Yakındakiler" sıralaması | isteğe bağlı, kapatılabilir |
| Mesajlar, değerlendirmeler | Uygulama işlevi | değerlendirmeler anonim |

- "Data used to track you": **hayır** (üçüncü taraf reklam/analitik yok).
- Veriler şifreli aktarılıyor (HTTPS): **evet**. Silme talebi: uygulama
  içinden hesap silme var (Ayarlar) — Apple 5.1.1(v) şartı, karşılanıyor ✅.
- Gizlilik politikası URL'i: `https://vibetag.net/legal/privacy`.

### Yaş sınıflandırması
Sosyal ağ + kullanıcılar arası mesajlaşma → Apple'da 13+ çıkar ("Made for
Kids" değil), Google'ın ankettinde de sosyal/iletişim işaretle.

### İhracat uyumluluğu (Apple)
Sadece HTTPS kullanılıyor → "standard encryption, exempt" seçeneği.

### Giriş yöntemleri
Sadece e-posta/şifre var; üçüncü taraf girişi olmadığı için "Sign in with
Apple" zorunluluğu **doğmuyor**.

## 5 · İnceleme notlarına yazılacaklar

Ret riskini düşüren üç açıklama (İngilizce yaz):

1. **Demo hesap**: e-posta / şifre / sabit OTP (adım 1'dekiler).
2. **Anonimlik tasarım gereği**: "Ratings are anonymous by design; the
   reviewer will see 'Anonymous rater' on rating threads. This is the core
   feature, not a bug."
3. **4.2 (minimum işlevsellik) savunması**: push, konum, kamera erişimli
   gerçek bir sosyal üründüyüz; salt vitrin sitesi değil. Kabuk içinde
   fiyat da gösterilmiyor (aşağıda).

## 6 · Kabukta neler farklı çalışıyor (kod tarafı hazır)

Sunucu `VibeTagShell` user-agent'ını görünce:
- Üyelik ekranında **fiyatlar gizlenir** ve indirim kodu kutusu kalkar —
  Apple 3.1.1: satın alma butonu olmayan fiyat gösterimi ret sebebi.
  IAP entegre olunca bu bölüm satın alma ekranına dönüşecek.
- Geri kalan her şey web ile birebir aynı.

## 7 · Faz 2 — satın almalar (uygulamalar yayında olduktan sonra)

Sunucu altyapısı hazır ve uyuyor; sırası gelince:

1. İki mağazada da abonelikleri **tam olarak şu ürün kimlikleriyle** oluştur
   (`src/lib/store-products.ts` ile sözleşme):
   `net.vibetag.silver.monthly` · `net.vibetag.silver.yearly` ·
   `net.vibetag.gold.monthly` · `net.vibetag.gold.yearly`
2. Sunucu `.env`'ine `APPLE_*`, `GOOGLE_PLAY_*`, `STORE_WEBHOOK_KEY`
   değerlerini gir (`.env.example`'da tek tek açıklandı).
3. Webhook URL'leri: Apple → `https://vibetag.net/api/store/apple?key=…`,
   Google (Pub/Sub push) → `https://vibetag.net/api/store/google?key=…`.
4. Kabuğa IAP eklentisi (`@revenuecat/purchases-capacitor` veya
   `cordova-plugin-purchase`) + üyelik ekranına satın alma butonları — bu
   kısım benim işim, sırası gelince söyle.

Faz 2'nin diğer parçası **gerçek push bildirimleri**: web push WKWebView'da
çalışmaz; APNs/FCM için kabuğa `@capacitor/push-notifications` + sunucuya
küçük bir ekleme gerekir. O da bende.

## 8 · Görseller

- Uygulama ikonu ve açılış ekranları her boyutta üretildi
  (`mobile/assets/` kaynak, native projelere işlenmiş hâlde).
- Ekran görüntüleri: iPhone'da (6.7" — 1290×2796) ve bir Android'de
  uygulamayı gezip 4–6 ekran çek: Ana ekran (Vibe kartı), bir profil,
  değerlendirme akışı, Vibe Card paylaşımı, rozetler. İkisi TR ikisi EN
  olabilir. Store listing metinlerini istediğinde ben yazarım.

---

## Sıra önerisi

1. Play Console hesabını aç ($25) → kapalı test saatini başlatmak için.
2. Adım 1'deki inceleme hesabını kur.
3. Mac'te iOS derle → TestFlight'ta kendin kullan.
4. Android derle → Internal testing + 12 testçi.
5. Formları doldur (cevaplar yukarıda) → iOS incelemeye gönder.
6. Play'in 14 günü dolunca Android üretime.

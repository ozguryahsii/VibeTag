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

## 1 · İnceleme hesabı — ✅ **kuruldu (v2.13, 2026-08-24)**

İncelemeciler bizim e-postamızı okuyamaz; zorunlu OTP = otomatik ret. Bu yüzden
tek bir hesabın sabit bir kodla girebildiği bir kapı var (`src/lib/otp.ts`).
Hesap açıldı, sunucudaki `.env`'e `REVIEW_ACCOUNT_EMAIL` ve
`REVIEW_ACCOUNT_OTP` girildi ve giriş **gerçek bir denemeyle doğrulandı**.

Deploy bu değerleri silmez — `.env` sunucuda duruyor, build'den etkilenmiyor.

Geriye kalan tek iş: bu e-posta + şifre + sabit kodu App Store Connect'teki
**App Review Information** alanına (Play tarafında da "review notes") yazmak.
Değerler sunucudaki `.env` dosyasında.

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

### Yaş sınıflandırması — **18+**
Kullanım Koşulları ve KVKK metinleri "Hizmet yalnızca 18+ içindir" diyor, kayıt
ekranındaki onay kutusu da 18 yaş beyanı alıyor. Mağaza formundaki cevap bununla
**aynı** olmak zorunda: anketi doldururken kullanıcı üretimi içerik, kontrolsüz
kullanıcılar arası mesajlaşma ve moderasyonsuz profil içeriği sorularına dürüst
cevap ver — sonuç 18+ çıkar. "Made for Kids" **hayır**.

Buradaki tek gerçek risk tutarsızlık: metinlerde 18+ deyip formda 13+ işaretlemek,
incelemecinin gördüğü ilk çelişki olur.

### Apple 1.2 — kullanıcı üretimi içerik şartları
UGC barındıran her uygulamadan istenen dört şey; dördü de kodda var, incelemeciye
nerede olduklarını yazmak yeterli:

| Şart | Nerede |
|---|---|
| Uygunsuz içeriği süzme | Moderasyon kuyruğu (`/moderation`), admin hesabı |
| İçerik/kullanıcı şikâyeti | Değerlendirme, sohbet ve profil üzerinden şikâyet (`Report`) |
| Kötüye kullanan kullanıcıyı engelleme | Ayarlar → Engellenenler, profilden engelle |
| Yayımlanmış iletişim bilgisi | `/legal/privacy` içinde ad, adres ve destek e-postası |

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

## 7b · Push bildirimleri — kod tarafı **hazır**, senden iki şey gerekiyor

Web push WKWebView içinde çalışmaz (Apple yalnızca Safari'de ve ana ekrana
eklenmiş PWA'da destekliyor). Bu yüzden uygulama içindeki bildirim yolu APNs.
Yapılanlar:

- Kabukta `@capacitor/push-notifications` kurulu, `AppDelegate.swift` cihaz
  token'ını Capacitor'a aktarıyor (bu iki metot olmadan `register()` sessizce
  hiçbir şey döndürmez).
- Sunucuda `DeviceToken` tablosu, `POST /api/push/device` ucu ve `lib/apns.ts`
  gönderimi var. Kimlik bilgileri yoksa katman tamamen atıl — tıpkı VAPID'siz
  web push gibi.
- Ayarlar → Bildirimler bölümü kabuk içinde native anahtarı gösteriyor. İzin
  **açılışta değil, dokununca** isteniyor: iOS uygulamaya bir kez sorma hakkı
  verir, beklenmedik bir izin penceresi o hakkı "hayır"a harcar.

**Senden gereken 1 — Xcode'da yetenek.** Xcode → App hedefi → Signing &
Capabilities → **+ Capability → Push Notifications**. Tek tık; bu olmadan
imzalama entitlement'ı oluşmaz ve `register()` hata döner.

**Senden gereken 2 — APNs anahtarı.** developer.apple.com → Certificates,
Identifiers & Profiles → Keys → **+** → "Apple Push Notifications service
(APNs)". İnen `AuthKey_XXXX.p8` dosyası **yalnızca bir kez** indirilebilir,
sakla. Sunucudaki `.env`'e:

```
APNS_KEY_P8="<base64 -w0 AuthKey_XXXXXXXXXX.p8 çıktısı — tek satır>"
APNS_KEY_ID="ABCD123456"      # anahtarın yanında yazan 10 karakter
APNS_TEAM_ID="XYZ7890123"     # hesap sayfasındaki takım kimliği
APNS_BUNDLE_ID="net.vibetag.app"
APNS_ENV="sandbox"            # Xcode'dan kablolu telefonda test ederken
```

`.p8` çok satırlı bir dosya ve çok satırlı değerler `.env` ayrıştırıcılarında
sık sık bozulur — bozulunca da hata "anahtar yanlış" gibi görünür. Bu yüzden
`APNS_KEY_P8` üç biçimi de kabul ediyor: dosyanın kendisi, satır sonları
`\n` olarak düzleştirilmiş hâli, ve **base64'ü**. Sunucuda base64 kullan.

`APNS_ENV` önemli: Xcode'dan çalıştırdığın derlemenin token'ı **sandbox**,
TestFlight ve App Store derlemelerininki **production**. Yanlış olanına
gönderirsen Apple 400 döner ve bu hata bozuk anahtar gibi görünür.

**Android tarafı henüz bağlı değil.** FCM için Firebase projesi ve
`google-services.json` gerekiyor; token'lar yine de kaydediliyor, böylece
Firebase eklendiğinde bu bir gönderim değişikliği olacak, "tüm Android
kullanıcıları bildirimleri yeniden açsın" değil.

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

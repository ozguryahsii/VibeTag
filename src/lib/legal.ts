import type { Locale } from "@/lib/i18n/config";

/**
 * Privacy, KVKK and terms texts.
 *
 * These are drafts written from what the code actually does — every claim
 * below can be traced to a table in `schema.prisma` or a check in `src/lib`.
 * That is the part worth having early: a policy that describes a different
 * product than the one shipped is worse than none.
 *
 * They are **not** legal advice and have not been reviewed by a lawyer. The
 * page renders a standing notice saying so, and it should stay there until
 * counsel has signed the texts off. In particular: the liability-limitation
 * and indemnity clauses below are written "to the extent mandatory law
 * allows" on purpose — consumer-protection and data-protection duties cannot
 * be contracted away, and a clause that pretends otherwise is the first
 * thing a court strikes, taking credibility with it.
 *
 * When the product changes, these change with it. The rule of thumb: if a new
 * column stores something about a person, it belongs in the data list below.
 */

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string[]; list?: string[] }[];
};

export const LEGAL_SLUGS = ["privacy", "kvkk", "terms"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(v: unknown): v is LegalSlug {
  return typeof v === "string" && (LEGAL_SLUGS as readonly string[]).includes(v);
}

const UPDATED = "2026-08-20";

// ------------------------------------------------------------------ Turkish

const trPrivacy: LegalDoc = {
  slug: "privacy",
  title: "Gizlilik Politikası",
  updated: UPDATED,
  intro:
    "Vibe Tag, insanların birbirinde gördüğü olumlu özellikleri paylaştığı bir uygulamadır. Bu metin, hangi verileri neden tuttuğumuzu ve onlarla ne yapıp ne yapmadığımızı anlatır.",
  sections: [
    {
      heading: "Topladığımız veriler",
      body: [
        "Yalnızca uygulamanın çalışması için gereken verileri tutarız. Bunlar:",
      ],
      list: [
        "Hesap bilgileri: ad, kullanıcı adı, e-posta, şifrenin geri döndürülemez özeti (scrypt), varsa biyografi ve profil fotoğrafı. Fotoğraflar cihazında kırpılır, JPEG'e çevrilir ve öyle saklanır.",
        "E-posta doğrulama: doğrulama kodlarının geri döndürülemez özeti. Kod 10 dakika içinde geçersizleşir ve kullanılmış kodlar düzenli olarak silinir.",
        "Değerlendirmeler: verdiğin ve aldığın puanlar, seçtiğin Vibe Tag'ler, notlar, tanışıklık türü ve her güncellemenin önceki sürümü.",
        "Üyelik: planın, planının varsa bitiş tarihi, kullandığın indirim kodları ve — mağaza satın alımı yaptıysan — aboneliğin ürün adı, durumu ve bitiş tarihi. Kart ve ödeme bilgisi bize hiçbir zaman ulaşmaz; ödemeyi App Store veya Google Play işler.",
        "Konum: yalnızca “Yakınındakiler” özelliğini açarsan. Konumun yaklaşık 100 metreye yuvarlanarak saklanır ve sadece listeyi mesafeye göre sıralamak için kullanılır. Varsayılan kapalıdır ve istediğin an kapatabilirsin.",
        "Mesajlar ve bildirimler: gönderdiğin ve aldığın doğrudan mesajlar, uygulama içi bildirimlerin ve — açtıysan — tarayıcının anlık bildirim adresi.",
        "Çerezler: tarayıcında tutulan bir oturum çerezi (httpOnly) ve dil tercihini saklayan bir çerez. Reklam veya takip çerezi kullanmıyoruz.",
        "Güvenlik kayıtları: giriş, kayıt ve kod isteklerinde IP adresi (istek sınırlaması için, saatler içinde silinir) ve sunucu hata kayıtları (30 gün içinde silinir).",
      ],
    },
    {
      heading: "Değerlendirmeler ve anonimlik",
      body: [
        "Değerlendirmeler arayüzde hiçbir zaman kişiye bağlanarak gösterilmez. Veritabanında kimin kimi değerlendirdiği kayıtlıdır — sahtecilik tespiti, itiraz ve kötüye kullanım incelemesi bunu gerektirir.",
        "Gold üyelik, kendisini değerlendirenlerin kimliğini görme imkânı verir. Değerlendiren kişi bunu engelleyemez; kimliğin görünürlüğü değerlendirilen kişinin üyeliğine bağlıdır. İstisna: sahtecilik tespitinin korumaya aldığı değerlendirmeler — ve geçmişte “kimliğimi gizle” seçeneği varken o seçenekle verilmiş değerlendirmeler — hiçbir üyelikte görünmez.",
      ],
    },
    {
      heading: "Verileri neden işliyoruz",
      body: [
        "Hesabını oluşturmak, e-postanı doğrulamak ve oturumunu sürdürmek; profilini ve puanını hesaplamak; sahte değerlendirmeleri tespit etmek; bildirimleri iletmek; üyelik ve ödeme durumunu yönetmek; kötüye kullanım bildirimlerini incelemek; hizmeti güvende tutmak. Bunların dışında bir amaç için kullanmıyoruz.",
      ],
    },
    {
      heading: "Hizmet sağlayıcılar",
      body: [
        "Verilerini satmıyoruz, reklam için üçüncü taraflarla paylaşmıyoruz ve profilleme amaçlı veri simsarlarına aktarmıyoruz. Hizmeti çalıştırmak için sınırlı sayıda sağlayıcı kullanıyoruz:",
      ],
      list: [
        "Barındırma: uygulama ve veritabanı kendi sunucumuzda çalışır.",
        "E-posta iletimi (Resend): doğrulama ve şifre sıfırlama e-postalarını iletmek için adın ve e-posta adresin bu sağlayıcıya iletilir; sunucuları yurt dışında olabilir.",
        "Trafik altyapısı (Cloudflare): siteye erişim bu ağ üzerinden geçer.",
        "Ödeme (App Store / Google Play): mağaza üzerinden satın alım yaparsan ödemeyi ilgili mağaza işler; bize yalnızca aboneliğin durumu iletilir.",
        "Yasal bir zorunluluk doğmadıkça bunların dışında hiçbir veriyi dışarı vermeyiz.",
      ],
    },
    {
      heading: "Saklama süresi",
      body: [
        "Hesabın açık olduğu sürece verilerini saklarız. Hesabını sildiğinde profilin, verdiğin ve aldığın tüm değerlendirmeler, davetlerin, mesajların ve bildirimlerin kalıcı olarak silinir.",
        "İstisnalar: moderasyon kararıyla kaldırılan değerlendirmeler silinmez, gizlenir — geri bakılamayan bir karar itiraz edilemez bir karardır. Sunucu hata kayıtları 30 gün, istek sınırlama kayıtları saatler içinde kendiliğinden silinir. Yedekler düzenli olarak alınır ve yaklaşık 30 gün içinde dönüşümlü olarak imha edilir; silinen bir hesap en geç yedeklerin dolaşımından çıktığında tamamen yok olur.",
      ],
    },
    {
      heading: "Güvenlik",
      body: [
        "Şifreler geri döndürülemez biçimde (scrypt, kullanıcıya özel tuz ile) saklanır; düz metin şifre hiçbir yerde tutulmaz. Oturum çerezi httpOnly'dir ve tarayıcıdaki JavaScript tarafından okunamaz. Tüm trafik TLS ile şifrelenir. Giriş ve kod ekranları istek sınırlamasıyla korunur.",
      ],
    },
    {
      heading: "Bize ulaş",
      body: [
        "Gizlilikle ilgili her soru için {email} adresine yazabilirsin.",
      ],
    },
  ],
};

const trKvkk: LegalDoc = {
  slug: "kvkk",
  title: "KVKK Aydınlatma Metni",
  updated: UPDATED,
  intro:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, veri sorumlusu sıfatıyla seni bilgilendirmek isteriz.",
  sections: [
    {
      heading: "Veri sorumlusu",
      body: [
        "Vibe Tag. İletişim: {email}. (Ticari unvan, adres ve varsa VERBİS kaydı yayına çıkmadan önce bu bölüme eklenecektir.)",
      ],
    },
    {
      heading: "İşlenen kişisel veriler",
      body: [
        "Aşağıdaki kategorilerde kişisel veri işlenir:",
      ],
      list: [
        "Kimlik: ad, kullanıcı adı.",
        "İletişim: e-posta adresi.",
        "Kullanıcı işlem: verdiğin ve aldığın değerlendirmeler ve önceki sürümleri, mesajlar, davetler, bildirimler, arkadaşlık ve engelleme kayıtları.",
        "Müşteri işlem: üyelik planı ve bitiş tarihi, indirim kodu kullanımları, mağaza aboneliğinin ürünü, durumu ve bitiş tarihi. Ödeme aracı bilgisi işlenmez.",
        "İşlem güvenliği: oturum kayıtları, istek sınırlama amaçlı IP adresi, e-posta doğrulama kodlarının özeti, sunucu hata kayıtları, çerezler.",
        "Konum: yaklaşık (~100 m) konum — yalnızca “Yakınındakiler” özelliğini açtıysan.",
        "Görsel: yüklediysen profil fotoğrafın.",
      ],
    },
    {
      heading: "İşleme amaçları",
      body: [
        "Üyelik sözleşmesinin kurulması ve ifası, üyeliğin e-posta ile doğrulanması, hizmetin sunulması, sosyal itibar profilinin hesaplanması, sahte değerlendirmelerin tespiti, üyelik ve ödeme durumunun yönetilmesi, güvenliğin sağlanması, kötüye kullanım bildirimlerinin incelenmesi ve hukuki yükümlülüklerin yerine getirilmesi.",
      ],
    },
    {
      heading: "Hukuki sebep",
      body: [
        "Kimlik, iletişim, kullanıcı işlem ve müşteri işlem verileri KVKK m.5/2-c uyarınca sözleşmenin kurulması ve ifası için gerekli olduğundan; işlem güvenliği verileri m.5/2-f uyarınca meşru menfaat ve m.5/2-ç uyarınca hukuki yükümlülük kapsamında işlenir.",
        "Konum verisi yalnızca KVKK m.5/1 uyarınca açık rızana dayanır. Rızanı vermemen hizmetin diğer bölümlerini etkilemez; “Yakınındakiler” özelliği kapalı kalır. Rızanı istediğin an Kişiler ekranından geri çekebilirsin.",
      ],
    },
    {
      heading: "Aktarım",
      body: [
        "Kişisel verilerin pazarlama amacıyla üçüncü kişilere aktarılmaz. Hizmetin sunulması için sınırlı aktarım yapılır: doğrulama ve şifre sıfırlama e-postalarının iletilmesi için ad ve e-posta adresi, sunucuları yurt dışında bulunabilen e-posta iletim sağlayıcısına (Resend); site trafiği, içerik dağıtım ağına (Cloudflare) aktarılır. Yurt dışına aktarım, KVKK m.9 kapsamındaki şartlara uygun olarak yürütülür.",
        "Mağaza üzerinden satın alım yapılması hâlinde ödeme, ilgili mağaza (Apple / Google) tarafından kendi sözleşmesi kapsamında işlenir; tarafımıza yalnızca aboneliğin durumu iletilir. Yasal talep hâlinde yetkili kamu kurumlarına aktarım saklıdır.",
      ],
    },
    {
      heading: "Saklama ve imha",
      body: [
        "Veriler üyelik süresince saklanır; hesabın silinmesiyle kalıcı olarak imha edilir. Moderasyon kararıyla gizlenen değerlendirmeler itiraz hakkının kullanılabilmesi için saklanır. Sunucu hata kayıtları 30 gün, istek sınırlama kayıtları saatler içinde imha edilir. Yedekler yaklaşık 30 günlük dönüşümle imha edilir.",
      ],
    },
    {
      heading: "Hakların (KVKK m.11)",
      body: [
        "Kişisel verinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme ve zarara uğraman hâlinde zararın giderilmesini talep etme haklarına sahipsin.",
        "Bu haklarını kullanmak için {email} adresine yazabilirsin; başvurular en geç 30 gün içinde yanıtlanır. Hesabını uygulama içinden de kalıcı olarak silebilirsin: Profil → Hesap → Hesabımı sil.",
      ],
    },
  ],
};

const trTerms: LegalDoc = {
  slug: "terms",
  title: "Kullanım Şartları",
  updated: UPDATED,
  intro:
    "Vibe Tag'i kullanarak aşağıdaki şartları kabul etmiş olursun. Kuralların özü tek bir fikir: insanlar hakkında yalnızca gerçekten bildiğin kadarını söylemek.",
  sections: [
    {
      heading: "Üyelik",
      body: [
        "Vibe Tag'i kullanmak için 18 yaşını doldurmuş olman gerekir. Kayıt sırasında verdiğin bilgilerin doğru olduğunu beyan edersin; e-posta adresin doğrulanmadan hesabın açılmaz.",
        "Hesabın sana özeldir ve devredilemez. Şifrenin gizliliğinden ve hesabın üzerinden yapılan her işlemden sen sorumlusun; hesabına izinsiz erişildiğini fark edersen şifreni sıfırlaman ve bize bildirmen gerekir.",
      ],
    },
    {
      heading: "Değerlendirme kuralları",
      body: [
        "Bir kişiyi yalnızca gerçekten tanıdığın bağlamda değerlendirebilirsin. “Bu kişiyi nereden tanıyorsun?” sorusu zorunludur ve hangi kriterleri puanlayabileceğini belirler.",
        "Her kişiyi bir kez değerlendirirsin. Değerlendirmeni ayda bir güncelleyebilirsin; her güncellemede önceki sürüm arşivlenir.",
        "Sahte, intikam amaçlı veya karşılıklı anlaşmayla verilen değerlendirmeler yasaktır. Otomatik tespit sistemi bu tür oyların ağırlığını düşürür ve değerlendirmeyi korumaya alabilir.",
      ],
    },
    {
      heading: "İçerik ve sorumluluk",
      body: [
        "Yazdığın her değerlendirme, not, mesaj ve yüklediğin her görsel senin içeriğindir ve hukuki sorumluluğu yalnızca sana aittir. Vibe Tag, 5651 sayılı Kanun kapsamında yer sağlayıcıdır; kullanıcı içeriklerini önceden denetleme yükümlülüğü yoktur ve içeriğin doğruluğunu garanti etmez.",
        "Hukuka aykırı olduğu bildirilen içerik incelenir ve gerekirse yayından kaldırılır. Bir içeriğin hakkını ihlal ettiğini düşünüyorsan uygulama içinden bildirebilir veya {email} adresine yazabilirsin.",
        "İçeriğini hizmeti sunmak için gereken kapsamda (profillerde ve Vibe Card'da gösterme, puan hesaplama, yedekleme) kullanmamıza izin vermiş olursun. Bunun dışında içeriğin üzerinde hak iddia etmeyiz.",
      ],
    },
    {
      heading: "Notlar ve mesajlar",
      body: [
        "Hakaret, taciz, nefret söylemi, tehdit, başkasının kişisel verisini ifşa ve spam yasaktır. Notlarda telefon numarası, e-posta ve bağlantı paylaşılamaz. Herkes herkesi puanlayabilir; profil sahibi, değerlendirmesine kimlerin yazılı not ekleyebileceğini seçer (herkes ya da yalnızca davet ettikleri ve arkadaşları).",
        "Doğrudan mesajlar yalnızca arkadaşlar arasında açıktır. Premium üyeler kendilerini değerlendirenlere yazabilir; değerlendiren kişi ancak kendisine yazıldıktan sonra cevap verebilir.",
      ],
    },
    {
      heading: "Moderasyon ve fesih",
      body: [
        "Kurallara aykırı bulunan bir değerlendirme puan hesabından çıkarılır. Kurallara aykırı davranan bir hesap uyarı yapılmaksızın askıya alınabilir veya kapatılabilir; bu durumda kullanılmamış üyelik süresi için ücret iadesi yapılmaz.",
        "Kararlar kayıt altına alınır ve içeriğe geri bakılabilir. Hesabın askıya alındıysa {email} adresine yazarak itiraz edebilirsin.",
      ],
    },
    {
      heading: "Engelleme",
      body: [
        "Engellediğin kişi sana yeni değerlendirme yapamaz ve mevcut değerlendirmesini güncelleyemez. Mevcut değerlendirmesi silinmez — aksi hâlde engelleme, düşük puanları temizleme aracına dönerdi. Haksız bulduğun bir değerlendirmeyi bildirebilirsin.",
      ],
    },
    {
      heading: "Üyelik planları ve ödeme",
      body: [
        "Ücretli planlar (Silver, Gold) yalnızca App Store ve Google Play üzerinden, bir indirim kodu ile veya tarafımızca tanımlanarak edinilebilir; web üzerinden satış yapılmaz.",
        "Mağaza üzerinden yapılan satın alımlarda faturalama, yenileme ve iade tamamen ilgili mağazanın (Apple / Google) kendi koşullarına tabidir; iade talepleri mağazaya yapılır. Ödeme bilgilerin bize hiçbir zaman ulaşmaz.",
        "İndirim kodlarının parasal değeri yoktur, devredilemez ve kötüye kullanım hâlinde iptal edilebilir. Plan fiyatları ve kapsamları değişebilir; değişiklik, o ana kadar ödenmiş dönemleri etkilemez.",
        "Aboneliğin sona erdiğinde ücretli özellikler kapanır; verilerin ve profilin durur, silinmez.",
      ],
    },
    {
      heading: "Hizmetin niteliği ve garanti reddi",
      body: [
        "Vibe Tag bir referans kontrol, kredi değerlendirme veya işe alım aracı değildir. Buradaki puanlar insanların öznel görüşlerinin bir özetidir; doğruluğu, güncelliği veya belirli bir amaca uygunluğu garanti edilmez. Puanlara dayanarak verdiğin her karar — ve bu kararların sonuçları — yalnızca sana aittir.",
        "Hizmet “olduğu gibi” sunulur. Kesintisiz, hatasız veya güvenlik açığından arınmış olacağı taahhüt edilmez; bakım, güncelleme veya teknik zorunluluk nedeniyle hizmet geçici olarak durabilir, özellikler değişebilir veya kaldırılabilir.",
      ],
    },
    {
      heading: "Sorumluluğun sınırlandırılması",
      body: [
        "Emredici hukuk kurallarının izin verdiği azami ölçüde: Vibe Tag; kâr kaybı, itibar kaybı, veri kaybı ve dolaylı zararlardan sorumlu tutulamaz. Kullanıcı içeriklerinden, diğer kullanıcıların eylemlerinden ve üçüncü taraf hizmetlerin (e-posta iletimi, mağazalar, altyapı) kesinti veya hatalarından doğan zararlar sorumluluğumuz dışındadır.",
        "Her hâlükârda toplam sorumluluğumuz, zarara yol açan olaydan önceki 12 ay içinde hizmet için fiilen ödediğin tutarla; ücretsiz kullanıyorsan sıfırla sınırlıdır. Tüketicinin korunmasına ilişkin emredici hükümler ile kasıt ve ağır ihmal hâlleri saklıdır.",
      ],
    },
    {
      heading: "Tazminat",
      body: [
        "Bu şartları ihlal etmenden, paylaştığın içerikten veya hizmeti hukuka aykırı kullanmandan doğan üçüncü kişi talepleri, idari yaptırımlar ve makul avukatlık ücretleri dâhil zararları karşılamayı kabul edersin.",
      ],
    },
    {
      heading: "Değişiklikler, uygulanacak hukuk ve yetki",
      body: [
        "Bu şartları güncelleyebiliriz; önemli değişiklikler uygulama içinden duyurulur ve yayımlandığı anda yürürlüğe girer. Değişiklikten sonra hizmeti kullanmaya devam etmen, güncel şartları kabul ettiğin anlamına gelir.",
        "Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir; uyuşmazlıklarda İstanbul mahkemeleri ve icra daireleri yetkilidir. Tüketici işlemlerinde tüketici hakem heyetlerine ve tüketici mahkemelerine başvuru hakkın saklıdır. Şartlardan birinin geçersiz sayılması diğerlerinin geçerliliğini etkilemez.",
      ],
    },
  ],
};

// ------------------------------------------------------------------ English

const enPrivacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  updated: UPDATED,
  intro:
    "Vibe Tag is an app where people share the good things they see in each other. This explains what we keep, why, and what we do not do with it.",
  sections: [
    {
      heading: "What we collect",
      body: ["Only what the app needs to work:"],
      list: [
        "Account: name, username, email, an irreversible hash of your password (scrypt), and your bio and photo if you add them. Photos are cropped on your device, converted to JPEG and stored that way.",
        "Email verification: an irreversible hash of the verification codes. A code dies within 10 minutes, and used codes are pruned regularly.",
        "Ratings: the scores you give and receive, the Vibe Tags chosen, notes, how you know each other, and the previous version of every update.",
        "Membership: your plan, its end date if it has one, the discount codes you redeemed and — if you bought through a store — the subscription's product, status and expiry. Card and payment details never reach us; the App Store or Google Play processes the payment.",
        "Location: only if you turn on Nearby. It is rounded to roughly 100 metres before it is stored and is used solely to sort a list by distance. Off by default, and you can turn it off at any time.",
        "Messages and notifications: the direct messages you send and receive, your in-app notifications and — if you enabled them — your browser's push endpoint.",
        "Cookies: a session cookie (httpOnly) and one holding your language choice. No advertising or tracking cookies.",
        "Security records: the IP address on sign-in, registration and code requests (for rate limiting, deleted within hours) and server error logs (deleted within 30 days).",
      ],
    },
    {
      heading: "Ratings and anonymity",
      body: [
        "Ratings are never shown attributed to a person in the interface. The database does record who rated whom — fraud detection, appeals and abuse review all require it.",
        "Gold membership reveals who rated you. The rater cannot prevent that — visibility follows the rated person's plan. The exceptions: ratings the fraud detector has protected, and ratings written back when a “hide my identity” option existed. Neither is visible on any plan.",
      ],
    },
    {
      heading: "Why we process it",
      body: [
        "To create your account, verify your email and keep you signed in; to build your profile and score; to detect fake ratings; to deliver notifications; to manage your membership and payment state; to review abuse reports; and to keep the service safe. Nothing else.",
      ],
    },
    {
      heading: "Service providers",
      body: [
        "We do not sell your data, share it with advertisers, or pass it to data brokers. A small number of providers run parts of the service:",
      ],
      list: [
        "Hosting: the app and database run on our own server.",
        "Email delivery (Resend): your name and email address are passed to this provider to deliver verification and password-reset emails; its servers may be located abroad.",
        "Traffic (Cloudflare): access to the site passes through this network.",
        "Payments (App Store / Google Play): if you buy through a store, the store processes the payment; we only receive the subscription's status.",
        "Nothing else leaves the service unless the law requires it.",
      ],
    },
    {
      heading: "Retention",
      body: [
        "We keep your data while your account exists. Deleting your account permanently removes your profile, every rating you gave and received, your invites, messages and notifications.",
        "Exceptions: a rating removed by moderation is hidden, not deleted — a decision nobody can look at again is a decision nobody can appeal. Server error logs live 30 days; rate-limit records, hours. Backups rotate on roughly a 30-day cycle, so a deleted account is fully gone once the last backup holding it expires.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Passwords are stored irreversibly (scrypt, with a per-user salt); no plaintext password is kept anywhere. The session cookie is httpOnly and cannot be read by JavaScript in the browser. All traffic is TLS-encrypted. Sign-in and code screens are rate-limited.",
      ],
    },
    {
      heading: "Contact",
      body: ["Write to {email} with any privacy question."],
    },
  ],
};

const enKvkk: LegalDoc = {
  slug: "kvkk",
  title: "Data Protection Notice (KVKK)",
  updated: UPDATED,
  intro:
    "Vibe Tag operates under Turkey's Personal Data Protection Law No. 6698 (KVKK). This is the English rendering of the Turkish notice, which governs.",
  sections: [
    {
      heading: "Data controller",
      body: [
        "Vibe Tag. Contact: {email}. (Legal entity name, address and VERBİS registration will be added here before launch.)",
      ],
    },
    {
      heading: "Categories of personal data",
      body: ["The following categories are processed:"],
      list: [
        "Identity: name, username.",
        "Contact: email address.",
        "Usage: ratings given and received with their revisions, messages, invites, notifications, friendship and block records.",
        "Transactions: membership plan and its end date, discount-code redemptions, store subscription product, status and expiry. No payment-instrument data is processed.",
        "Operational security: session records, IP addresses used for rate limiting, hashes of email verification codes, server error logs, cookies.",
        "Location: approximate (~100 m) position, only if you enabled Nearby.",
        "Image: your profile photo, if you uploaded one.",
      ],
    },
    {
      heading: "Purposes",
      body: [
        "Forming and performing the membership agreement, verifying membership by email, providing the service, computing your reputation profile, detecting fake ratings, managing membership and payment state, keeping the service safe, reviewing abuse reports, and meeting legal obligations.",
      ],
    },
    {
      heading: "Legal basis",
      body: [
        "Identity, contact, usage and transaction data are processed under Art. 5/2-c (necessary for a contract). Operational security data rests on Art. 5/2-f (legitimate interest) and Art. 5/2-ç (legal obligation).",
        "Location data rests solely on your explicit consent under Art. 5/1. Withholding it affects nothing else — Nearby simply stays off — and you can withdraw it any time from the People screen.",
      ],
    },
    {
      heading: "Transfers",
      body: [
        "Your data is not transferred to third parties for marketing. Limited transfers exist to run the service: name and email address go to the email delivery provider (Resend), whose servers may be located abroad, to deliver verification and password-reset emails; site traffic passes through a content delivery network (Cloudflare). Cross-border transfers are conducted in line with the conditions of Art. 9 KVKK.",
        "If you purchase through a store, the payment is processed by that store (Apple / Google) under its own terms; we only receive the subscription's status. Disclosure to competent authorities on a lawful request is reserved.",
      ],
    },
    {
      heading: "Retention and destruction",
      body: [
        "Data is kept for the life of the membership and permanently destroyed when the account is deleted. Ratings hidden by moderation are retained so the right to appeal stays real. Server error logs are destroyed within 30 days, rate-limit records within hours, and backups on roughly a 30-day rotation.",
      ],
    },
    {
      heading: "Your rights (Art. 11)",
      body: [
        "You may learn whether your data is processed and request information about it, learn the purpose and whether it is used accordingly, request correction of incomplete or inaccurate data, request erasure or destruction, request that these be notified to third parties the data was transferred to, object to a result reached solely by automated analysis, and claim compensation for damage.",
        "Write to {email} to exercise these; requests are answered within 30 days at the latest. You can also delete your account permanently in the app: Profile → Account → Delete my account.",
      ],
    },
  ],
};

const enTerms: LegalDoc = {
  slug: "terms",
  title: "Terms of Use",
  updated: UPDATED,
  intro:
    "Using Vibe Tag means accepting the terms below. The heart of the rules is one idea: say only as much about a person as you actually know.",
  sections: [
    {
      heading: "Membership",
      body: [
        "You must be at least 18 to use Vibe Tag. You confirm that the information you give at registration is accurate; an account does not open until its email address is verified.",
        "Your account is personal and non-transferable. You are responsible for keeping your password secret and for everything done through your account; if you notice unauthorised access, reset your password and tell us.",
      ],
    },
    {
      heading: "Rating rules",
      body: [
        "You may rate someone only in the context you actually know them from. “How do you know this person?” is mandatory and decides which criteria you can score.",
        "You rate each person once. You may revise it once a month; every revision archives the previous version.",
        "Fake ratings, revenge ratings and arranged reciprocal ratings are prohibited. Automatic detection reduces the weight of such votes and may place a rating under protection.",
      ],
    },
    {
      heading: "Content and responsibility",
      body: [
        "Every rating, note, message and image you post is your content, and legal responsibility for it is yours alone. Vibe Tag acts as a hosting provider under Turkish Law No. 5651; it has no obligation to pre-screen user content and does not guarantee its accuracy.",
        "Content reported as unlawful is reviewed and removed where warranted. If you believe content violates your rights, report it in the app or write to {email}.",
        "You allow us to use your content to the extent needed to run the service — showing it on profiles and Vibe Cards, computing scores, keeping backups. We claim nothing beyond that.",
      ],
    },
    {
      heading: "Notes and messages",
      body: [
        "Insults, harassment, hate speech, threats, exposing someone's personal data, and spam are prohibited. Notes may not contain phone numbers, email addresses or links. Anyone may rate anyone; each profile owner chooses who may add a written note to a rating (everyone, or only the people they invited and their friends).",
        "Direct messages are open between friends. Premium members may write to people who rated them; the rater may only reply once written to.",
      ],
    },
    {
      heading: "Moderation and termination",
      body: [
        "A rating found to break the rules stops counting towards scores. An account that breaks the rules may be suspended or closed without prior warning; no refund is made for unused membership time in that case.",
        "Decisions are recorded and the content remains reviewable. If your account is suspended you can appeal by writing to {email}.",
      ],
    },
    {
      heading: "Blocking",
      body: [
        "Someone you block cannot rate you again or revise an existing rating. Their existing rating is not deleted — otherwise blocking would become a way to erase low scores. Report a rating you believe is unfair.",
      ],
    },
    {
      heading: "Plans and payment",
      body: [
        "Paid plans (Silver, Gold) can be obtained only through the App Store and Google Play, with a discount code, or by a grant from us; there is no web checkout.",
        "For store purchases, billing, renewal and refunds are governed entirely by the store's (Apple's / Google's) own terms; refund requests go to the store. Your payment details never reach us.",
        "Discount codes have no cash value, are non-transferable and may be cancelled on abuse. Plan prices and contents may change; changes do not affect periods already paid for.",
        "When a subscription ends, paid features close; your data and profile remain as they are, undeleted.",
      ],
    },
    {
      heading: "Nature of the service; no warranty",
      body: [
        "Vibe Tag is not a reference check, a credit score or a hiring tool. The numbers here summarise subjective human opinion; their accuracy, currency and fitness for any purpose are not guaranteed. Every decision you make relying on them — and its consequences — is yours alone.",
        "The service is provided “as is”. We do not promise it will be uninterrupted, error-free or free of vulnerabilities; it may pause for maintenance, and features may change or be withdrawn.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the maximum extent mandatory law allows: Vibe Tag is not liable for lost profits, reputational harm, lost data or indirect damage. Damage arising from user content, from other users' actions, or from third-party services (email delivery, the stores, infrastructure) failing or pausing is outside our responsibility.",
        "In every case our total liability is capped at what you actually paid for the service in the 12 months before the event — zero if you use it free. Mandatory consumer-protection rules, intent and gross negligence are excepted.",
      ],
    },
    {
      heading: "Indemnity",
      body: [
        "You agree to cover damages — including third-party claims, administrative fines and reasonable attorney fees — arising from your breach of these terms, the content you post, or unlawful use of the service.",
      ],
    },
    {
      heading: "Changes, governing law and venue",
      body: [
        "We may update these terms; material changes are announced in the app and take effect on publication. Continuing to use the service after a change means accepting the current terms.",
        "These terms are governed by the law of the Republic of Türkiye; the courts and enforcement offices of Istanbul have jurisdiction. Your right to apply to consumer arbitration boards and consumer courts is reserved. If one clause is held invalid, the rest stand.",
      ],
    },
  ],
};

const DOCS: Record<Locale, Record<LegalSlug, LegalDoc>> = {
  tr: { privacy: trPrivacy, kvkk: trKvkk, terms: trTerms },
  en: { privacy: enPrivacy, kvkk: enKvkk, terms: enTerms },
};

export function legalDoc(slug: LegalSlug, locale: Locale): LegalDoc {
  return DOCS[locale][slug];
}

export function legalIndex(locale: Locale): LegalDoc[] {
  return LEGAL_SLUGS.map((s) => DOCS[locale][s]);
}

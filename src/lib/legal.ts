import type { Locale } from "@/lib/i18n/config";

/**
 * Privacy, KVKK and terms texts.
 *
 * Reviewed by counsel on 2026-08-24 (see docs/legal.md for the export that
 * went to them and their cover notes). The text below follows their revision
 * closely — structure, legal bases, the ABD/DSA sections, the breach and
 * automation language are theirs, not a paraphrase.
 *
 * **In force from 2026-08-25.** Every blank is filled: who operates the
 * service, where notice reaches him, which courts hear a non-consumer
 * dispute, the liability ceiling for use nobody paid for, and that there is
 * no MERSİS number, no KEP address and no VERBİS registration to cite. Every
 * request goes to one mailbox. The standing draft notice that used to sit
 * above these texts is gone with the last bracket.
 *
 * No GDPR art. 27 representative is named, and that is a decision rather than
 * an omission. The apps ship worldwide, so the obligation is arguably live;
 * Özgür chose on 2026-08-25 not to appoint one for launch, having been told
 * plainly what art. 27 requires and what the alternatives were. What the text
 * must never do is paper over that — a policy naming a representative who
 * does not exist would be a false statement made to exactly the people it is
 * written for. So the sentence is gone rather than filled with a fiction, and
 * EU/EEA requests are pointed at the mailbox that genuinely answers them. If
 * a representative is ever appointed, the sentence comes back with a real
 * name in it.
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

export const LEGAL_SLUGS = ["privacy", "kvkk", "terms", "child-safety"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(v: unknown): v is LegalSlug {
  return typeof v === "string" && (LEGAL_SLUGS as readonly string[]).includes(v);
}

/**
 * Who operates Vibe Tag, for the clauses that have to name an operator.
 *
 * A sole trader, not a company: this is a person's own name, and the address
 * is one that can receive legal notice rather than a registered office. KVKK
 * art. 10 makes publishing both unavoidable — an app cannot tell people who
 * holds their data and then withhold where to reach him.
 *
 * Constants because each of these appears five times across three documents
 * in two languages, and the only thing worse than a missing address is two
 * different ones.
 */
export const OPERATOR_NAME = "Özgür Adnan Yahşi";
export const OPERATOR_ADDRESS =
  "Şeker Mah. Ordu Cad. No: 7 FA, Alpullu, Babaeski / Kırklareli";

/**
 * Venue for non-consumer disputes only. A consumer keeps the forum the law
 * gives them — their own place of residence — and the clause says so; this
 * city never overrides that.
 */
export const VENUE_CITY = "Ankara";

/**
 * The liability ceiling for use that was never paid for.
 *
 * A zero cap is not an option: under TBK art. 115 a clause excluding
 * liability for intent or gross negligence is void outright, and a consumer
 * clause that excludes all liability is an unfair term — struck out entirely,
 * leaving *unlimited* liability behind it. A modest stated figure is the
 * safer instrument, not the riskier one.
 *
 * Per person, not per account. Opening a second account is a thing anyone can
 * do in a minute; if the cap attached to accounts it would multiply by
 * whatever number somebody felt like registering, which is the same as having
 * no cap at all.
 */
export const FREE_TIER_LIABILITY_CAP_TR = "1.000 TL";
export const FREE_TIER_LIABILITY_CAP_EN = "TRY 1,000";

const UPDATED = "2026-08-25";

// ------------------------------------------------------------------ Turkish

const trPrivacy: LegalDoc = {
  slug: "privacy",
  title: "Gizlilik Politikası",
  updated: UPDATED,
  intro:
    "Vibe Tag reklam amaçlı veri satmaz. Hizmet, güvenlik, moderasyon ve yasal yükümlülükler için gerekli verileri işler. Hakkındaki değerlendirmeler başkaları tarafından oluşturulabilir. Gold üyelik, aşağıdaki istisnalar dışında değerlendirenin kimliğini değerlendirilen kullanıcıya gösterebilir.",
  sections: [
    {
      heading: "Kimiz ve kapsam",
      body: [
        `Bu politika, ${OPERATOR_NAME} (“Vibe Tag”, “biz”) tarafından sunulan Vibe Tag uygulaması ve bağlantılı hizmetlerde kişisel verilerin işlenmesini açıklar. Veri sorumlusu/işletmeci, gerçek kişi olarak ${OPERATOR_NAME}’dir; adres: ${OPERATOR_ADDRESS}; gizlilik: {email}; içerik bildirimleri: {email}. Veri sorumlusunun MERSİS ve VERBİS kaydı ile KEP adresi bulunmamaktadır. AB/AEA'da yerleşik kullanıcılar dâhil tüm veri sahibi talepleri doğrudan {email} adresinden karşılanır.`,
        "App Store, Google Play ve bağlantı verilen bağımsız hizmetlerin kendi veri uygulamaları bu politikanın dışındadır.",
      ],
    },
    {
      heading: "Topladığımız veriler ve kaynaklar",
      body: [],
      list: [
        "Hesap ve profil: ad, kullanıcı adı, e-posta, tuzlanmış scrypt parola özeti, biyografi ve profil fotoğrafı.",
        "Doğrulama/güvenlik: kod özeti, oturum, IP, tarih-saat, giriş, istek sınırlama, erişim ve hata kayıtları.",
        "Kullanıcı içeriği: verilen/alınan puanlar, Vibe Tag'ler, notlar, tanışıklık türü, sürüm geçmişi, mesajlar, davetler, bildirimler, arkadaşlık/engelleme, şikâyet ve itirazlar.",
        "Başkalarından gelen veri: başka kullanıcıların senin hakkında oluşturduğu değerlendirme, not ve ilişki bağlamı.",
        "Üyelik: plan, süre, indirim kodu, mağaza ürün kimliği ve abonelik durumu. Kart/ödeme aracı bilgisi bize ulaşmaz.",
        "Yaklaşık konum: yalnızca Yakınındakiler açıldığında, yaklaşık 100 metre hassasiyete düşürülerek.",
        "Teknik veri: zorunlu httpOnly oturum çerezi, dil tercihi, cihaz/tarayıcının zorunlu teknik bilgileri ve açıldıysa push uç noktası. Mevcut tasarımda reklam/takip çerezi yoktur.",
      ],
    },
    {
      heading: "Amaçlar ve hukuki dayanak",
      body: [
        "Verileri hesap ve sözleşmeyi yürütmek; profil, puan, mesaj, bildirim ve üyeliği sunmak; sahtecilik, taciz ve güvenlik olaylarını önlemek; şikâyet/itirazı sonuçlandırmak; hakları savunmak ve yasal yükümlülükleri yerine getirmek için işleriz.",
        "Türkiye'de faaliyete göre KVKK m.5/2-c (sözleşme), m.5/2-ç (hukuki yükümlülük), m.5/2-e (hakkın tesisi/kullanılması/korunması) ve temel haklara zarar vermemek kaydıyla m.5/2-f (meşru menfaat); AB/AEA'da GDPR m.6(1)(b), (c), (f) uygulanır. Yaklaşık konum ayrı ve geri alınabilir rızaya dayanır; reddetmek diğer özellikleri etkilemez.",
        "Başka kullanıcının senin hakkında oluşturduğu veri, doğrudan senden alınmaz. Sosyal değerlendirme işlevi, sahteciliğin önlenmesi ve hakların korunmasına ilişkin meşru menfaat ile senin hakların dengelenir. Profilinle eşleştirildiğinde kaynak ve temel işleme bilgisiyle bildirim, erişim ve itiraz araçları sunulur. İtiraz otomatik silme yaratmaz; hukuka aykırılık, doğruluk iddiası, ifade özgürlüğü ve kişilik/veri hakları insan incelemesiyle dengelenir.",
      ],
    },
    {
      heading: "Değerlendirmeler, kimlik görünürlüğü ve otomasyon",
      body: [
        "Değerlendirenin adı genel arayüzde gösterilmez; kimlik sahtecilik, güvenlik ve itiraz için veritabanında tutulur. Gold üye kendisini değerlendiren kişiyi görebilir. Sahtecilik korumasındaki ve geçmişte açık “kimliğimi gizle” seçeneğiyle gönderilen değerlendirmeler istisnadır. Bu kural değerlendirme gönderilmeden hemen önce ayrıca gösterilir; mutlak anonimlik vaat edilmez.",
        "Otomatik araç bir oyun ağırlığını azaltabilir veya hesaba katmayabilir. Yalnızca otomatik işlemle hukuki veya benzer önemli sonuç doğurmamayı hedefleriz; etkilenen kullanıcı insan incelemesi ve itiraz isteyebilir.",
      ],
    },
    {
      heading: "Alıcılar ve satış yapılmaması",
      body: [
        "Kişisel veriyi para karşılığı satmayız, veri simsarına vermeyiz ve mevcut modelde hedefli/çapraz bağlam reklam için paylaşmayız. Amaçla sınırlı olarak şu alıcılara açıklama yapılabilir:",
      ],
      list: [
        "Kendi sunucumuz ve barındırma/veritabanı tedarikçileri.",
        "Resend: doğrulama ve şifre sıfırlama için ad, e-posta ve ileti teknik verileri.",
        "Cloudflare: trafik yönlendirme ve güvenlik için IP, istek ve bağlantı verileri.",
        "Apple/Google: mağaza satın alımını mağaza işler; bize ürün ve abonelik durumu gelir.",
        "Danışman, denetçi, mahkeme ve yetkili kurumlar: geçerli talep, yükümlülük veya hakların korunması ölçüsünde.",
        "Birleşme/yatırım/devir tarafları: gizlilik ve yasal sınırlar içinde, tamamlanan işlemde uygun bildirimle.",
      ],
    },
    {
      heading: "Yurtdışına aktarım",
      body: [
        "Resend, Cloudflare, Apple, Google veya alt sağlayıcıları nedeniyle veri yurtdışına aktarılabilir. Türkiye'den aktarımda KVKK m.9 uyarınca yeterlilik kararı, uygun güvence (özellikle Kurul standart sözleşmesi ve yasal bildirim) veya yalnızca gerçek arızi hâllerde kanuni istisna kullanılır. Açık rıza rutin/sürekli aktarım için varsayılan çözüm değildir.",
        "AB/AEA verisinde yeterlilik veya Avrupa Komisyonu SCC'leri, gerektiğinde transfer etki değerlendirmesi ve ek tedbirler uygulanır. Mekanizma hakkında {email}'dan bilgi istenebilir.",
      ],
    },
    {
      heading: "Saklama ve silme",
      body: [
        "Hesap verileri üyelik boyunca; hata kayıtları kural olarak en çok 30 gün; hız sınırlama IP kayıtları saatler; yedekler yaklaşık 30 günlük dönüşümle tutulur. Hesap silinince profil, mesaj, davet, bildirim ve değerlendirmeler aktif sistemlerden silinir veya geri döndürülemez anonimleştirilir.",
        "Moderasyon, dolandırıcılık, itiraz, yasal talep veya uyuşmazlığa ilişkin sınırlı kayıtlar kararın denetlenmesi ve hak savunması için erişimi kısıtlanarak gerekli ve zamanaşımıyla ölçülü süre tutulabilir; süresiz tutulmaz.",
      ],
    },
    {
      heading: "Güvenlik ve veri ihlali",
      body: [
        "Riskle orantılı TLS, tuzlanmış scrypt parola özeti, httpOnly ve uygun secure/sameSite çerezleri, erişim kontrolü, hız sınırlama, kayıt/izleme, yedekleme, güncelleme, tedarikçi ve olay yönetimi uygularız. Mutlak güvenlik vaat etmeyiz; kanuni güvenlik sorumluluğumuzu reddetmeyiz.",
        "İhlali sınırlar, riskini değerlendirir ve belgeleriz. KVKK bakımından Kurula gecikmeksizin ve kural olarak öğrenmeden itibaren en geç 72 saat içinde, etkilenenlere makul en kısa sürede bildirim yapılır. GDPR bakımından risk doğuran ihlal makama mümkünse 72 saat içinde; yüksek risk doğuran ihlal kişiye gecikmeksizin bildirilir. Uygulanabilir ABD eyalet ihlal kuralları ayrıca izlenir.",
      ],
    },
    {
      heading: "Haklar ve talepler",
      body: [
        "Bulunduğun yere göre erişim, kopya, düzeltme, silme, kısıtlama, taşınabilirlik, itiraz, rızayı geri alma, otomatik kararı insan incelemesine taşıma ve makama şikâyet hakların olabilir. Türkiye'de KVKK m.11; AB/AEA'da GDPR m.12–22 uygulanır. Talep: {email}. Kimliğini ölçülü doğrular, kanuni sürede cevap verir ve reddi gerekçelendiririz. Hesap silme: Profil → Hesap → Hesabımı Sil.",
      ],
    },
    {
      heading: "ABD eyalet gizlilik açıklaması",
      body: [
        "CCPA/CPRA veya başka kapsamlı eyalet kanunu uygulanıyorsa eyalet sakini bilme/erişim, düzeltme, silme, taşınabilir kopya, satış/hedefli reklam/profillemeden vazgeçme ve ayrımcılığa uğramama haklarına sahip olabilir. Son 12 ayda “Topladığımız veriler ve kaynaklar” kategorileri, “Amaçlar ve hukuki dayanak” amaçlarıyla toplanmış ve “Alıcılar ve satış yapılmaması” bölümündeki alıcılara iş amacıyla açıklanmış olabilir.",
        "Mevcut modelde kişisel bilgiyi satmıyor ve çapraz bağlam davranışsal reklam için paylaşmıyoruz. Bu faaliyet başlarsa önceden bildirim, opt-out ve uygulanabilir yasal tercih sinyali desteği sağlanır. Hassas bilgi yalnızca beklenen hizmet/güvenlik için kullanılır. Talepler {email} adresine iletilir. Münhasıran çevrim içi faaliyet gösterdiğimiz ve ilgili kişiyle doğrudan ilişkimiz bulunduğu için, kanunen yalnızca bir e-posta adresi sunulması yeterlidir; ücretsiz telefon hattı işletilmemektedir. Kapsam eşikleri düzenli doğrulanır.",
      ],
    },
    {
      heading: "Çocuklar ve değişiklikler",
      body: [
        "Hizmet yalnızca 18+ içindir. 18 yaş altından bilerek hesap açmayız. Böyle bir hesabı öğrenirsek askıya alır, doğrular ve kanunen gerekenler dışında veriyi sileriz. Ebeveyn/vasi {email}'dan bildirebilir. 18+ sınırı yaş beyanı ve risk bazlı yaş güvencesiyle uygulanır; COPPA ve AB çocuk kuralları bertaraf edilmiş varsayılmaz.",
        `Önemli politika değişikliklerini önceden uygun yöntemle bildirir; rıza gereken yeni amaçta yeniden rıza alırız. İletişim: {email}, ${OPERATOR_ADDRESS}.`,
      ],
    },
  ],
};

const trKvkk: LegalDoc = {
  slug: "kvkk",
  title: "KVKK Aydınlatma Metni",
  updated: UPDATED,
  intro: "6698 sayılı Kanun kapsamında, veri sorumlusu sıfatıyla seni bilgilendirmek isteriz.",
  sections: [
    {
      heading: "Veri sorumlusu",
      body: [
        `Veri sorumlusu, tüzel kişi değil gerçek kişidir: ${OPERATOR_NAME} (“Vibe Tag”). Tebligat ve posta adresi: ${OPERATOR_ADDRESS}. Başvuru e-postası: {email}. Veri sorumlusunun MERSİS kaydı, kayıtlı elektronik posta (KEP) adresi ve VERBİS kaydı bulunmamaktadır; 6698 sayılı Kanun ve Kurul kararları uyarınca VERBİS kayıt yükümlülüğünden istisna tutulan gerçek kişi veri sorumlusu konumundadır.`,
      ],
    },
    {
      heading: "İşlenen veri kategorileri",
      body: [],
      list: [
        "Kimlik/profil: ad, kullanıcı adı, biyografi, fotoğraf.",
        "İletişim: e-posta ve bildirim iletişim bilgileri.",
        "Kullanıcı işlem/içerik: değerlendirmeler ve sürümleri, tag/not/tanışıklık, mesaj, davet, bildirim, arkadaşlık/engelleme, şikâyet/itiraz.",
        "Müşteri işlem: plan, süre, kod, mağaza ürün/abonelik durumu; kart bilgisi işlenmez.",
        "İşlem güvenliği: parola/kod özetleri, oturum, IP, tarih-saat, hata, erişim ve güvenlik kayıtları, zorunlu çerezler.",
        "Konum: özellik seçilirse yaklaşık 100 metre hassasiyetli konum.",
        "Hukuki işlem/risk: makam talepleri, uyuşmazlık, moderasyon delili ve kararı.",
      ],
    },
    {
      heading: "Elde etme yöntemleri ve kaynaklar",
      body: [
        "Veriler kayıt, profil, mesaj ve değerlendirme ekranları; cihaz/tarayıcı; zorunlu çerezler; mağaza doğrulaması; destek ve şikâyet kanallarından otomatik veya kısmen otomatik yollarla elde edilir. Hakkındaki değerlendirme, not ve ilişki bağlamının kaynağı başka kullanıcı olabilir.",
      ],
    },
    {
      heading: "Amaç ve hukuki sebepler",
      body: [
        "Bir başkasının hakkında değerlendirme oluşturması sözleşme dayanağına tek başına bağlanmaz; sosyal işlev, sahtecilik ve hak koruması için meşru menfaat dengesi uygulanır ve itiraz üzerine insan incelemesi yapılır.",
      ],
      list: [
        "Üyelik ve temel hizmet/abonelik yönetimi: KVKK m.5/2-c.",
        "Güvenlik, sahtecilik ve kötüye kullanımın önlenmesi: temel haklara zarar vermemek ve ölçülü olmak kaydıyla m.5/2-f.",
        "Şikâyet, itiraz, delil ve uyuşmazlık: m.5/2-e ve gerektiğinde m.5/2-ç.",
        "Yetkili makam/mevzuat yükümlülüğü: m.5/2-ç.",
        "Yakınındakiler için yaklaşık konum: ayrı ve geri alınabilir açık rıza, m.5/1; rıza verilmemesi diğer hizmetleri etkilemez.",
      ],
    },
    {
      heading: "Aktarım",
      body: [
        "Veriler pazarlama için satılmaz. Yurt içinde yetkili kurum/yargı, avukat/denetçi ve teknik hizmet sağlayıcılara amaçla sınırlı aktarılabilir. Yurtdışında bulunabilen Resend'e e-posta için ad/e-posta/teknik veri; Cloudflare'a trafik/IP/güvenlik verisi; Apple/Google'a mağazanın gerektirdiği sınırlı veri aktarılabilir.",
        "Yurtdışı aktarım KVKK m.9'a göre yeterlilik, Kurul standart sözleşmesi veya diğer uygun güvenceyle; bunlar yoksa yalnızca kanuni arızi hâlde yapılır. Standart sözleşme yasal sürede Kuruma bildirilir.",
      ],
    },
    {
      heading: "Saklama ve imha",
      body: [
        "Hesap verileri üyelik boyunca; hata kayıtları kural olarak 30 gün; hız sınırlama kayıtları saatler; yedekler yaklaşık 30 gün tutulur. Hesap silmede aktif veriler imha/anonimleştirilir. Moderasyon, dolandırıcılık ve uyuşmazlık kayıtları yalnızca itiraz, delil ve zamanaşımı için gerekli, erişimi kısıtlı süre tutulur.",
      ],
    },
    {
      heading: "KVKK m.11 hakları ve başvuru",
      body: [
        "Verinin işlenip işlenmediğini öğrenme; bilgi isteme; amacı/uygun kullanımı ve alıcıları öğrenme; düzeltme; şartları varsa silme/yok etme ve alıcılara bildirim; münhasıran otomatik analizle aleyhe sonuca itiraz ve hukuka aykırı işleme zararının giderilmesini isteme hakların vardır.",
        `Başvurunu, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak ${OPERATOR_ADDRESS} adresine ıslak imzalı yazılı dilekçeyle ya da sistemimizde kayıtlı {email} adresinden elektronik olarak iletebilirsin; başvuruda ad, soyad, adres ve talep konusunun yer alması gerekir. En kısa sürede ve en geç 30 günde yanıtlanır; maliyet varsa Kurul tarifesi uygulanabilir. Kanuni sürelerle Kurula şikâyet hakkın saklıdır.`,
      ],
    },
    {
      heading: "Güvenlik, ihlal ve başkasından alınan veri",
      body: [
        "KVKK m.12 uyarınca riskle orantılı tedbir alınır ve işleyenler denetlenir. Kanuni olmayan elde etme öğrenildiğinde Kurula gecikmeksizin ve kural olarak en geç 72 saat içinde, etkilenen kişiye makul en kısa sürede bildirim yapılır.",
        "Başka kullanıcı hakkında veri oluşturduğunda kaynak ve temel işleme bilgisi makul sürede uygulama/profil bildirimiyle sunulur; kanuni istisnalar saklıdır. Erişim, düzeltme, itiraz veya hukuka aykırı içerik talebi {email}'a iletilebilir; gerekçeli karar ve başvuru yolu bildirilir.",
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
      heading: "Taraflar, kabul ve hizmet",
      body: [
        `Bu şartlar ${OPERATOR_NAME}, ${OPERATOR_ADDRESS} (“Vibe Tag”) ile kullanıcı arasındadır. Hesap açarak bu şartları, Gizlilik Politikasını ve topluluk/moderasyon kurallarını kabul edersin. Emredici tüketici hakları saklıdır. Vibe Tag öznel sosyal değerlendirme platformudur; işe alım, kredi, sigorta, konut, eğitim, sağlık, referans veya yüksek etkili karar aracı değildir.`,
      ],
    },
    {
      heading: "Yaş ve hesap güvenliği",
      body: [
        "En az 18 yaşında olmalı; doğru/güncel bilgi vermeli; tek kişi adına tek hesap kullanmalı; hesabı devretmemeli ve başkasına izinsiz bürünmemelisin. Güçlü benzersiz parola kullan ve şüpheli erişimi {email}'a bildir. Hesaptaki her işlemi koşulsuz sana yüklemeyiz; yetkisiz erişimde tarafların kusuru ve emredici hukuk gözetilir.",
      ],
    },
    {
      heading: "İçerik kuralları",
      body: [
        "Yalnız gerçekten tanıdığın kişiyi, bildiğin bağlamla ve dürüst kanaatin ölçüsünde değerlendirebilirsin. Tek değerlendirme/aylık güncelleme kuralını aşamazsın.",
      ],
      list: [
        "Hakaret, iftira, taciz, ısrarlı takip, tehdit, nefret söylemi, şiddet veya aşağılayıcı/cinsel içerik yasaktır.",
        "Bilerek yanlış isnat, intikam, şantaj, sahte/koordine/karşılıklı veya ücretli değerlendirme yasaktır.",
        "Kişisel veri, özel hayat, yazışma, telefon/e-posta, adres, kimlik/finans/sağlık bilgisi veya görüntünün hukuka aykırı ifşası yasaktır.",
        "Fikri mülkiyet/kişilik hakkı ihlali, spam, zararlı bağlantı/yazılım yasaktır.",
        "Bot, scraping, tersine mühendislik, yetkisiz erişim, güvenliği veya hız sınırını aşma ve hizmeti bozma yasaktır.",
        "Puanları iş, kredi, sigorta, konut veya benzeri yüksek etkili kararın tek/belirleyici temeli yapmak yasaktır.",
      ],
    },
    {
      heading: "Fikri mülkiyet ve içerik lisansı",
      body: [
        "İçeriğin haklarına sahip ve hukuka uygun olduğunu beyan edersin. Mülkiyet sende kalır. Hizmeti işletmek, göstermek, biçimlendirmek, güvenliğini sağlamak, yedeklemek ve şikâyeti incelemek için gerekli; dünya çapında, münhasır olmayan, hizmet sağlayıcılarla sınırlı alt lisanslanabilir, bedelsiz ve içerik silinene kadar geçerli lisans verirsin. Yasal kayıt/yedek istisnaları saklıdır.",
      ],
    },
    {
      heading: "Kimlik görünürlüğü",
      body: [
        "Değerlendiren genel arayüzde adla gösterilmez; kimlik veritabanında tutulur. Gold üye kendisini değerlendireni görebilir. Sahtecilik korumasındaki ve geçmiş “kimliğimi gizle” seçeneğiyle verilenler istisnadır. Bu kural gönderimden önce görünür uyarıyla sunulur. Geçerli makam talebinde kimlik açıklanabilir.",
      ],
    },
    {
      heading: "Bildirim, kaldırma ve itiraz",
      body: [
        "Hukuka veya şartlara aykırı içerik uygulamadaki Bildir aracı ya da {email} ile bildirilebilir. Bildirim içeriğin kesin yeri/kimliği, ihlal gerekçesi, iletişim (kanuni anonimlik saklı), iyi niyet beyanı ve varsa hak/yetki belgesiyle delili içermelidir.",
        "Alımı teyit eder, tarafsız ve özenli inceler, sonucu makul sürede bildiririz. Açık hukuka aykırılık/acil zarar riskinde derhal geçici kısıt; diğer hâllerde açıklama isteme, kaldırma, görünürlük azaltma, puandan çıkarma, hesap tedbiri veya işlem yapmama kararı verilebilir. Geçerli emirler uygulanır.",
        "Kısıtlamada kanunen yasak/güvenliği tehlikeye atan hâl dışında dayanak, kapsam, otomasyon ve itiraz yolunu içeren gerekçe sunulur. Karar bildiriminden itibaren 6 ay içinde {email} ile ücretsiz insan incelemesi isteyebilirsin. Misilleme amaçlı, tekrarlı ve açıkça dayanaksız başvuru ölçülü sınırlandırılabilir.",
        "5651 sayılı Kanun bakımından yer sağlayıcı sayıldığımız ölçüde önceden denetim yükümlülüğümüz yoktur; usulüne uygun bildirim veya yetkili karar sonrası yükümlülükleri yerine getiririz. DSA uygulanıyorsa notice-and-action, gerekçe, iç şikâyet ve diğer zorunlu mekanizmalar yürütülür. Bu koruma kendi içerik, tasarım, bilgimiz veya eylemimize ilişkin sorumluluğu kaldırmaz.",
      ],
    },
    {
      heading: "Moderasyon ve hesap tedbirleri",
      body: [
        "İnsan ve otomatik araçlarla; ağırlık, tekrar, bağlam, zarar, kast ve geçmişe göre uyarı, özellik kısıtı, kaldırma, puandan çıkarma, askı veya kapatma uygulanabilir. Acil güvenlik, açık hukuka aykırılık, dolandırıcılık veya soruşturma hâlinde önceden uyarı gerekmeyebilir. Engellenen kişi yeni değerlendirme/güncelleme yapamaz; mevcut değerlendirme sırf engelleme nedeniyle silinmez, fakat bildirilebilir.",
      ],
    },
    {
      heading: "Planlar, mağaza ödemeleri ve iadeler",
      body: [
        "Silver/Gold App Store veya Google Play'den alınabilir ya da promosyonla tanımlanabilir. Fiyat, dönem, özellik ve otomatik yenileme satın alma ekranında gösterilir. Ödeme/faturalama/yenileme/iptal teknik olarak mağazadan yürür; kart bilgisi bize gelmez. Dönem bitmeden mağazadan iptal edilmezse mağaza yenileyebilir; hesap silme aboneliği kendiliğinden iptal etmeyebilir ve bu silme ekranında gösterilir.",
        "İade öncelikle satın alınan mağazadan istenir. Ancak 6502 sayılı Kanun, Mesafeli Sözleşmeler Yönetmeliği ve ikamet yerindeki emredici haklar saklıdır. Dijital içerik/hizmete cayma süresinde başlanması ve hakkın kaybı için ayrı açık onay gerekiyorsa satın alma akışında alınır; salt bu şartların kabulü yeterli değildir. Ödenmiş dönemde temel fayda esaslı azaltılırsa uygun kanuni/mağaza çözümü sunulur.",
      ],
    },
    {
      heading: "Üçüncü taraf hizmetler",
      body: [
        "Uygulama, marka, yazılım ve tasarım Vibe Tag'e/lisans verenlere aittir. Sana kişisel, sınırlı, geri alınabilir ve devredilemez kullanım hakkı verilir. Kanuni istisnalar dışında kopyalama, dağıtma, kaynak koda dönüştürme ve ticari kullanım yasaktır.",
        "Cloudflare, Resend, Apple ve Google'ın kendi şartları uygulanabilir. Bağımsız üçüncü taraf kesintisini kontrol etmediğimiz ölçüde sorumlu değiliz; kendi tedarikçi seçimi, veri koruma ve emredici yükümlülüklerimiz saklıdır. Apple'dan edinimde sözleşme Apple ile değil Vibe Tag'ledir; Apple mağazaya özgü hükümlerin üçüncü taraf yararlanıcısı olabilir. Google Play kullanımı Google Play şartlarına tabidir.",
      ],
    },
    {
      heading: "Fesih ve hizmet değişikliği",
      body: [
        "Bakım, güvenlik veya hukuk nedeniyle hizmet geçici durabilir; özellikler makul bildirimle değişebilir. Hesabını silebilir, mağaza aboneliğini ayrıca iptal edebilirsin. Esaslı/tekrarlı ihlalde askı/kapatma mümkündür. Tüketicinin kusuruyla orantısız otomatik “hiç iade yok” uygulanmaz; olay, kullanılan dönem, mağaza ve emredici hukuk değerlendirilir.",
      ],
    },
    {
      heading: "Garanti ve sorumluluk sınırı",
      body: [
        "Emredici hukukun izin verdiği ölçüde hizmet mevcut hâliyle sunulur; kesintisizlik, hatasızlık, mutlak güvenlik veya kullanıcı içeriği doğruluğu garanti edilmez. Bu, vaat edilen temel dijital hizmet uygunluğunu, makul güvenliği veya tüketicinin ayıp/uygunluk haklarını kaldırmaz.",
        "Kanunen izin verilen ölçüde Vibe Tag; öngörülemeyen dolaylı zarar, kâr/fırsat kaybı veya salt üçüncü kullanıcı davranışından, kendi kusuru ve yükümlülüğü bulunmadığı ölçüde sorumlu değildir. Kullanıcı içeriği koruması aracı hizmet koşullarına bağlıdır.",
        `Tüketici olmayanlarda doğrudan zarar için toplam sözleşmesel tavan, olaydan önceki 12 ayda fiilen ödenen ücrettir; hiç ücret ödenmemiş kullanımda bu tavan ${FREE_TIER_LIABILITY_CAP_TR}\u2019dir. Sıfır tavan uygulanmaz. Tavan hesap başına değil kişi başınadır: aynı gerçek kişi tarafından açılan hesapların tamamından ve aynı olay ya da birbirine bağlı olaylar zincirinden doğan taleplerin tümü tek ve aynı tavana tabidir; birden fazla hesap açılmış olması tavanı çoğaltmaz. Sınır; kasıt/ağır ihmal, ölüm/bedensel zarar, dolandırıcılık, kanunen sınırlandırılamayan veri/gizlilik ve fikri mülkiyet sorumluluğu ile emredici tüketici hakkına uygulanmaz. Yerel hukuk izin vermiyorsa o ölçüde geçersizdir.`,
      ],
    },
    {
      heading: "Tazmin",
      body: [
        "Tüketici olmayan kullanıcı, kendi hukuka aykırı içeriği, esaslı ihlali veya üçüncü kişi hakkı ihlali nedeniyle Vibe Tag'e yöneltilen talepten doğan kesinleşmiş makul zarar/masrafı kusuru oranında tazmin eder. Vibe Tag talebi gecikmeksizin bildirir, işbirliği sağlar ve kullanıcı onayı olmadan ona yükümlülük getiren sulh yapmaz. Bu hüküm tüketiciye kanunen izin verilenden geniş uygulanmaz ve Vibe Tag'in kendi kusurunu kullanıcıya yüklemez.",
      ],
    },
    {
      heading: "Hukuk, uyuşmazlık ve değişiklik",
      body: [
        `Önce {email} üzerinden iyi niyetli çözüm aranır. Türkiye hukuku uygulanır. Türkiye'deki tüketici, yerleşim veya işlem yerindeki hakem heyeti/tüketici mahkemesi dâhil kanunen yetkili mercilere başvurabilirsin. Tüketici olmayanlarda ${VENUE_CITY} mahkeme/icra daireleri yetkilidir. Yabancı tüketicinin ikamet yerindeki vazgeçilemeyen koruma ve yetki hakları saklıdır. Zorunlu tahkim veya toplu dava feragati yoktur.`,
        `Önemli değişiklikler önceden uygun yöntemle bildirilir; yeni rıza/açık kabul gerekiyorsa ayrıca alınır. Sırf kullanıma devam, açık kabul gereken durumda yeterli değildir. Geçersiz hüküm diğerlerini etkilemez; hak kullanılmaması feragat değildir. İletişim: {email}, ${OPERATOR_ADDRESS}.`,
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
    "Vibe Tag does not sell data for advertising. The service processes what it needs for the product, security, moderation and legal duties. Ratings about you can be created by other people. Gold membership can reveal a rater's identity to the person they rated, subject to the exceptions below.",
  sections: [
    {
      heading: "Who we are and scope",
      body: [
        `This policy explains how personal data is processed in the Vibe Tag app and connected services, offered by ${OPERATOR_NAME} (“Vibe Tag”, “we”). Data controller/operator: ${OPERATOR_NAME}, a natural person; address: ${OPERATOR_ADDRESS}; privacy: {email}; content notices: {email}. The controller has no MERSİS or VERBİS registration and no registered electronic mail (KEP) address. Data-subject requests, including those from users in the EU/EEA, are handled directly at {email}.`,
        "The App Store, Google Play and any independent linked services have their own data practices, outside this policy.",
      ],
    },
    {
      heading: "What we collect, and from where",
      body: [],
      list: [
        "Account and profile: name, username, email, a salted scrypt hash of your password, your bio and photo.",
        "Verification/security: code hashes, session, IP, timestamps, sign-in, rate-limit, access and error logs.",
        "User content: scores given/received, Vibe Tags, notes, how you know each other, revision history, messages, invites, notifications, friend/block records, reports and appeals.",
        "Data from others: the ratings, notes and relationship context other users create about you.",
        "Membership: plan, term, discount code, store product id and subscription status. Card/payment instrument data never reaches us.",
        "Approximate location: only when Nearby is on, rounded to roughly 100 metres.",
        "Technical data: the mandatory httpOnly session cookie, language preference, your device/browser's mandatory technical information and, if enabled, your push endpoint. No advertising/tracking cookies in the current design.",
      ],
    },
    {
      heading: "Purposes and legal basis",
      body: [
        "We process data to run the account and contract; to provide the profile, score, messaging, notifications and membership; to prevent fraud, harassment and security incidents; to resolve complaints/appeals; to defend rights; and to meet legal obligations.",
        "Depending on activity in Türkiye, KVKK Art. 5/2-c (contract), 5/2-ç (legal obligation), 5/2-e (establishment/exercise/protection of a right) and, without prejudice to your fundamental rights, 5/2-f (legitimate interest) apply; in the EU/EEA, GDPR Art. 6(1)(b), (c), (f) apply. Approximate location rests on separate, revocable consent; declining it does not affect anything else.",
        "Data another user creates about you is not collected from you directly. The social rating function is balanced against your rights via a legitimate-interest test aimed at preventing fraud and protecting rights. When it is matched to your profile, you are given notice with the source and basic processing information, plus access and objection tools. An objection does not trigger automatic deletion — lawfulness, accuracy claims, freedom of expression and personality/data rights are weighed by human review.",
      ],
    },
    {
      heading: "Ratings, identity visibility and automation",
      body: [
        "A rater's name is not shown in the general interface; identity is kept in the database for fraud detection, security and appeals. A Gold member can see who rated them. Ratings the fraud detector has protected, and ones submitted while a “hide my identity” option existed and used, are the exceptions. This rule is shown again right before a rating is submitted; absolute anonymity is not promised.",
        "An automated tool may reduce or discount a vote's weight. We aim not to produce legal or similarly significant effects from automated processing alone; an affected user may request human review and lodge an objection.",
      ],
    },
    {
      heading: "Recipients, and that we do not sell data",
      body: [
        "We do not sell personal data for money, pass it to data brokers, or — in the current model — share it for targeted/cross-context advertising. Purpose-limited disclosure may be made to:",
      ],
      list: [
        "Our own server and hosting/database providers.",
        "Resend: name, email and message technical data, for verification and password-reset delivery.",
        "Cloudflare: IP, request and connection data, for traffic routing and security.",
        "Apple/Google: the store processes your store purchase; we receive only product and subscription status.",
        "Advisors, auditors, courts and competent authorities: to the extent of a valid request, obligation or the protection of rights.",
        "Parties to a merger/investment/transfer: within privacy and legal limits, with appropriate notice on a completed transaction.",
      ],
    },
    {
      heading: "Transfers abroad",
      body: [
        "Data may be transferred abroad due to Resend, Cloudflare, Apple, Google or their sub-processors. Transfers from Türkiye rely on an adequacy decision, an appropriate safeguard under KVKK Art. 9 (in particular the Board's standard contract, with the required notice), or a genuinely occasional statutory exception. Explicit consent is not the default basis for routine or continuous transfer.",
        "For EU/EEA data, adequacy or European Commission SCCs apply, together with a transfer impact assessment and supplementary measures where required. Write to {email} for details on the mechanism used.",
      ],
    },
    {
      heading: "Retention and deletion",
      body: [
        "Account data is kept for the life of the membership; error logs for at most 30 days as a rule; rate-limit IP records for hours; backups on roughly a 30-day rotation. Deleting your account removes your profile, messages, invites, notifications and ratings from active systems, or irreversibly anonymises them.",
        "Limited records tied to moderation, fraud, appeals, a legal request or a dispute may be kept, access-restricted, for as long as needed to review the decision and defend rights, bounded by the statute of limitations — never indefinitely.",
      ],
    },
    {
      heading: "Security and data breach",
      body: [
        "We apply risk-proportionate TLS, salted scrypt password hashing, httpOnly cookies with appropriate secure/sameSite flags, access control, rate limiting, logging/monitoring, backups, updates, vendor management and incident response. We do not promise absolute security, and we do not disclaim our statutory security duties.",
        "We contain, assess and document a breach. Under KVKK, the Board is notified without delay and, as a rule, no later than 72 hours after we learn of it; affected people are notified as soon as reasonably possible. Under GDPR, a breach creating risk is notified to the authority within 72 hours where feasible; one creating high risk is notified to the individual without delay. Applicable US state breach rules are also monitored.",
      ],
    },
    {
      heading: "Your rights and requests",
      body: [
        "Depending on where you are, you may have rights of access, copy, correction, erasure, restriction, portability, objection, withdrawing consent, moving an automated decision to human review, and complaint to an authority. KVKK Art. 11 applies in Türkiye; GDPR Art. 12–22 in the EU/EEA. Requests: {email}. We verify identity proportionately, respond within the legal timeframe, and give reasons for a refusal. Account deletion: Profile → Account → Delete my account.",
      ],
    },
    {
      heading: "US state privacy disclosure",
      body: [
        "If CCPA/CPRA or another comprehensive state law applies, a resident may have rights to know/access, correct, delete, obtain a portable copy, opt out of sale/targeted advertising/profiling, and be free from discrimination. In the past 12 months, the categories under “What we collect, and from where” may have been collected for the purposes under “Purposes and legal basis” and disclosed for a business purpose to the recipients under “Recipients, and that we do not sell data”.",
        "In the current model we do not sell personal information or share it for cross-context behavioural advertising. If that changes, advance notice, an opt-out and support for an applicable legal preference signal will be provided first. Sensitive information is used only for expected service/security purposes. Requests go to {email}. Because we operate exclusively online and have a direct relationship with the consumer, an email address is the only method the law requires us to offer; we do not run a toll-free line. Applicability thresholds are reviewed regularly.",
      ],
    },
    {
      heading: "Children and changes",
      body: [
        "The service is for 18+ only. We do not knowingly open an account for anyone under 18. If we learn of one, we suspend it, verify age, and delete the data except where the law requires otherwise. A parent/guardian may notify {email}. The 18+ line is enforced with an age declaration and risk-based age assurance; COPPA and EU children's rules are not assumed away.",
        `Material policy changes are announced in advance through an appropriate channel; where a new purpose needs consent, we ask for it again. Contact: {email}, ${OPERATOR_ADDRESS}.`,
      ],
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
        `The data controller is a natural person, not a legal entity: ${OPERATOR_NAME} (“Vibe Tag”). Address for notices and post: ${OPERATOR_ADDRESS}. Request email: {email}. The controller has no MERSİS number, no registered electronic mail (KEP) address and no VERBİS registration; as a natural-person controller he falls within the exemption from the VERBİS registration obligation under Law no. 6698 and the Board\u2019s decisions.`,
      ],
    },
    {
      heading: "Categories of personal data processed",
      body: [],
      list: [
        "Identity/profile: name, username, bio, photo.",
        "Contact: email and notification contact details.",
        "User transaction/content: ratings and their revisions, tags/notes/relationship, messages, invites, notifications, friend/block records, reports/appeals.",
        "Customer transaction: plan, term, code, store product/subscription status; no card data.",
        "Transaction security: password/code hashes, session, IP, timestamps, error, access and security logs, mandatory cookies.",
        "Location: approximately 100-metre-precision location, if the feature is selected.",
        "Legal transaction/risk: authority requests, disputes, moderation evidence and decisions.",
      ],
    },
    {
      heading: "How data is obtained, and its sources",
      body: [
        "Data is obtained, automatically or partly automatically, through the registration, profile, message and rating screens; your device/browser; mandatory cookies; store verification; and support/complaint channels. The source of a rating, note or relationship context about you can be another user.",
      ],
    },
    {
      heading: "Purpose and legal grounds",
      body: [
        "Another user creating a rating about you does not rest on contract alone; a legitimate-interest balance for the social function, fraud prevention and protection of rights applies, with human review on appeal.",
      ],
      list: [
        "Membership and core service/subscription management: KVKK Art. 5/2-c.",
        "Security, fraud and abuse prevention: Art. 5/2-f, subject to not harming fundamental rights and being proportionate.",
        "Complaints, appeals, evidence and disputes: Art. 5/2-e and, where required, 5/2-ç.",
        "Competent authority/statutory obligation: Art. 5/2-ç.",
        "Approximate location for Nearby: separate and revocable explicit consent, Art. 5/1; declining does not affect other services.",
      ],
    },
    {
      heading: "Transfers",
      body: [
        "Data is not transferred to third parties for marketing. Purpose-limited transfers may be made domestically to competent authorities/courts, lawyers/auditors and technical service providers. Name/email/technical data may go to Resend (possibly located abroad) for email; traffic/IP/security data to Cloudflare; and limited data required by the store to Apple/Google.",
        "Cross-border transfer follows KVKK Art. 9: adequacy, the Board's standard contract, or another appropriate safeguard; absent those, only in a genuinely occasional statutory case. A standard contract is notified to the Authority within the legal period.",
      ],
    },
    {
      heading: "Retention and destruction",
      body: [
        "Account data is kept for the life of the membership; error logs generally 30 days; rate-limit records hours; backups roughly 30 days. Active data is destroyed/anonymised on account deletion. Moderation, fraud and dispute records are kept, access-restricted, only as long as needed for appeal, evidence and limitation periods.",
      ],
    },
    {
      heading: "Your rights under KVKK Art. 11 and how to apply",
      body: [
        "You have the right to learn whether your data is processed; to request information about it; to learn its purpose and whether it is used accordingly and who receives it; to request correction; where the conditions are met, to request erasure/destruction and that recipients be notified; to object to a result reached solely by automated analysis; and to request compensation for damage from unlawful processing.",
        `You may apply in line with the Communiqué on the Procedures and Principles of Application to the Data Controller: by signed written petition to ${OPERATOR_ADDRESS}, or electronically from the {email} on file. Your application must state your name, address and what you are asking for. We respond as soon as possible and within 30 days at the latest; a cost may apply per the Board's tariff. Your right to complain to the Board within the statutory periods is reserved.`,
      ],
    },
    {
      heading: "Security, breach, and data obtained from someone else",
      body: [
        "We take risk-proportionate measures under KVKK Art. 12 and audit our processors. When unlawful acquisition is learned of, the Board is notified without delay and, as a rule, within 72 hours at the latest; affected individuals are notified as soon as reasonably possible.",
        "When another user creates data about you, you are given notice of the source and basic processing within a reasonable time, via the app or a profile notice; statutory exceptions apply. Requests for access, correction, objection or unlawful-content removal may be sent to {email}; a reasoned decision and the route to appeal are provided.",
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
      heading: "Parties, acceptance and the service",
      body: [
        `These terms are between ${OPERATOR_NAME}, ${OPERATOR_ADDRESS} (“Vibe Tag”) and the user. Opening an account means accepting these terms, the Privacy Policy, and the community/moderation rules. Mandatory consumer rights are reserved. Vibe Tag is a subjective social-rating platform; it is not a hiring, credit, insurance, housing, education, health, reference-check or other high-impact decision tool.`,
      ],
    },
    {
      heading: "Age and account security",
      body: [
        "You must be at least 18; give accurate, current information; use one account per person; and neither transfer your account nor impersonate someone else without permission. Use a strong, unique password and report suspicious access to {email}. We do not attribute every action on your account to you unconditionally; unauthorised access is assessed against each party's fault and mandatory law.",
      ],
    },
    {
      heading: "Content rules",
      body: [
        "You may rate only someone you genuinely know, in the context you know them from, to the extent of your honest opinion. You may not exceed the one-rating / monthly-update rule.",
      ],
      list: [
        "Insult, defamation, harassment, stalking, threats, hate speech, violence, or degrading/sexual content is prohibited.",
        "Knowingly false accusation, revenge, blackmail, and fake/coordinated/reciprocal or paid ratings are prohibited.",
        "Unlawful disclosure of personal data, private life, correspondence, phone/email, address, or identity/financial/health information or images is prohibited.",
        "Infringement of intellectual property or personality rights, spam, and harmful links/software are prohibited.",
        "Bots, scraping, reverse engineering, unauthorised access, exceeding security or rate limits, and disrupting the service are prohibited.",
        "Using the scores as the sole or determinative basis for a hiring, credit, insurance, housing or similarly high-impact decision is prohibited.",
      ],
    },
    {
      heading: "Intellectual property and content licence",
      body: [
        "You represent that you own the rights to your content and that it is lawful. Ownership stays with you. You grant a worldwide, non-exclusive, sub-licensable (limited to our service providers), royalty-free licence, lasting until the content is deleted, to the extent needed to run, display, format, secure, back up and review reports about the service. Statutory record/backup exceptions are reserved.",
      ],
    },
    {
      heading: "Identity visibility",
      body: [
        "A rater is not shown by name in the general interface; identity is kept in the database. A Gold member can see who rated them. Ratings the fraud detector has protected, and ones submitted under a past “hide my identity” option, are the exceptions. This rule is shown with a visible notice before submission. Identity may be disclosed on a valid authority request.",
      ],
    },
    {
      heading: "Reporting, removal and appeal",
      body: [
        "Content unlawful or against these terms can be reported through the in-app Report tool or {email}. A report should include the exact location/identity of the content, the grounds for the violation, contact information (statutory anonymity reserved), a good-faith statement, and evidence with any rights/authority documentation.",
        "We confirm receipt, review impartially and carefully, and communicate the outcome within a reasonable time. In clear unlawfulness or urgent-harm risk, an immediate interim restriction may apply; otherwise we may request clarification, remove content, reduce visibility, exclude it from scoring, apply an account measure, or decide to take no action. Valid orders are complied with.",
        "Except where the law prohibits it or it would endanger safety, a restriction comes with reasoning covering its basis, scope, use of automation and how to appeal. You may request a free human review within 6 months of the decision notice, by writing to {email}. Retaliatory, repetitive or clearly unfounded requests may be proportionately limited.",
        "To the extent we qualify as a hosting provider under Law No. 5651, we have no obligation of prior review; we meet our duties on a proper notice or a competent decision. Where the DSA applies, notice-and-action, statements of reasons, internal complaints and other mandatory mechanisms are operated. This protection does not remove liability for our own content, design, knowledge or actions.",
      ],
    },
    {
      heading: "Moderation and account measures",
      body: [
        "Using human and automated tools, and weighing severity, repetition, context, harm, intent and history, we may apply a warning, a feature restriction, removal, exclusion from scoring, suspension or closure. Urgent safety, clear unlawfulness, fraud or an investigation may mean no prior warning is given. A blocked person cannot submit a new rating or revise one; their existing rating is not deleted solely because of the block, but it can still be reported.",
      ],
    },
    {
      heading: "Plans, store payments and refunds",
      body: [
        "Silver/Gold can be obtained through the App Store or Google Play, or granted by a promotion. Price, term, features and auto-renewal are shown on the purchase screen. Payment, billing, renewal and cancellation are technically handled by the store; card data never reaches us. If not cancelled through the store before the term ends, the store may renew it; deleting your account may not automatically cancel the subscription, and this is shown on the deletion screen.",
        "Refunds are requested from the store you purchased through in the first instance. Mandatory rights under Law No. 6502, the Distance Contracts Regulation and rights at your place of residence are reserved. Where separate explicit consent is required to begin performance of digital content/service within the withdrawal period and to lose that right, it is obtained in the purchase flow itself — accepting these terms alone is not enough. If a core benefit of a paid period is materially reduced, an appropriate legal/store remedy is offered.",
      ],
    },
    {
      heading: "Third-party services",
      body: [
        "The app, brand, software and design belong to Vibe Tag/its licensors. You are given a personal, limited, revocable, non-transferable right to use it. Except for statutory exceptions, copying, distributing, reverse-engineering and commercial use are prohibited.",
        "Cloudflare's, Resend's, Apple's and Google's own terms may apply. We are not liable for an independent third-party outage beyond our control; our own vendor choices, data protection and mandatory duties are reserved. A purchase through Apple is a contract with Vibe Tag, not Apple; Apple may be a third-party beneficiary of store-specific terms. Use of Google Play is subject to Google Play's terms.",
      ],
    },
    {
      heading: "Termination and changes to the service",
      body: [
        "The service may pause temporarily for maintenance, security or legal reasons; features may change with reasonable notice. You may delete your account and must separately cancel a store subscription. Substantial or repeated breach may lead to suspension/closure. An automatic “no refund ever” disproportionate to a consumer's fault is not applied; the specific event, period used, store and mandatory law are considered.",
      ],
    },
    {
      heading: "Warranty and limitation of liability",
      body: [
        "To the extent mandatory law allows, the service is provided as is; uninterrupted operation, error-freeness, absolute security or the accuracy of user content are not guaranteed. This does not remove the fitness of the promised core digital service, reasonable security, or a consumer's defect/conformity rights.",
        "To the extent permitted by law, Vibe Tag is not liable for unforeseeable indirect damage, lost profit/opportunity, or damage arising solely from a third user's conduct, to the extent we are not at fault and have no duty involved. Protection for user-generated content depends on the applicable hosting-service conditions.",
        `For non-consumers, the total contractual cap for direct damage is what was actually paid in the 12 months before the event; where no fee was paid, that cap is ${FREE_TIER_LIABILITY_CAP_EN}. A zero cap is not applied. The cap applies per person, not per account: all claims arising from every account opened by the same natural person, and from the same event or a connected series of events, are subject to one and the same cap; opening more than one account does not multiply it. The cap does not apply to intent/gross negligence, death/bodily injury, fraud, data/privacy liability that cannot be limited by law, intellectual-property liability, or a mandatory consumer right. It is invalid to the extent local law does not permit it.`,
      ],
    },
    {
      heading: "Indemnity",
      body: [
        "A non-consumer user indemnifies Vibe Tag, in proportion to their fault, for finally established reasonable damage/costs arising from a claim against Vibe Tag due to the user's own unlawful content, a substantial breach, or infringement of a third party's rights. Vibe Tag notifies the claim without delay, cooperates, and does not settle in a way that creates an obligation for the user without their consent. This clause is not applied more broadly against a consumer than the law allows, and does not shift Vibe Tag's own fault onto the user.",
      ],
    },
    {
      heading: "Governing law, disputes and changes",
      body: [
        `A good-faith resolution is sought first via {email}. Turkish law applies. You may apply to the competent bodies under the law, including the consumer arbitration board/consumer court in Türkiye at your place of residence or where the transaction occurred. For non-consumers, the courts/enforcement offices of ${VENUE_CITY} have jurisdiction. A foreign consumer's non-waivable protections and jurisdiction at their place of residence are reserved. There is no mandatory arbitration or class-action waiver.`,
        `Material changes are announced in advance through an appropriate channel; where new consent/explicit acceptance is required, it is obtained separately. Continued use alone is not sufficient where explicit acceptance is required. An invalid clause does not affect the rest; not exercising a right is not a waiver. Contact: {email}, ${OPERATOR_ADDRESS}.`,
      ],
    },
  ],
};


/**
 * Child safety (CSAE) standards.
 *
 * Published because Google Play requires every social app to point at a
 * public, non-PDF page setting out its standards against child sexual abuse
 * and exploitation before it may ship. It is not boilerplate: Vibe Tag is an
 * 18+ service, and the honest version of this page says what we actually do
 * — refuse minors, take reports in-app, remove and preserve, and report to
 * the authorities — rather than describing a moderation department we do not
 * have.
 */
const trChildSafety: LegalDoc = {
  slug: "child-safety",
  title: "Çocuk Güvenliği Standartları",
  updated: UPDATED,
  intro:
    "Vibe Tag yalnızca 18 yaş ve üzeri için bir hizmettir. Çocukların cinsel istismarı ve sömürüsü (CSAE) ile çocukların cinsel istismarı nitelikli materyal (CSAM) hizmetimizde kesinlikle yasaktır; bu sayfa buna karşı uyguladığımız standartları açıklar.",
  sections: [
    {
      heading: "Yaş sınırı",
      body: [
        "Hizmet 18 yaşından küçüklere açık değildir. Kayıt sırasında 18 yaşını doldurduğunun beyan edilmesi zorunludur ve bunun aksini gösteren bir işaret gördüğümüzde hesabı askıya alırız.",
        `18 yaşından küçük birine ait olduğunu öğrendiğimiz hesap kapatılır ve kanunen saklanması gerekenler dışındaki verileri silinir. Bir ebeveyn ya da vasi, çocuğuna ait bir hesabı {email} adresinden bildirebilir; bu bildirimleri öncelikli işleme alırız.`,
      ],
    },
    {
      heading: "Yasak içerik ve davranışlar",
      body: [
        "Aşağıdakiler hiçbir bağlamda kabul edilmez ve tespit edildiğinde hesabın kalıcı olarak kapatılmasıyla sonuçlanır:",
      ],
      list: [
        "Çocukların cinsel istismarı nitelikli her tür materyal (CSAM) — paylaşılması, aranması, istenmesi ya da bağlantısının verilmesi.",
        "Bir çocuğu cinselleştiren, cinsel açıdan tasvir eden veya bu yönde ima taşıyan metin, görsel ve etiketler.",
        "Bir çocukla cinsel amaçla iletişim kurma, güven ilişkisi kurup istismara hazırlama (grooming) ya da buna teşebbüs.",
        "Çocuk ticareti, çocuğun cinsel sömürüsünün örgütlenmesi veya kolaylaştırılması.",
        "18 yaşından küçük birinin hizmete erişmesini sağlamak; kendi yaşını ya da bir başkasının yaşını gizlemek.",
      ],
    },
    {
      heading: "Uygulama içinden bildirim",
      body: [
        "Her değerlendirmenin, profilin ve mesaj başlığının yanında bir bildirme yolu vardır; çocuk güvenliğiyle ilgili endişeler bu yolla doğrudan bize ulaşır. Bildirimi yapan kişinin kimliği bildirilen kişiye gösterilmez.",
        `Uygulamaya erişimin yoksa ya da acil bir durum varsa {email} adresine doğrudan yazabilirsin. Çocuk güvenliği bildirimleri sıraya alınmadan, diğer bildirimlerin önünde incelenir.`,
      ],
    },
    {
      heading: "Bildirim geldiğinde ne yapıyoruz",
      body: [
        "İnceleme insan tarafından yapılır. Bir bildirim doğrulandığında içerik kaldırılır, hesap askıya alınır ya da kalıcı olarak kapatılır ve aynı kişiye ait diğer hesaplar araştırılır.",
        "CSAM ile ilgili bir tespitte içerik hizmetten kaldırılır, delil niteliğindeki kayıtlar yasal süre boyunca erişime kapalı biçimde saklanır ve durum yetkili makamlara bildirilir. Bu bildirimler, hesabı kapatılan kişiye önceden haber verilmeksizin yapılır.",
      ],
    },
    {
      heading: "Yasalara uygunluk ve makamlara bildirim",
      body: [
        `Çocuk güvenliğine ilişkin yürürlükteki mevzuata uyar, kanunen bildirim yükümlülüğü doğduğunda yetkili ulusal ve bölgesel makamlara — Türkiye'de ilgili adli ve idari mercilere, ilgili olduğu ölçüde NCMEC gibi uluslararası bildirim mekanizmalarına — bildirimde bulunuruz.`,
        `Bu standartlarla ilgili sorular, makam talepleri ve bildirimler için iletişim: {email} — ${OPERATOR_NAME}, ${OPERATOR_ADDRESS}.`,
      ],
    },
  ],
};

/** Child safety (CSAE) standards — see the note above the Turkish version. */
const enChildSafety: LegalDoc = {
  slug: "child-safety",
  title: "Child Safety Standards",
  updated: UPDATED,
  intro:
    "Vibe Tag is a service for people aged 18 and over. Child sexual abuse and exploitation (CSAE), and child sexual abuse material (CSAM), are absolutely prohibited here; this page sets out the standards we apply against them.",
  sections: [
    {
      heading: "Age limit",
      body: [
        "The service is not open to anyone under 18. Declaring that you are 18 or older is required at sign-up, and we suspend an account as soon as we see a sign to the contrary.",
        `An account we learn belongs to someone under 18 is closed and its data deleted except what the law requires us to keep. A parent or guardian can report a child's account to {email}; those reports are handled as a priority.`,
      ],
    },
    {
      heading: "Prohibited content and conduct",
      body: [
        "None of the following is acceptable in any context, and each results in permanent closure of the account when found:",
      ],
      list: [
        "Child sexual abuse material (CSAM) of any kind — sharing, seeking, soliciting or linking to it.",
        "Text, images or tags that sexualise a child, depict a child sexually, or imply as much.",
        "Contacting a child for sexual purposes, grooming, or any attempt at either.",
        "Child trafficking, or organising or facilitating the sexual exploitation of a child.",
        "Helping anyone under 18 reach the service; concealing your own age or someone else's.",
      ],
    },
    {
      heading: "Reporting from inside the app",
      body: [
        "Every rating, profile and message thread carries a way to report it, and child-safety concerns reach us directly through it. The reporter's identity is never shown to the person reported.",
        `If you cannot reach the app, or the situation is urgent, write straight to {email}. Child-safety reports are reviewed ahead of the queue, before anything else.`,
      ],
    },
    {
      heading: "What we do with a report",
      body: [
        "Review is done by a human. Where a report is confirmed, the content is removed, the account is suspended or permanently closed, and other accounts belonging to the same person are investigated.",
        "Where CSAM is found, the content is removed from the service, the records that constitute evidence are preserved in restricted storage for the statutory period, and the matter is reported to the competent authorities. Those reports are made without prior notice to the account holder.",
      ],
    },
    {
      heading: "Legal compliance and reporting to authorities",
      body: [
        `We comply with applicable child-safety law and, where a duty to report arises, report to the competent national and regional authorities — in Türkiye to the relevant judicial and administrative bodies, and to international reporting mechanisms such as NCMEC where applicable.`,
        `For questions about these standards, requests from authorities, and reports: {email} — ${OPERATOR_NAME}, ${OPERATOR_ADDRESS}.`,
      ],
    },
  ],
};

const DOCS: Record<Locale, Record<LegalSlug, LegalDoc>> = {
  tr: { privacy: trPrivacy, kvkk: trKvkk, terms: trTerms, "child-safety": trChildSafety },
  en: { privacy: enPrivacy, kvkk: enKvkk, terms: enTerms, "child-safety": enChildSafety },
};

export function legalDoc(slug: LegalSlug, locale: Locale): LegalDoc {
  return DOCS[locale][slug];
}

export function legalIndex(locale: Locale): LegalDoc[] {
  return LEGAL_SLUGS.map((s) => DOCS[locale][s]);
}

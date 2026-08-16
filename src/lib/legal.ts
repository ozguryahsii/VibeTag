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
 * counsel has signed the texts off.
 *
 * When the product changes, these change with it. The rule of thumb: if a new
 * column stores something about a person, it belongs in the data table below.
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

const UPDATED = "2026-08-16";

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
        "Hesap bilgileri: ad, kullanıcı adı, e-posta, şifrenin geri döndürülemez özeti (scrypt), varsa biyografi ve profil fotoğrafı.",
        "Değerlendirmeler: verdiğin ve aldığın puanlar, seçtiğin Vibe Tag'ler, notlar, tanışıklık türü ve her güncellemenin önceki sürümü.",
        "Konum: yalnızca “Yakınındakiler” özelliğini açarsan. Konumun yaklaşık 100 metreye yuvarlanarak saklanır ve sadece listeyi mesafeye göre sıralamak için kullanılır. Varsayılan kapalıdır ve istediğin an kapatabilirsin.",
        "Mesajlar: gönderdiğin ve aldığın doğrudan mesajlar.",
        "Oturum: tarayıcında tutulan bir oturum çerezi ve dil tercihini saklayan bir çerez.",
      ],
    },
    {
      heading: "Değerlendirmeler ve anonimlik",
      body: [
        "Değerlendirmeler arayüzde hiçbir zaman kişiye bağlanarak gösterilmez. Veritabanında kimin kimi değerlendirdiği kayıtlıdır — sahtecilik tespiti, itiraz ve kötüye kullanım incelemesi bunu gerektirir.",
        "Gold üyelik, kendisini değerlendirenlerin kimliğini görme imkânı verir. Bunun iki istisnası vardır ve ikisi de üyelikten üstündür: değerlendiren kişi kimliğini gizlemeyi seçmişse, ya da sahtecilik tespiti değerlendirmeyi korumaya almışsa, kimlik hiçbir üyelikte görünmez.",
      ],
    },
    {
      heading: "Verileri neden işliyoruz",
      body: [
        "Hesabını oluşturmak ve oturumunu sürdürmek; profilini ve puanını hesaplamak; sahte değerlendirmeleri tespit etmek; bildirimleri iletmek; kötüye kullanım bildirimlerini incelemek. Bunların dışında bir amaç için kullanmıyoruz.",
      ],
    },
    {
      heading: "Paylaşmadıklarımız",
      body: [
        "Verilerini satmıyoruz, reklam için üçüncü taraflarla paylaşmıyoruz ve profilleme amaçlı veri simsarlarına aktarmıyoruz. Yasal bir zorunluluk doğmadıkça hiçbir veriyi dışarı vermeyiz.",
      ],
    },
    {
      heading: "Saklama süresi",
      body: [
        "Hesabın açık olduğu sürece verilerini saklarız. Hesabını sildiğinde profilin, verdiğin ve aldığın tüm değerlendirmeler, davetlerin, mesajların ve bildirimlerin kalıcı olarak silinir.",
        "Bir istisna vardır: moderasyon kararıyla kaldırılan değerlendirmeler silinmez, gizlenir. Bunun sebebi itiraz hakkıdır — geri bakılamayan bir karar itiraz edilemez bir karardır.",
      ],
    },
    {
      heading: "Güvenlik",
      body: [
        "Şifreler geri döndürülemez biçimde (scrypt, kullanıcıya özel tuz ile) saklanır; düz metin şifre hiçbir yerde tutulmaz. Oturum çerezi httpOnly'dir ve tarayıcıdaki JavaScript tarafından okunamaz.",
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
      body: ["Kimlik ve iletişim verisi, kullanıcı işlem verisi ve — yalnızca açık rızan varsa — konum verisi işlenir."],
      list: [
        "Kimlik: ad, kullanıcı adı.",
        "İletişim: e-posta adresi.",
        "Kullanıcı işlem: verdiğin ve aldığın değerlendirmeler, mesajlar, davetler, bildirimler, oturum kayıtları.",
        "Konum: yaklaşık (~100 m) konum — yalnızca “Yakınındakiler” özelliğini açtıysan.",
        "Görsel: yüklediysen profil fotoğrafın.",
      ],
    },
    {
      heading: "İşleme amaçları",
      body: [
        "Üyelik sözleşmesinin kurulması ve ifası, hizmetin sunulması, sosyal itibar profilinin hesaplanması, sahte değerlendirmelerin tespiti, güvenliğin sağlanması ve kötüye kullanım bildirimlerinin incelenmesi.",
      ],
    },
    {
      heading: "Hukuki sebep",
      body: [
        "Kimlik, iletişim ve kullanıcı işlem verileri KVKK m.5/2-c uyarınca sözleşmenin kurulması ve ifası için gerekli olduğundan; güvenlik ve sahtecilik tespitine ilişkin işleme m.5/2-f uyarınca meşru menfaat kapsamında yürütülür.",
        "Konum verisi yalnızca KVKK m.5/1 uyarınca açık rızana dayanır. Rızanı vermemen hizmetin diğer bölümlerini etkilemez; “Yakınındakiler” özelliği kapalı kalır. Rızanı istediğin an Kişiler ekranından geri çekebilirsin.",
      ],
    },
    {
      heading: "Aktarım",
      body: [
        "Kişisel verilerin pazarlama amacıyla üçüncü kişilere aktarılmaz ve yurt dışına aktarılmaz. Barındırma sağlayıcısı dışında aktarım yapılmaz; yasal talep hâlinde yetkili kamu kurumlarına aktarım saklıdır.",
      ],
    },
    {
      heading: "Hakların (KVKK m.11)",
      body: [
        "Kişisel verinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme ve zarara uğraman hâlinde zararın giderilmesini talep etme haklarına sahipsin.",
        "Bu haklarını kullanmak için {email} adresine yazabilirsin. Hesabını uygulama içinden de kalıcı olarak silebilirsin: Profil → Hesap → Hesabımı sil.",
      ],
    },
  ],
};

const trTerms: LegalDoc = {
  slug: "terms",
  title: "Kullanım Şartları",
  updated: UPDATED,
  intro:
    "Vibe Tag'i kullanarak aşağıdaki kuralları kabul etmiş olursun. Kurallar kısa, çünkü ürünün tamamı tek bir fikre dayanıyor: insanlar hakkında yalnızca gerçekten bildiğin kadarını söylemek.",
  sections: [
    {
      heading: "Değerlendirme kuralları",
      body: [
        "Bir kişiyi yalnızca gerçekten tanıdığın bağlamda değerlendirebilirsin. “Bu kişiyi nereden tanıyorsun?” sorusu zorunludur ve hangi kriterleri puanlayabileceğini belirler.",
        "Her kişiyi bir kez değerlendirirsin. Değerlendirmeni ayda bir güncelleyebilirsin; her güncellemede önceki sürüm arşivlenir.",
        "Sahte, intikam amaçlı veya karşılıklı anlaşmayla verilen değerlendirmeler yasaktır. Otomatik tespit sistemi bu tür oyların ağırlığını düşürür.",
      ],
    },
    {
      heading: "Notlar ve mesajlar",
      body: [
        "Hakaret, taciz, nefret söylemi, tehdit ve spam yasaktır. Notlarda telefon numarası, e-posta ve bağlantı paylaşılamaz.",
        "Doğrudan mesajlar yalnızca arkadaşlar arasında açıktır. Premium üyeler kendilerini değerlendirenlere yazabilir; değerlendiren kişi ancak kendisine yazıldıktan sonra cevap verebilir.",
      ],
    },
    {
      heading: "Moderasyon",
      body: [
        "Kurallara aykırı bulunan bir değerlendirme puan hesabından çıkarılır. Kurallara aykırı davranan bir hesap askıya alınabilir.",
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
      heading: "Hizmetin niteliği",
      body: [
        "Vibe Tag bir referans kontrol, kredi değerlendirme veya işe alım aracı değildir. Buradaki puanlar insanların öznel görüşlerinin bir özetidir; bir kişi hakkında hukuki veya finansal karar vermek için kullanılamaz.",
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
        "Account: name, username, email, an irreversible hash of your password (scrypt), and your bio and photo if you add them.",
        "Ratings: the scores you give and receive, the Vibe Tags chosen, notes, how you know each other, and the previous version of every update.",
        "Location: only if you turn on Nearby. It is rounded to roughly 100 metres before it is stored and is used solely to sort a list by distance. Off by default, and you can turn it off at any time.",
        "Messages: the direct messages you send and receive.",
        "Session: a session cookie in your browser, and one cookie holding your language choice.",
      ],
    },
    {
      heading: "Ratings and anonymity",
      body: [
        "Ratings are never shown attributed to a person in the interface. The database does record who rated whom — fraud detection, appeals and abuse review all require it.",
        "Gold membership reveals who rated you. Two things override that, always: a rater who chose to hide their identity, and a rating the fraud detector has protected. Neither is visible on any plan.",
      ],
    },
    {
      heading: "Why we process it",
      body: [
        "To create your account and keep you signed in; to build your profile and score; to detect fake ratings; to deliver notifications; and to review abuse reports. Nothing else.",
      ],
    },
    {
      heading: "What we do not do",
      body: [
        "We do not sell your data, share it with advertisers, or pass it to data brokers. Nothing leaves the service unless the law requires it.",
      ],
    },
    {
      heading: "Retention",
      body: [
        "We keep your data while your account exists. Deleting your account permanently removes your profile, every rating you gave and received, your invites, messages and notifications.",
        "One exception: a rating removed by moderation is hidden, not deleted. That is on purpose — a decision nobody can look at again is a decision nobody can appeal.",
      ],
    },
    {
      heading: "Security",
      body: [
        "Passwords are stored irreversibly (scrypt, with a per-user salt); no plaintext password is kept anywhere. The session cookie is httpOnly and cannot be read by JavaScript in the browser.",
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
      body: ["Identity and contact data, service usage data, and — only with your explicit consent — location data."],
      list: [
        "Identity: name, username.",
        "Contact: email address.",
        "Usage: ratings given and received, messages, invites, notifications, session records.",
        "Location: approximate (~100 m) position, only if you enabled Nearby.",
        "Image: your profile photo, if you uploaded one.",
      ],
    },
    {
      heading: "Purposes",
      body: [
        "Forming and performing the membership agreement, providing the service, computing your reputation profile, detecting fake ratings, keeping the service safe, and reviewing abuse reports.",
      ],
    },
    {
      heading: "Legal basis",
      body: [
        "Identity, contact and usage data are processed under Art. 5/2-c (necessary for a contract). Security and fraud detection rest on Art. 5/2-f (legitimate interest).",
        "Location data rests solely on your explicit consent under Art. 5/1. Withholding it affects nothing else — Nearby simply stays off — and you can withdraw it any time from the People screen.",
      ],
    },
    {
      heading: "Transfers",
      body: [
        "Your data is not transferred to third parties for marketing and is not transferred abroad. Apart from the hosting provider, there are no transfers; disclosure to competent authorities on a lawful request is reserved.",
      ],
    },
    {
      heading: "Your rights (Art. 11)",
      body: [
        "You may learn whether your data is processed and request information about it, learn the purpose and whether it is used accordingly, request correction of incomplete or inaccurate data, request erasure or destruction, request that these be notified to third parties the data was transferred to, object to a result reached solely by automated analysis, and claim compensation for damage.",
        "Write to {email} to exercise these. You can also delete your account permanently in the app: Profile → Account → Delete my account.",
      ],
    },
  ],
};

const enTerms: LegalDoc = {
  slug: "terms",
  title: "Terms of Use",
  updated: UPDATED,
  intro:
    "Using Vibe Tag means accepting the rules below. They are short, because the whole product rests on one idea: say only as much about a person as you actually know.",
  sections: [
    {
      heading: "Rating rules",
      body: [
        "You may rate someone only in the context you actually know them from. “How do you know this person?” is mandatory and decides which criteria you can score.",
        "You rate each person once. You may revise it once a month; every revision archives the previous version.",
        "Fake ratings, revenge ratings and arranged reciprocal ratings are prohibited. Automatic detection reduces the weight of such votes.",
      ],
    },
    {
      heading: "Notes and messages",
      body: [
        "Insults, harassment, hate speech, threats and spam are prohibited. Notes may not contain phone numbers, email addresses or links.",
        "Direct messages are open between friends. Premium members may write to people who rated them; the rater may only reply once written to.",
      ],
    },
    {
      heading: "Moderation",
      body: [
        "A rating found to break the rules stops counting towards scores. An account that breaks the rules may be suspended.",
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
      heading: "What this service is not",
      body: [
        "Vibe Tag is not a reference check, a credit score or a hiring tool. The numbers here summarise subjective human opinion and must not be used to make legal or financial decisions about a person.",
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

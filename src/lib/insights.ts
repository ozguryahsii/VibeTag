import { growthAreas, strongestTraits, type VibeProfile } from "@/lib/vibe";

/**
 * "AI My Vibe Summary" (§11).
 *
 * This is a deterministic, explainable engine: every sentence it produces
 * can be traced back to a number the user can also see. That matters for a
 * trust product — a hallucinated compliment is worse than none.
 *
 * `generateVibeSummary` is the single seam where a hosted LLM can be
 * plugged in later (see README → "AI katmanı"); the return shape is what
 * the UI renders, so a model-backed implementation only has to satisfy it.
 */

export type VibeSummary = {
  persona: string; // "A Reliable Leader"
  personaTr: string;
  headline: string; // one-line summary
  paragraph: string;
  strengths: { label: string; score: number; note: string }[];
  growth: { label: string; score: number; note: string }[];
  socialRead: string;
};

const PERSONA_MAP: Record<string, { en: string; tr: string }> = {
  reliability: { en: "The Dependable One", tr: "Güvenilir Kişi" },
  leadership: { en: "A Natural Leader", tr: "Doğal Lider" },
  kindness: { en: "The Kind Soul", tr: "İyi Kalpli" },
  empathy: { en: "The Empath", tr: "Empati Kuran" },
  problemSolving: { en: "The Problem Solver", tr: "Çözüm Üreten" },
  creativity: { en: "The Creative Mind", tr: "Yaratıcı Zihin" },
  positivity: { en: "The Energy Giver", tr: "Enerji Veren" },
  teamwork: { en: "The Team Anchor", tr: "Takımın Çıpası" },
  communication: { en: "The Communicator", tr: "İyi İletişimci" },
  honesty: { en: "The Straight Shooter", tr: "Dürüst Kişi" },
  supportiveness: { en: "The Supporter", tr: "Destekçi" },
  professionalism: { en: "The Professional", tr: "Profesyonel" },
  workQuality: { en: "The Craftsman", tr: "İşinin Ustası" },
  helpfulness: { en: "The Helper", tr: "Yardımsever" },
  punctuality: { en: "The Reliable Clock", tr: "Dakik Kişi" },
  diligence: { en: "The Hard Worker", tr: "Çalışkan" },
  responsibility: { en: "The Owner", tr: "Sorumluluk Alan" },
  fairness: { en: "The Fair Dealer", tr: "Adil Kişi" },
  respect: { en: "The Respectful One", tr: "Saygılı Kişi" },
  funToBeAround: { en: "The Good Time", tr: "Neşe Kaynağı" },
};

const STRENGTH_NOTES: Record<string, string> = {
  reliability: "Verdiğin sözü tutmanla tanınıyorsun.",
  leadership: "İnsanlar zor anlarda senden yön bekliyor.",
  kindness: "Çevrendekiler yanında rahat hissediyor.",
  empathy: "İnsanlar anlaşıldıklarını hissediyor.",
  problemSolving: "Tıkanan işler sana gelince açılıyor.",
  creativity: "Alışılmışın dışında fikirlerle anılıyorsun.",
  positivity: "Girdiğin ortamın enerjisini yükseltiyorsun.",
  teamwork: "Ekipler seninle daha iyi çalışıyor.",
  communication: "Ne demek istediğin net anlaşılıyor.",
  honesty: "İnsanlar senden doğruyu duyacağını biliyor.",
  supportiveness: "Zor günlerde akla ilk gelen kişilerdensin.",
  professionalism: "İşine yaklaşımın güven veriyor.",
  workQuality: "Ortaya koyduğun iş fark ediliyor.",
  helpfulness: "Yardım istemek sana kolay geliyor.",
  punctuality: "Zamanına güvenilebiliyor.",
  diligence: "Emek verdiğin görülüyor.",
  responsibility: "İşin sahibi olduğun hissediliyor.",
  fairness: "Ticarette adil olduğun konuşuluyor.",
  respect: "Sınırlara saygın fark ediliyor.",
  funToBeAround: "Seninle vakit geçirmek keyifli bulunuyor.",
};

const GROWTH_NOTES: Record<string, string> = {
  reliability: "Küçük sözleri de takip etmek burada fark yaratır.",
  leadership: "İnisiyatif aldığın anları daha görünür kılabilirsin.",
  kindness: "Yoğun anlarda tonun sertleşiyor olabilir.",
  empathy: "Dinlemeye biraz daha alan açmak iyi gelebilir.",
  problemSolving: "Çözümü paylaşırken adımları anlatmak katkı sağlar.",
  creativity: "Fikirlerini erken paylaşmak seni daha görünür yapar.",
  positivity: "Yorgun dönemlerde bu enerji dalgalanıyor olabilir.",
  teamwork: "Ortak kararlarda daha çok yer almak fayda sağlar.",
  communication: "Geri dönüş hızın beklentiyi karşılamıyor olabilir.",
  honesty: "Zor geri bildirimleri erken vermek güveni artırır.",
  supportiveness: "Destek teklifini açıkça söylemek fark yaratır.",
  professionalism: "Süreç ve takip tarafı biraz daha netleşebilir.",
  workQuality: "Son kontrol adımı sonucu yukarı taşıyabilir.",
  helpfulness: "Yardımı bitirene kadar takip etmek etkiyi artırır.",
  punctuality: "Küçük gecikmeler burada iz bırakıyor.",
  diligence: "Uzun soluklu işlerde tempo düşüyor olabilir.",
  responsibility: "Sahiplenmeyi sözle de belirtmek güven verir.",
  fairness: "Koşulları baştan netleştirmek beklentiyi hizalar.",
  respect: "Karşı tarafın alanına biraz daha dikkat iyi gelir.",
  funToBeAround: "Kendini bırakabildiğin ortamlarda daha çok görünüyorsun.",
};

function joinTr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}

export function generateVibeSummary(
  profile: VibeProfile,
  firstName: string,
): VibeSummary {
  if (profile.ratingCount === 0) {
    return {
      persona: "Fresh Start",
      personaTr: "Yeni Başlangıç",
      headline: "Henüz yeterli değerlendirme yok.",
      paragraph:
        "Vibe profilin oluşmaya başladığında, insanların sende gördüğü özellikleri burada göreceksin. En az 3 değerlendirme sonrası analiz açılır.",
      strengths: [],
      growth: [],
      socialRead:
        "Çevrendeki birkaç kişiyi davet ederek başlayabilirsin — profil ne kadar farklı çevreden beslenirse o kadar gerçekçi olur.",
    };
  }

  const top = strongestTraits(profile, 3);
  const grow = growthAreas(profile, 2);
  const topTags = profile.tags.slice(0, 3);

  const personaSeed = top[0]?.key ?? "kindness";
  const persona = PERSONA_MAP[personaSeed] ?? {
    en: "The Original",
    tr: "Kendine Özgü",
  };

  const tagWords = topTags.map((t) => t.tr.toLowerCase());
  const headline = tagWords.length
    ? `İnsanlar seni ${joinTr(tagWords)} biri olarak görüyor.`
    : `İnsanlar sende en çok ${top[0].label.toLowerCase()} görüyor.`;

  const dominant = profile.groups[0];
  const groupLine = dominant
    ? `Değerlendirmelerinin çoğu ${dominant.label.toLowerCase()} çevrenden geliyor (%${Math.round(
        dominant.share * 100,
      )}).`
    : "";

  const spread =
    profile.groups.filter((g) => g.count > 0).length >= 3
      ? "Farklı çevrelerden gelen algın birbirini destekliyor — bu, tutarlı bir sosyal kimlik işareti."
      : "Farklı çevrelerden de değerlendirme aldıkça profilin daha güçlü bir resme dönüşecek.";

  const paragraph = `${firstName}, ${profile.ratingCount} kişinin gözünden bakıldığında öne çıkan yönün ${top[0].label.toLowerCase()}${
    top[1] ? ` ve ${top[1].label.toLowerCase()}` : ""
  }. ${groupLine} ${spread}`.replace(/\s+/g, " ").trim();

  return {
    persona: persona.en,
    personaTr: persona.tr,
    headline,
    paragraph,
    strengths: top.map((t) => ({
      label: t.label,
      score: t.score,
      note: STRENGTH_NOTES[t.key] ?? "Bu yönün belirgin şekilde öne çıkıyor.",
    })),
    growth: grow.map((t) => ({
      label: t.label,
      score: t.score,
      note: GROWTH_NOTES[t.key] ?? "Bu alanda küçük bir odak fark yaratabilir.",
    })),
    socialRead: profile.hasEnoughData
      ? `Sosyal algın ${profile.score} puanla ${
          profile.score >= 90
            ? "çok güçlü"
            : profile.score >= 80
              ? "güçlü ve tutarlı"
              : "gelişmeye açık"
        } görünüyor.`
      : "Analiz güvenilirliği için en az 3 değerlendirme öneriyoruz.",
  };
}

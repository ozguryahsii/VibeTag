/**
 * Vibe Tag taxonomy.
 *
 * Everything a rater is allowed to say about someone flows from one
 * mandatory answer: "Bu kişiyi nereden tanıyorsun?".
 *
 * The relationship key gates:
 *   - which traits (1..5 scored criteria) may be submitted
 *   - which vibe tags may be attached
 *
 * A market cashier you bought bread from can be rated on kindness and
 * professionalism — never on friendship, leadership or family qualities.
 */

export type ContextGroup = "PROFESSIONAL" | "SOCIAL" | "COMMERCE" | "OTHER";

export const CONTEXT_GROUPS: Record<
  ContextGroup,
  { label: string; emoji: string; blurb: string }
> = {
  PROFESSIONAL: {
    label: "Profesyonel",
    emoji: "💼",
    blurb: "İş, proje veya kariyer ilişkisi",
  },
  SOCIAL: {
    label: "Sosyal",
    emoji: "🫂",
    blurb: "Arkadaşlık, aile ve sosyal çevre",
  },
  COMMERCE: {
    label: "Hizmet / Ticaret",
    emoji: "🛍️",
    blurb: "Alışveriş, hizmet ve ticari ilişki",
  },
  OTHER: {
    label: "Diğer",
    emoji: "🌐",
    blurb: "Online ve topluluk tanışıklığı",
  },
};

// ------------------------------------------------------------ traits

export type TraitKey =
  | "reliability"
  | "communication"
  | "kindness"
  | "helpfulness"
  | "professionalism"
  | "responsibility"
  | "teamwork"
  | "problemSolving"
  | "diligence"
  | "leadership"
  | "punctuality"
  | "honesty"
  | "empathy"
  | "supportiveness"
  | "funToBeAround"
  | "creativity"
  | "workQuality"
  | "fairness"
  | "respect"
  | "positivity";

export type Trait = {
  key: TraitKey;
  label: string; // Turkish, shown in the rating flow
  en: string; // English, shown on insights / cards
  emoji: string;
  hint: string;
};

export const TRAITS: Record<TraitKey, Trait> = {
  reliability: {
    key: "reliability",
    label: "Güvenilirlik",
    en: "Reliability",
    emoji: "🤝",
    hint: "Sözünü tutar mı?",
  },
  communication: {
    key: "communication",
    label: "İletişim",
    en: "Communication",
    emoji: "💬",
    hint: "Kendini net ifade eder mi?",
  },
  kindness: {
    key: "kindness",
    label: "Kibarlık",
    en: "Kindness",
    emoji: "❤️",
    hint: "Nazik ve saygılı mı?",
  },
  helpfulness: {
    key: "helpfulness",
    label: "Yardımseverlik",
    en: "Helpfulness",
    emoji: "🙌",
    hint: "İhtiyaç anında yardım eder mi?",
  },
  professionalism: {
    key: "professionalism",
    label: "Profesyonellik",
    en: "Professionalism",
    emoji: "🏆",
    hint: "İşini ciddiye alır mı?",
  },
  responsibility: {
    key: "responsibility",
    label: "Sorumluluk",
    en: "Responsibility",
    emoji: "🎯",
    hint: "Sorumluluk alır mı?",
  },
  teamwork: {
    key: "teamwork",
    label: "Takım çalışması",
    en: "Teamwork",
    emoji: "🧩",
    hint: "Ekiple uyumlu çalışır mı?",
  },
  problemSolving: {
    key: "problemSolving",
    label: "Problem çözme",
    en: "Problem Solving",
    emoji: "💡",
    hint: "Çözüm üretir mi?",
  },
  diligence: {
    key: "diligence",
    label: "Çalışkanlık",
    en: "Diligence",
    emoji: "⚡",
    hint: "Emek verir mi?",
  },
  leadership: {
    key: "leadership",
    label: "Liderlik",
    en: "Leadership",
    emoji: "🚀",
    hint: "Yön gösterir mi?",
  },
  punctuality: {
    key: "punctuality",
    label: "Dakiklik",
    en: "Punctuality",
    emoji: "⏱️",
    hint: "Zamanına sadık mı?",
  },
  honesty: {
    key: "honesty",
    label: "Dürüstlük",
    en: "Honesty",
    emoji: "🛡️",
    hint: "Açık ve dürüst mü?",
  },
  empathy: {
    key: "empathy",
    label: "Empati",
    en: "Empathy",
    emoji: "🫶",
    hint: "Seni anlar mı?",
  },
  supportiveness: {
    key: "supportiveness",
    label: "Destekleyicilik",
    en: "Supportiveness",
    emoji: "🌱",
    hint: "Zor anında yanında mı?",
  },
  funToBeAround: {
    key: "funToBeAround",
    label: "Eğlenceli olma",
    en: "Fun",
    emoji: "😄",
    hint: "Birlikte vakit geçirmek keyifli mi?",
  },
  creativity: {
    key: "creativity",
    label: "Yaratıcılık",
    en: "Creativity",
    emoji: "🌟",
    hint: "Farklı fikirler üretir mi?",
  },
  workQuality: {
    key: "workQuality",
    label: "İş kalitesi",
    en: "Work Quality",
    emoji: "✨",
    hint: "Ortaya çıkan iş iyi mi?",
  },
  fairness: {
    key: "fairness",
    label: "Dürüst ticaret",
    en: "Fairness",
    emoji: "⚖️",
    hint: "Fiyat ve şartlarda adil mi?",
  },
  respect: {
    key: "respect",
    label: "Saygı",
    en: "Respect",
    emoji: "🙏",
    hint: "Sınırlara saygılı mı?",
  },
  positivity: {
    key: "positivity",
    label: "Pozitif enerji",
    en: "Positive Energy",
    emoji: "🔥",
    hint: "Ortama enerji katar mı?",
  },
};

// ---------------------------------------------------- relationships

export type RelationshipKey =
  // professional
  | "sameCompany"
  | "wasMyManager"
  | "wasMyEmployee"
  | "sameProject"
  | "wasMyClient"
  // social
  | "closeFriend"
  | "friend"
  | "socialCircle"
  | "familyCircle"
  // commerce
  | "knowAsSeller"
  | "knowAsCustomer"
  | "receivedService"
  | "providedService"
  // other
  | "online"
  | "community"
  | "other";

export type Relationship = {
  key: RelationshipKey;
  group: ContextGroup;
  label: string;
  en: string;
  emoji: string;
  /** Traits this relationship may score. Order matters in the UI. */
  traits: TraitKey[];
};

export const RELATIONSHIPS: Record<RelationshipKey, Relationship> = {
  sameCompany: {
    key: "sameCompany",
    group: "PROFESSIONAL",
    label: "Aynı şirkette çalıştık",
    en: "Same company",
    emoji: "🏢",
    traits: [
      "reliability",
      "communication",
      "teamwork",
      "professionalism",
      "diligence",
      "positivity",
    ],
  },
  wasMyManager: {
    key: "wasMyManager",
    group: "PROFESSIONAL",
    label: "Yöneticimdi",
    en: "Was my manager",
    emoji: "🧭",
    traits: [
      "leadership",
      "communication",
      "reliability",
      "empathy",
      "professionalism",
      "problemSolving",
    ],
  },
  wasMyEmployee: {
    key: "wasMyEmployee",
    group: "PROFESSIONAL",
    label: "Çalışanımdı",
    en: "Was my employee",
    emoji: "📋",
    traits: [
      "responsibility",
      "diligence",
      "reliability",
      "problemSolving",
      "punctuality",
      "teamwork",
    ],
  },
  sameProject: {
    key: "sameProject",
    group: "PROFESSIONAL",
    label: "Aynı projede çalıştık",
    en: "Same project",
    emoji: "🧑‍💻",
    traits: [
      "reliability",
      "responsibility",
      "teamwork",
      "problemSolving",
      "diligence",
      "communication",
    ],
  },
  wasMyClient: {
    key: "wasMyClient",
    group: "PROFESSIONAL",
    label: "Müşterimdi",
    en: "Was my client",
    emoji: "🤝",
    traits: [
      "communication",
      "respect",
      "reliability",
      "punctuality",
      "fairness",
    ],
  },

  closeFriend: {
    key: "closeFriend",
    group: "SOCIAL",
    label: "Yakın arkadaşım",
    en: "Close friend",
    emoji: "💛",
    traits: [
      "honesty",
      "empathy",
      "reliability",
      "supportiveness",
      "funToBeAround",
      "positivity",
    ],
  },
  friend: {
    key: "friend",
    group: "SOCIAL",
    label: "Arkadaşım",
    en: "Friend",
    emoji: "🙂",
    traits: [
      "reliability",
      "kindness",
      "funToBeAround",
      "supportiveness",
      "positivity",
    ],
  },
  socialCircle: {
    key: "socialCircle",
    group: "SOCIAL",
    label: "Sosyal çevreden tanıyorum",
    en: "Social circle",
    emoji: "🎉",
    traits: ["kindness", "respect", "funToBeAround", "positivity", "communication"],
  },
  familyCircle: {
    key: "familyCircle",
    group: "SOCIAL",
    label: "Aile çevresinden tanıyorum",
    en: "Family circle",
    emoji: "🏡",
    traits: ["kindness", "respect", "supportiveness", "reliability", "empathy"],
  },

  knowAsSeller: {
    key: "knowAsSeller",
    group: "COMMERCE",
    label: "Satıcı olarak tanıyorum",
    en: "Know as seller",
    emoji: "🏪",
    traits: ["fairness", "kindness", "communication", "reliability", "workQuality"],
  },
  knowAsCustomer: {
    key: "knowAsCustomer",
    group: "COMMERCE",
    label: "Müşteri olarak tanıyorum",
    en: "Know as customer",
    emoji: "🧾",
    traits: ["respect", "communication", "punctuality", "fairness", "kindness"],
  },
  receivedService: {
    key: "receivedService",
    group: "COMMERCE",
    label: "Hizmet aldım",
    en: "Received service",
    emoji: "🛎️",
    traits: [
      "kindness",
      "communication",
      "helpfulness",
      "professionalism",
      "workQuality",
      "punctuality",
    ],
  },
  providedService: {
    key: "providedService",
    group: "COMMERCE",
    label: "Hizmet verdim",
    en: "Provided service",
    emoji: "🔧",
    traits: ["respect", "communication", "fairness", "punctuality", "kindness"],
  },

  online: {
    key: "online",
    group: "OTHER",
    label: "Online tanışıyoruz",
    en: "Met online",
    emoji: "💻",
    traits: ["communication", "kindness", "helpfulness", "positivity"],
  },
  community: {
    key: "community",
    group: "OTHER",
    label: "Topluluk / grup üzerinden",
    en: "Community",
    emoji: "🌍",
    traits: [
      "helpfulness",
      "communication",
      "kindness",
      "positivity",
      "creativity",
    ],
  },
  other: {
    key: "other",
    group: "OTHER",
    label: "Diğer",
    en: "Other",
    emoji: "✳️",
    traits: ["kindness", "communication", "respect"],
  },
};

export const RELATIONSHIP_KEYS = Object.keys(RELATIONSHIPS) as RelationshipKey[];

export function relationshipsByGroup(group: ContextGroup): Relationship[] {
  return RELATIONSHIP_KEYS.map((k) => RELATIONSHIPS[k]).filter(
    (r) => r.group === group,
  );
}

export function isRelationshipKey(v: unknown): v is RelationshipKey {
  return typeof v === "string" && v in RELATIONSHIPS;
}

// --------------------------------------------------------- vibe tags

export type VibeTagKey =
  | "positiveEnergy"
  | "reliable"
  | "kind"
  | "problemSolver"
  | "leader"
  | "focused"
  | "creative"
  | "supportive"
  | "funny"
  | "punctual"
  | "trustworthy"
  | "goodListener"
  | "communicator"
  | "teamPlayer"
  | "inspiring"
  | "professional"
  | "generous"
  | "calm";

export type VibeTag = {
  key: VibeTagKey;
  en: string; // tags are always displayed in English (brand language)
  tr: string;
  emoji: string;
  /** Contexts in which this tag may be given. */
  groups: ContextGroup[];
};

export const VIBE_TAGS: Record<VibeTagKey, VibeTag> = {
  positiveEnergy: {
    key: "positiveEnergy",
    en: "Positive Energy",
    tr: "Pozitif Enerji",
    emoji: "🔥",
    groups: ["PROFESSIONAL", "SOCIAL", "COMMERCE", "OTHER"],
  },
  reliable: {
    key: "reliable",
    en: "Reliable",
    tr: "Güvenilir",
    emoji: "🤝",
    groups: ["PROFESSIONAL", "SOCIAL", "COMMERCE", "OTHER"],
  },
  kind: {
    key: "kind",
    en: "Kind",
    tr: "Kibar",
    emoji: "❤️",
    groups: ["PROFESSIONAL", "SOCIAL", "COMMERCE", "OTHER"],
  },
  problemSolver: {
    key: "problemSolver",
    en: "Problem Solver",
    tr: "Çözüm Odaklı",
    emoji: "💡",
    groups: ["PROFESSIONAL", "COMMERCE", "OTHER"],
  },
  leader: {
    key: "leader",
    en: "Leader",
    tr: "Lider",
    emoji: "🚀",
    groups: ["PROFESSIONAL"],
  },
  focused: {
    key: "focused",
    en: "Focused",
    tr: "Odaklı",
    emoji: "🎯",
    groups: ["PROFESSIONAL", "OTHER"],
  },
  creative: {
    key: "creative",
    en: "Creative",
    tr: "Yaratıcı",
    emoji: "🌟",
    groups: ["PROFESSIONAL", "SOCIAL", "OTHER"],
  },
  supportive: {
    key: "supportive",
    en: "Supportive",
    tr: "Destekleyici",
    emoji: "🫶",
    groups: ["PROFESSIONAL", "SOCIAL", "OTHER"],
  },
  funny: {
    key: "funny",
    en: "Fun",
    tr: "Eğlenceli",
    emoji: "😄",
    groups: ["SOCIAL", "OTHER"],
  },
  punctual: {
    key: "punctual",
    en: "Punctual",
    tr: "Dakik",
    emoji: "⏱️",
    groups: ["PROFESSIONAL", "COMMERCE"],
  },
  trustworthy: {
    key: "trustworthy",
    en: "Trustworthy",
    tr: "Güven Veren",
    emoji: "🛡️",
    groups: ["PROFESSIONAL", "SOCIAL", "COMMERCE"],
  },
  goodListener: {
    key: "goodListener",
    en: "Good Listener",
    tr: "İyi Dinleyici",
    emoji: "🎧",
    groups: ["SOCIAL", "PROFESSIONAL", "OTHER"],
  },
  communicator: {
    key: "communicator",
    en: "Communicator",
    tr: "İyi İletişimci",
    emoji: "💬",
    groups: ["PROFESSIONAL", "COMMERCE", "OTHER", "SOCIAL"],
  },
  teamPlayer: {
    key: "teamPlayer",
    en: "Team Player",
    tr: "Takım Oyuncusu",
    emoji: "🧩",
    groups: ["PROFESSIONAL"],
  },
  inspiring: {
    key: "inspiring",
    en: "Inspiring",
    tr: "İlham Veren",
    emoji: "✨",
    groups: ["PROFESSIONAL", "SOCIAL", "OTHER"],
  },
  professional: {
    key: "professional",
    en: "Professional",
    tr: "Profesyonel",
    emoji: "🏆",
    groups: ["PROFESSIONAL", "COMMERCE"],
  },
  generous: {
    key: "generous",
    en: "Generous",
    tr: "Cömert",
    emoji: "🎁",
    groups: ["SOCIAL", "COMMERCE"],
  },
  calm: {
    key: "calm",
    en: "Calm",
    tr: "Sakin",
    emoji: "🌊",
    groups: ["PROFESSIONAL", "SOCIAL", "COMMERCE", "OTHER"],
  },
};

export const VIBE_TAG_KEYS = Object.keys(VIBE_TAGS) as VibeTagKey[];

export function isVibeTagKey(v: unknown): v is VibeTagKey {
  return typeof v === "string" && v in VIBE_TAGS;
}

/** Tags a rater may attach given the relationship they declared. */
export function allowedVibeTags(relationship: RelationshipKey): VibeTag[] {
  const group = RELATIONSHIPS[relationship].group;
  return VIBE_TAG_KEYS.map((k) => VIBE_TAGS[k]).filter((t) =>
    t.groups.includes(group),
  );
}

/** Traits a rater may score given the relationship they declared. */
export function allowedTraits(relationship: RelationshipKey): Trait[] {
  return RELATIONSHIPS[relationship].traits.map((k) => TRAITS[k]);
}

/** Hard server-side guard — the whole trust model rests on this. */
export function assertAllowed(
  relationship: RelationshipKey,
  traitKeys: string[],
  tagKeys: string[],
): { ok: true } | { ok: false; error: string } {
  const traits = new Set(RELATIONSHIPS[relationship].traits as string[]);
  for (const t of traitKeys) {
    if (!traits.has(t)) {
      return {
        ok: false,
        error: `"${TRAITS[t as TraitKey]?.label ?? t}" bu tanışıklık türünde değerlendirilemez.`,
      };
    }
  }
  const tags = new Set(allowedVibeTags(relationship).map((t) => t.key as string));
  for (const t of tagKeys) {
    if (!tags.has(t)) {
      return {
        ok: false,
        error: `"${VIBE_TAGS[t as VibeTagKey]?.en ?? t}" etiketi bu tanışıklık türünde verilemez.`,
      };
    }
  }
  return { ok: true };
}

export const MAX_VIBE_TAGS_PER_RATING = 5;
export const MIN_VIBE_TAGS_PER_RATING = 1;
/** §8 — a rater may revise their rating once every 30 days. */
export const RATING_UPDATE_COOLDOWN_DAYS = 30;

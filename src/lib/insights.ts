import { growthAreas, strongestTraits, type VibeProfile } from "@/lib/vibe";
import { fill, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { groupLabel, tagLabel, traitLabel } from "@/lib/labels";

/**
 * "AI My Vibe Summary" (§11).
 *
 * This is a deterministic, explainable engine: every sentence it produces
 * can be traced back to a number the user can also see. That matters for a
 * trust product — a hallucinated compliment is worse than none.
 *
 * `generateVibeSummary` is the single seam where a hosted LLM can be
 * plugged in later; the return shape is what the UI renders, so a
 * model-backed implementation only has to satisfy it — and it would have to
 * produce copy in the reader's language, which is why the dictionary is an
 * argument rather than an import.
 */

export type VibeSummary = {
  persona: string;
  headline: string;
  paragraph: string;
  strengths: { key: string; label: string; score: number; note: string }[];
  growth: { key: string; label: string; score: number; note: string }[];
  socialRead: string;
};

function joinList(items: string[], andWord: string): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} ${andWord} ${items[items.length - 1]}`;
}

export function generateVibeSummary(
  profile: VibeProfile,
  firstName: string,
  d: Dictionary,
  locale: Locale,
): VibeSummary {
  if (profile.ratingCount === 0) {
    return {
      persona: d.ai.emptyPersona,
      headline: d.ai.emptyHeadline,
      paragraph: d.ai.emptyParagraph,
      strengths: [],
      growth: [],
      socialRead: d.ai.emptySocial,
    };
  }

  const top = strongestTraits(profile, 3);
  const grow = growthAreas(profile, 2);
  const topTags = profile.tags.slice(0, 3);

  const personas = d.ai.personas;
  const persona =
    personas[(top[0]?.key ?? "kindness") as keyof typeof personas] ??
    d.ai.personaFallback;

  const headline = topTags.length
    ? fill(d.ai.headlineTags, {
        tags: joinList(
          topTags.map((t) => tagLabel(t.key, locale)),
          locale === "tr" ? "ve" : "and",
        ),
      })
    : fill(d.ai.headlineTrait, {
        trait: traitLabel(top[0].key, locale).toLocaleLowerCase(locale),
      });

  const dominant = profile.groups[0];
  const groupLine = dominant
    ? fill(d.ai.groupLine, {
        group: groupLabel(dominant.group, d).toLocaleLowerCase(locale),
        pct: Math.round(dominant.share * 100),
      })
    : "";

  const spread =
    profile.groups.filter((g) => g.count > 0).length >= 3
      ? d.ai.spreadStrong
      : d.ai.spreadThin;

  const paragraph = fill(d.ai.paragraph, {
    name: firstName,
    n: profile.ratingCount,
    first: traitLabel(top[0].key, locale).toLocaleLowerCase(locale),
    second: top[1]
      ? fill(d.ai.and, {
          trait: traitLabel(top[1].key, locale).toLocaleLowerCase(locale),
        })
      : "",
    group: groupLine,
    spread,
  })
    .replace(/\s+/g, " ")
    .trim();

  const level =
    profile.score >= 90
      ? d.ai.levelStrong
      : profile.score >= 80
        ? d.ai.levelSolid
        : d.ai.levelGrowing;

  return {
    persona,
    headline,
    paragraph,
    strengths: top.map((t) => ({
      key: t.key,
      label: traitLabel(t.key, locale),
      score: t.score,
      note: d.ai.strengthNotes[t.key as keyof Dictionary["ai"]["strengthNotes"]] ?? "",
    })),
    growth: grow.map((t) => ({
      key: t.key,
      label: traitLabel(t.key, locale),
      score: t.score,
      note: d.ai.growthNotes[t.key as keyof Dictionary["ai"]["growthNotes"]] ?? "",
    })),
    socialRead: profile.hasEnoughData
      ? fill(d.ai.socialRead, { score: profile.score, level })
      : d.ai.notEnough,
  };
}

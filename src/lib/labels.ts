import { TRAITS, VIBE_TAGS, type TraitKey, type VibeTagKey } from "@/lib/taxonomy";
import { fill, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Badge, BadgeTier } from "@/lib/badges";

/**
 * Locale-aware names for the taxonomy.
 *
 * The only vocabulary that stays fixed across languages is the product's own:
 * "Vibe", "My Vibe", "Vibe Score", "Vibe Card", "Vibe Insights". Everything a
 * person actually reads about themselves — traits, tag names, relationships,
 * badges — is translated, because that is the part they are meant to feel.
 */

export function traitLabel(key: string, locale: Locale): string {
  const t = TRAITS[key as TraitKey];
  if (!t) return key;
  return locale === "tr" ? t.label : t.en;
}

export function tagLabel(key: string, locale: Locale): string {
  const t = VIBE_TAGS[key as VibeTagKey];
  if (!t) return key;
  return locale === "tr" ? t.tr : t.en;
}

export function traitHint(key: string, d: Dictionary): string {
  return d.traitHints[key as keyof Dictionary["traitHints"]] ?? "";
}

export function relationshipLabel(key: string, d: Dictionary): string {
  return d.relationships[key as keyof Dictionary["relationships"]] ?? key;
}

export function groupLabel(key: string, d: Dictionary): string {
  return d.groups[key as keyof Dictionary["groups"]]?.label ?? key;
}

export function groupBlurb(key: string, d: Dictionary): string {
  return d.groups[key as keyof Dictionary["groups"]]?.blurb ?? "";
}

export function badgeLabel(key: string, d: Dictionary): string {
  return d.badges[key as keyof Dictionary["badges"]]?.label ?? key;
}

export function tierLabel(tier: BadgeTier, d: Dictionary): string {
  return d.badgeTiers[tier];
}

/**
 * What a tier asks for, as a sentence: "Reliability 85+ · 8 ratings".
 *
 * Built from the numbers rather than written out per tier — thirty hand-typed
 * requirement strings across two languages is thirty chances for the copy and
 * the code to drift apart, and the one that lies is always the copy.
 */
export function badgeRequirement(
  badge: Badge,
  d: Dictionary,
  locale: Locale,
): string {
  return badge.requirements
    .map(({ metric, need }) =>
      metric.kind === "trait"
        ? fill(d.badgesPage.metrics.trait, {
            label: traitLabel(metric.key, locale),
            n: need,
          })
        : fill(
            d.badgesPage.metrics[
              metric.key as keyof Dictionary["badgesPage"]["metrics"]
            ] ?? "{n}",
            { n: need },
          ),
    )
    .join(" · ");
}

/** "42%" in English, "%42" in Turkish — the sign sits on opposite sides. */
export function percent(value: number, locale: Locale): string {
  const n = Math.round(value);
  return locale === "tr" ? `%${n}` : `${n}%`;
}

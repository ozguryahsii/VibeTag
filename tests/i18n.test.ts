import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { tr } from "@/lib/i18n/tr";
import { fill } from "@/lib/i18n";

type Node = Record<string, unknown>;

/** Every leaf path in a dictionary, e.g. "home.topPercent". */
function paths(node: Node, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const here = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      return value.flatMap((item, i) =>
        item && typeof item === "object"
          ? paths(item as Node, `${here}[${i}]`)
          : [`${here}[${i}]`],
      );
    }
    if (value && typeof value === "object") return paths(value as Node, here);
    return [here];
  });
}

function at(node: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce<unknown>((acc, k) => (acc as Node | undefined)?.[k], node);
}

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/**
 * TypeScript already guarantees Turkish has every English key. What it cannot
 * check is the inside of the strings — and a placeholder that exists in one
 * language and not the other renders a literal "{n}" on screen for exactly
 * half the users.
 */
describe("dictionaries", () => {
  const enPaths = paths(en as unknown as Node);

  it("cover the same shape", () => {
    expect(paths(tr as unknown as Node)).toEqual(enPaths);
  });

  it("use the same placeholders in both languages", () => {
    for (const path of enPaths) {
      const a = at(en, path);
      const b = at(tr, path);
      if (typeof a !== "string" || typeof b !== "string") continue;
      expect(placeholders(b), path).toEqual(placeholders(a));
    }
  });

  it("leave no string empty", () => {
    // scoreWords is 1-indexed so `scoreWords[score]` works for 1..5; slot 0
    // is padding and is meant to be blank.
    const INTENTIONALLY_BLANK = ["rateFlow.scoreWords[0]"];

    for (const path of enPaths) {
      if (INTENTIONALLY_BLANK.includes(path)) continue;
      for (const [name, dict] of [["en", en], ["tr", tr]] as const) {
        const value = at(dict, path);
        if (typeof value !== "string") continue;
        expect(value.trim().length, `${name}.${path}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the product's own vocabulary identical in both", () => {
    // The one thing that must not be translated: "My Vibe" is the same words
    // in Turkish, and the plan names are brand, not description.
    expect(tr.nav.myVibe).toBe(en.nav.myVibe);
    expect(tr.nav.insights).toBe(en.nav.insights);
    expect(tr.insights.title).toBe(en.insights.title);
    expect(tr.card.title).toBe(en.card.title);
    expect(tr.common.appName).toBe(en.common.appName);
  });
});

describe("fill", () => {
  it("substitutes what it is given and leaves the rest alone", () => {
    expect(fill("Top {n}% of users", { n: 2 })).toBe("Top 2% of users");
    expect(fill("En iyi %{n} içinde", { n: 2 })).toBe("En iyi %2 içinde");
    expect(fill("{a} and {b}", { a: "x" })).toBe("x and {b}");
    expect(fill("nothing to do")).toBe("nothing to do");
  });
});

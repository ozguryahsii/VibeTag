import { describe, expect, it } from "vitest";
import {
  isReportReason,
  moderateComment,
  RATING_REPORT_REASONS,
  REPORT_REASONS,
  THREAD_REPORT_REASONS,
} from "@/lib/moderation";
import { parseFlags } from "@/lib/fraud-flags";

describe("comment moderation", () => {
  it("lets an ordinary note through", () => {
    expect(moderateComment("Söz verdiği işi zamanında teslim etti.")).toEqual({
      ok: true,
    });
    expect(moderateComment("")).toEqual({ ok: true });
  });

  it("catches an insult", () => {
    const verdict = moderateComment("tam bir gerizekalı");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe("abusive");
  });

  it("catches the cheap evasions", () => {
    // Leet digits, padded repeats and stray punctuation all normalise back.
    for (const attempt of ["g3riz3kali", "s   a   l   a   k", "a.p.t.a.l"]) {
      const verdict = moderateComment(attempt);
      expect(verdict.ok, attempt).toBe(false);
    }
  });

  it("keeps contact details out of a public note", () => {
    const email = moderateComment("bana yaz: biri@ornek.com");
    expect(email.ok).toBe(false);
    if (!email.ok) expect(email.reason).toBe("contact");

    const phone = moderateComment("0555 123 45 67");
    expect(phone.ok).toBe(false);
    if (!phone.ok) expect(phone.reason).toBe("contact");
  });

  it("keeps links out", () => {
    const verdict = moderateComment("bak https://spam.example");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe("link");
  });
});

describe("report reasons", () => {
  it("offers only complaints that can be true of the surface", () => {
    // "Unfair" is meaningless about a DM; "harassment" is meaningless about
    // a score. Each list is a subset of the full set so the server can still
    // validate everything with one check.
    expect(RATING_REPORT_REASONS).not.toContain("HARASSMENT");
    expect(THREAD_REPORT_REASONS).not.toContain("UNFAIR");
    for (const r of [...RATING_REPORT_REASONS, ...THREAD_REPORT_REASONS]) {
      expect(REPORT_REASONS).toContain(r);
      expect(isReportReason(r)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    expect(isReportReason("BECAUSE_I_SAID_SO")).toBe(false);
    expect(isReportReason(null)).toBe(false);
  });
});

describe("fraud flag parsing", () => {
  it("reads back what the detector stored", () => {
    expect(parseFlags('["NEW_ACCOUNT","BURST"]')).toEqual([
      "NEW_ACCOUNT",
      "BURST",
    ]);
  });

  it("survives junk instead of crashing a moderation screen", () => {
    expect(parseFlags("[]")).toEqual([]);
    expect(parseFlags("not json")).toEqual([]);
    expect(parseFlags('{"nope":1}')).toEqual([]);
    expect(parseFlags('["NEW_ACCOUNT","RETIRED_FLAG"]')).toEqual(["NEW_ACCOUNT"]);
  });
});

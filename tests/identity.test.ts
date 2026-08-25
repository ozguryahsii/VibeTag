import { describe, expect, it } from "vitest";
import { loginWhere, normalizeUsername } from "@/lib/identity";

describe("sign-in identifier", () => {
  it("treats anything with an @ as an email", () => {
    expect(loginWhere("Ozgur@Example.COM")).toEqual({
      email: "ozgur@example.com",
    });
  });

  it("treats anything else as a username", () => {
    expect(loginWhere("OzgurYahsi")).toEqual({ username: "ozguryahsi" });
  });

  it("forgives surrounding whitespace", () => {
    // Phone keyboards add a trailing space after autocomplete more often
    // than anyone expects, and "no account matches" is a terrible way to
    // find that out.
    expect(loginWhere("  ozguryahsi \n")).toEqual({ username: "ozguryahsi" });
  });

  it("never strips characters out of what was typed", () => {
    // normalizeUsername() drops anything outside [a-z0-9_.] when *building* a
    // handle. Doing that at sign-in would quietly turn a typo into somebody
    // else's account, so a handle that cannot exist must simply not match.
    expect(loginWhere("ozgur yahsi")).toEqual({ username: "ozgur yahsi" });
  });
});

/**
 * Registration writes the handle; sign-in matches it. The two normalise in
 * different ways on purpose — one builds an identifier, the other matches
 * one — but they must never disagree about **case**, or an account is
 * created that its owner can never sign in to, with nothing on screen to
 * explain it.
 */
describe("registration and sign-in agree about case", () => {
  it("stores a handle that sign-in can find, however it was typed", () => {
    for (const typed of ["OzguR.Yahsi", "OZGUR.YAHSI", "ozgur.yahsi", " Ozgur.Yahsi "]) {
      const stored = normalizeUsername(typed);
      expect(stored).toBe("ozgur.yahsi");
      // What the sign-in box would look for, typed with any capitalisation
      // the phone's keyboard felt like adding.
      expect(loginWhere(typed)).toEqual({ username: stored });
    }
  });

  it("lower-cases the handle it stores", () => {
    expect(normalizeUsername("MixedCase")).toBe("mixedcase");
  });

  /*
   * Turkish letters are dropped rather than transliterated, so somebody who
   * types their own name gets a stump. Recorded rather than fixed: handles
   * already exist in the column under this rule, and changing it silently
   * would break the links people have shared. Worth revisiting on its own.
   */
  it("keeps only what a handle may contain", () => {
    expect(normalizeUsername("Özgür Yahşi!")).toBe("zgryahi");
  });
});

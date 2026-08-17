import { describe, expect, it } from "vitest";
import { loginWhere } from "@/lib/identity";

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

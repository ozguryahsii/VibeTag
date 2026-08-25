import type { Prisma } from "@prisma/client";

/**
 * What someone typed into the sign-in box.
 *
 * People do not reliably remember which address they registered with, but they
 * do remember the handle they picked — so either gets you in. Both columns are
 * stored lower-cased (registration normalises them), which is what makes a
 * plain equality match safe here rather than a case-insensitive scan.
 *
 * Deliberately not `normalizeUsername`: that strips characters to build a
 * handle, and stripping input at sign-in would let a typo silently match
 * somebody else's account.
 */
export function loginWhere(raw: string): Prisma.UserWhereInput {
  const value = raw.trim().toLowerCase();
  return value.includes("@") ? { email: value } : { username: value };
}

/**
 * The handle to store, built from whatever was typed at registration.
 *
 * Lower-casing here is what makes `loginWhere` safe: it can compare with a
 * plain equality match, because every handle in the column was written
 * through this function. The two must never disagree about case — a handle
 * stored with a capital letter would be unreachable at sign-in, and nothing
 * on screen would explain why.
 *
 * Unlike `loginWhere`, this *does* strip characters, because it is building
 * an identifier rather than matching one.
 */
export function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_.]/g, "");
}

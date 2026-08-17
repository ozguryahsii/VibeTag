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

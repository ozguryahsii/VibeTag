import type { Prisma } from "@prisma/client";

/**
 * Case-insensitive name/username search.
 *
 * `mode: "insensitive"` is required on PostgreSQL and easy to forget, because
 * SQLite's LIKE ignores case for free — which is exactly how this shipped
 * broken once: searching "elif" matched "Elif Demir" on the dev database and
 * would have stopped matching in production. It lives in one function so
 * there is a single place to get it right.
 *
 * Usernames are stored lower-case at registration, so they need nothing.
 */
export function nameSearch(query: string): Prisma.UserWhereInput[] {
  const q = query.trim();
  return [
    { name: { contains: q, mode: "insensitive" } },
    { username: { contains: q.toLowerCase() } },
  ];
}

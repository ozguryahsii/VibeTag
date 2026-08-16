import type { Prisma } from "@prisma/client";

/**
 * Case-insensitive name/username search that behaves the same on both
 * databases.
 *
 * `contains` is not portable: SQLite's LIKE ignores case for ASCII, Postgres's
 * does not. Searching "elif" would quietly stop matching "Elif Demir" the day
 * we switch providers — the kind of break that ships silently because the dev
 * database says it works.
 *
 * `mode: "insensitive"` is the Postgres answer and SQLite rejects it, so the
 * mode is only attached when the provider needs it — and the generated client
 * only types `mode` once the schema is Postgres, hence the cast. Username is
 * stored lower-case already, so it needs neither.
 */
const NEEDS_MODE = (process.env.DATABASE_URL ?? "").startsWith("postgres");

export function nameSearch(query: string): Prisma.UserWhereInput[] {
  const q = query.trim();
  const name = (
    NEEDS_MODE ? { contains: q, mode: "insensitive" } : { contains: q }
  ) as Prisma.StringFilter<"User">;

  return [{ name }, { username: { contains: q.toLowerCase() } }];
}

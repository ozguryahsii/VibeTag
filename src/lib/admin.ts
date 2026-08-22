import "server-only";
import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/auth";

/**
 * The numbers the admin screen shows, and the one write the scheduler needs.
 *
 * All of it is counting, so it is all one round trip's worth of parallel
 * queries rather than loading rows and reducing in JS — this page is opened
 * from a phone on a bad connection more often than from a desk.
 */

export type AdminStats = {
  members: number;
  newThisWeek: number;
  emailVerified: number;
  suspended: number;
  plans: Record<Plan, number>;
  expiring: number;
  ratings: number;
  ratingsThisWeek: number;
  openReports: number;
  errorsToday: number;
  activeCodes: number;
  redemptions: number;
};

export async function adminStats(): Promise<AdminStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const [
    members,
    newThisWeek,
    emailVerified,
    suspended,
    planGroups,
    expiring,
    ratings,
    ratingsThisWeek,
    openReports,
    errorsToday,
    activeCodes,
    redemptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.user.count({ where: { planUntil: { not: null, gt: now } } }),
    prisma.rating.count({ where: { hiddenAt: null } }),
    prisma.rating.count({ where: { hiddenAt: null, createdAt: { gte: weekAgo } } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.errorLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.discountCode.count({ where: { active: true } }),
    prisma.discountRedemption.count(),
  ]);

  const plans: Record<Plan, number> = { FREE: 0, SILVER: 0, GOLD: 0 };
  for (const row of planGroups) {
    if (row.plan in plans) plans[row.plan as Plan] = row._count._all;
  }

  return {
    members,
    newThisWeek,
    emailVerified,
    suspended,
    plans,
    expiring,
    ratings,
    ratingsThisWeek,
    openReports,
    errorsToday,
    activeCodes,
    redemptions,
  };
}

export type MemberRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  avatarColor: string;
  plan: string;
  planUntil: Date | null;
  emailVerifiedAt: Date | null;
  suspendedAt: Date | null;
  isAdmin: boolean;
  createdAt: Date;
};

const MEMBER_FIELDS = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
  avatarColor: true,
  plan: true,
  planUntil: true,
  emailVerifiedAt: true,
  suspendedAt: true,
  isAdmin: true,
  createdAt: true,
} as const;

/**
 * Find somebody to act on.
 *
 * Case-insensitive on purpose, and across name, username and email at once —
 * an admin looking somebody up has whichever of the three the person gave
 * them, not the one we happened to index. Postgres in development too, so
 * `mode: "insensitive"` behaves here exactly as it does live.
 */
export async function findMembers(
  query: string,
  plan: string | null,
  take = 40,
): Promise<MemberRow[]> {
  const q = query.trim();
  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { username: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(plan ? { plan } : {}),
  };

  return prisma.user.findMany({
    where,
    select: MEMBER_FIELDS,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export type CodeSummary = {
  id: string;
  code: string;
  note: string | null;
  plan: string;
  days: number | null;
  percentOff: number | null;
  maxUses: number | null;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
  uses: number;
  recent: { name: string; username: string; redeemedAt: Date }[];
};

export async function listCodes(take = 60): Promise<CodeSummary[]> {
  const rows = await prisma.discountCode.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      _count: { select: { redemptions: true } },
      redemptions: {
        orderBy: { redeemedAt: "desc" },
        take: 5,
        select: {
          redeemedAt: true,
          user: { select: { name: true, username: true } },
        },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    note: c.note,
    plan: c.plan,
    days: c.days,
    percentOff: c.percentOff,
    maxUses: c.maxUses,
    expiresAt: c.expiresAt,
    active: c.active,
    createdAt: c.createdAt,
    uses: c._count.redemptions,
    recent: c.redemptions.map((r) => ({
      name: r.user.name,
      username: r.user.username,
      redeemedAt: r.redeemedAt,
    })),
  }));
}

/**
 * Drop everybody whose granted plan has run out.
 *
 * Nothing reads `planUntil` at request time — `hasPlan` looks at `plan` and
 * nothing else, and it is called from dozens of places. Rather than teach all
 * of them about expiry, one nightly pass writes the truth into `plan`. The
 * cost is that a plan can be a few hours over; the gain is that no screen can
 * forget the check.
 */
export async function expirePlans(now = new Date()): Promise<number> {
  const result = await prisma.user.updateMany({
    where: { planUntil: { not: null, lte: now }, plan: { not: "FREE" } },
    data: { plan: "FREE", planUntil: null },
  });
  return result.count;
}

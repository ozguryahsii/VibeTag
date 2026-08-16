import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { groupLabel } from "@/lib/labels";
import { RELATIONSHIPS } from "@/lib/taxonomy";
import {
  dismissReportAction,
  hideRatingAction,
  suspendUserAction,
  takeReportAction,
  unsuspendUserAction,
} from "@/lib/actions/moderation";
import { Avatar } from "@/components/Avatar";
import { LangToggle } from "@/components/LangToggle";
import { Card, EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmt(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ModerationPage() {
  const me = await getCurrentUser();
  // Not a 403 — someone who is not staff should not learn this route exists.
  if (!me?.isAdmin) notFound();

  const d = await getDict();
  const locale = await getLocale();

  const [reports, suspended] = await Promise.all([
    prisma.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 60,
      include: {
        reporter: { select: { name: true, username: true } },
        reportedUser: {
          select: {
            name: true,
            username: true,
            avatarUrl: true,
            avatarColor: true,
            suspendedAt: true,
          },
        },
        reviewer: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { suspendedAt: { not: null } },
      select: {
        name: true,
        username: true,
        avatarUrl: true,
        avatarColor: true,
      },
      orderBy: { suspendedAt: "desc" },
    }),
  ]);

  // One extra read rather than a join: a report names a rating, and we want
  // the moderator to read what they are judging without ever surfacing who
  // wrote it — the reporter does not know, and this screen must not leak it.
  const ratingIds = reports
    .map((r) => r.ratingId)
    .filter((id): id is string => !!id);
  const ratings = ratingIds.length
    ? await prisma.rating.findMany({
        where: { id: { in: ratingIds } },
        select: {
          id: true,
          comment: true,
          relationship: true,
          hiddenAt: true,
          ratedUser: { select: { name: true, username: true } },
        },
      })
    : [];
  const ratingById = new Map(ratings.map((r) => [r.id, r]));

  const open = reports.filter((r) => r.status !== "ACTIONED" && r.status !== "DISMISSED");
  const closed = reports.filter((r) => r.status === "ACTIONED" || r.status === "DISMISSED");

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.moderation.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.moderation.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">
        {d.moderation.subtitle}
      </p>

      <div className="mt-6">
        <SectionTitle>
          {d.moderation.openTab}
          {open.length > 0 ? ` · ${open.length}` : ""}
        </SectionTitle>

        {open.length === 0 ? (
          <EmptyState
            emoji="✓"
            title={d.moderation.emptyTitle}
            body={d.moderation.emptyBody}
          />
        ) : (
          <div className="grid gap-2.5">
            {open.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                rating={r.ratingId ? ratingById.get(r.ratingId) : undefined}
                d={d}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      {suspended.length > 0 && (
        <div className="mt-7">
          <SectionTitle>{d.moderation.suspended}</SectionTitle>
          <div className="grid gap-2.5">
            {suspended.map((u) => (
              <Card key={u.username} className="flex items-center gap-3.5 !py-3.5">
                <Avatar
                  name={u.name}
                  url={u.avatarUrl}
                  color={u.avatarColor}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-extrabold truncate">{u.name}</p>
                  <p className="text-[11.5px] text-muted">@{u.username}</p>
                </div>
                <form action={unsuspendUserAction}>
                  <input type="hidden" name="username" value={u.username} />
                  <button className="text-[12px] font-bold text-orange bg-tagbg border border-orange/20 rounded-full px-3.5 py-2">
                    {d.moderation.unsuspend}
                  </button>
                </form>
              </Card>
            ))}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div className="mt-7 mb-2">
          <SectionTitle>{d.moderation.resolvedTab}</SectionTitle>
          <div className="grid gap-2.5">
            {closed.slice(0, 15).map((r) => (
              <Card key={r.id} className="!py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-bold">
                    {r.ratingId ? d.moderation.aboutRating : d.moderation.aboutUser}
                    {" · "}
                    <span className="text-muted font-semibold">
                      {d.report.reasons[r.reason as keyof Dictionary["report"]["reasons"]] ??
                        r.reason}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-[10.5px] font-black rounded-full px-2.5 py-1"
                    style={
                      r.status === "ACTIONED"
                        ? { color: "#fff", background: "#F05262" }
                        : { color: "#8C8177", background: "#F0E5DD" }
                    }
                  >
                    {r.status === "ACTIONED"
                      ? d.moderation.actioned
                      : d.moderation.dismissed}
                  </span>
                </div>
                {r.reviewer && (
                  <p className="text-[11px] text-muted mt-1">
                    {fill(d.moderation.decidedBy, { name: r.reviewer.name })}
                    {r.reviewedAt ? ` · ${fmt(r.reviewedAt, locale)}` : ""}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

type ReportRow = {
  id: string;
  reason: string;
  note: string | null;
  status: string;
  createdAt: Date;
  ratingId: string | null;
  reporter: { name: string; username: string };
  reportedUser: {
    name: string;
    username: string;
    avatarUrl: string | null;
    avatarColor: string;
    suspendedAt: Date | null;
  } | null;
};

type RatingRow = {
  id: string;
  comment: string | null;
  relationship: string;
  hiddenAt: Date | null;
  ratedUser: { name: string; username: string };
};

function ReportCard({
  report,
  rating,
  d,
  locale,
}: {
  report: ReportRow;
  rating?: RatingRow;
  d: Dictionary;
  locale: Locale;
}) {
  const isRating = !!report.ratingId;
  const reviewing = report.status === "REVIEWING";
  const done = isRating
    ? !!rating?.hiddenAt
    : !!report.reportedUser?.suspendedAt;

  return (
    <Card className="!py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold">
            {isRating ? d.moderation.aboutRating : d.moderation.aboutUser}
          </p>
          <p className="text-[11.5px] text-muted mt-0.5">
            {fill(d.moderation.reportedBy, { name: report.reporter.name })} ·{" "}
            {fmt(report.createdAt, locale)}
          </p>
        </div>
        {reviewing && (
          <span className="shrink-0 text-[10.5px] font-black text-orange bg-tagbg border border-orange/20 rounded-full px-2.5 py-1">
            {d.moderation.reviewing}
          </span>
        )}
      </div>

      <div className="mt-3 rounded-[16px] bg-cream border border-line px-3.5 py-3">
        <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted">
          {d.moderation.reasonLabel}
        </p>
        <p className="text-[13px] font-semibold mt-0.5">
          {d.report.reasons[report.reason as keyof Dictionary["report"]["reasons"]] ??
            report.reason}
        </p>
        <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted mt-2.5">
          {d.moderation.noteLabel}
        </p>
        <p className="text-[12.5px] text-muted leading-relaxed mt-0.5">
          {report.note || d.moderation.noNote}
        </p>
      </div>

      {/* What is being judged */}
      {isRating ? (
        <div className="mt-2.5 rounded-[16px] border-l-2 border-coral/40 bg-warmwhite px-3.5 py-3">
          {rating ? (
            <>
              <p className="text-[11.5px] text-muted font-semibold">
                {fill(d.moderation.ratingFrom, {
                  group: groupLabel(
                    RELATIONSHIPS[rating.relationship as keyof typeof RELATIONSHIPS]
                      ?.group ?? "OTHER",
                    d,
                  ),
                })}{" "}
                ·{" "}
                {fill(d.moderation.receivedBy, { name: rating.ratedUser.name })}
              </p>
              <p className="text-[13.5px] leading-relaxed mt-1.5">
                {rating.comment
                  ? `“${rating.comment}”`
                  : d.moderation.ratingNoComment}
              </p>
            </>
          ) : (
            <p className="text-[12.5px] text-muted">{d.moderation.ratingGone}</p>
          )}
        </div>
      ) : (
        report.reportedUser && (
          <Link
            href={`/u/${report.reportedUser.username}`}
            className="mt-2.5 flex items-center gap-3 rounded-[16px] bg-warmwhite border border-line px-3.5 py-3"
          >
            <Avatar
              name={report.reportedUser.name}
              url={report.reportedUser.avatarUrl}
              color={report.reportedUser.avatarColor}
              size={36}
            />
            <span className="min-w-0">
              <span className="block text-[13.5px] font-extrabold truncate">
                {report.reportedUser.name}
              </span>
              <span className="block text-[11.5px] text-muted">
                @{report.reportedUser.username}
              </span>
            </span>
          </Link>
        )
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        {!reviewing && (
          <form action={takeReportAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <button className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2">
              {d.moderation.take}
            </button>
          </form>
        )}

        {done ? (
          <span className="text-[12px] font-bold text-muted self-center">
            {isRating ? d.moderation.alreadyHidden : d.moderation.alreadySuspended}
          </span>
        ) : (
          <form action={isRating ? hideRatingAction : suspendUserAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <button className="text-[12px] font-bold text-white grad-score rounded-full px-3.5 py-2">
              {isRating ? d.moderation.hideRating : d.moderation.suspendUser}
            </button>
          </form>
        )}

        <form action={dismissReportAction}>
          <input type="hidden" name="reportId" value={report.id} />
          <button className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2">
            {d.moderation.dismiss}
          </button>
        </form>
      </div>
    </Card>
  );
}

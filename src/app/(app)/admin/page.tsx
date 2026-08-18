import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { adminStats } from "@/lib/admin";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { percent, planLabel } from "@/lib/labels";
import { LangToggle } from "@/components/LangToggle";
import { Card, Meter, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

function num(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-GB").format(value);
}

/**
 * Everything worth knowing at a glance, on a phone.
 *
 * Two tiles per row rather than a table: this is opened standing up, on the
 * way somewhere, and a table of eleven numbers on a 390px screen is a table
 * nobody reads. The four links underneath are the actual work — the numbers
 * only exist to tell you which one to tap.
 */
export default async function AdminPage() {
  const me = await getCurrentUser();
  // Same reasoning as /moderation: not a 403. Nobody learns this route exists.
  if (!me?.isAdmin) notFound();

  const [d, locale, s] = await Promise.all([getDict(), getLocale(), adminStats()]);
  const a = d.admin;

  const paid = s.plans.SILVER + s.plans.GOLD;
  const pct = (n: number) => (s.members ? Math.round((n / s.members) * 100) : 0);

  return (
    <main className="px-5 pt-10 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {a.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">{a.title}</h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">{a.subtitle}</p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Stat label={a.stats.members} value={num(s.members, locale)}
          hint={`+${num(s.newThisWeek, locale)} ${a.stats.newThisWeek}`} />
        <Stat label={a.stats.emailVerified} value={num(s.emailVerified, locale)}
          hint={fill(a.stats.ofMembers, { pct: pct(s.emailVerified) })} />
        <Stat label={a.stats.ratings} value={num(s.ratings, locale)}
          hint={`+${num(s.ratingsThisWeek, locale)} ${a.stats.ratingsThisWeek}`} />
        <Stat label={a.stats.suspended} value={num(s.suspended, locale)} />
        <Stat label={a.stats.openReports} value={num(s.openReports, locale)}
          tone={s.openReports > 0 ? "alert" : undefined} />
        <Stat label={a.stats.errorsToday} value={num(s.errorsToday, locale)}
          tone={s.errorsToday > 0 ? "alert" : undefined} />
      </div>

      {/* Plan split. A bar per plan rather than a pie — the question is always
          "how many are paying", and that is a comparison of lengths. */}
      <div className="mt-7">
        <SectionTitle>{a.stats.plans}</SectionTitle>
        <Card className="grid gap-3">
          {(["GOLD", "SILVER", "FREE"] as const).map((plan) => (
            <div key={plan}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-extrabold">
                  {planLabel(plan, d)}
                </span>
                <span className="text-[12.5px] font-bold text-muted tabular-nums">
                  {num(s.plans[plan], locale)} · {percent(pct(s.plans[plan]), locale)}
                </span>
              </div>
              <div className="mt-1.5">
                <Meter value={pct(s.plans[plan])} tone={plan === "FREE" ? "warm" : "purple"} />
              </div>
            </div>
          ))}
          <p className="text-[11.5px] text-muted">
            {fill(a.stats.paidLine, {
              paid: num(paid, locale),
              timed: num(s.expiring, locale),
            })}
          </p>
        </Card>
      </div>

      <div className="mt-7 grid gap-2.5">
        <NavCard href="/admin/members" title={a.links.members} body={a.links.membersBody} />
        <NavCard href="/admin/codes" title={a.links.codes} body={a.links.codesBody}
          badge={`${num(s.activeCodes, locale)} · ${num(s.redemptions, locale)} ${a.stats.redemptions}`} />
        <NavCard href="/moderation" title={a.links.reports} body={a.links.reportsBody}
          badge={s.openReports > 0 ? num(s.openReports, locale) : undefined} />
        <NavCard href="/moderation/errors" title={a.links.errors} body={a.links.errorsBody}
          badge={s.errorsToday > 0 ? num(s.errorsToday, locale) : undefined} />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "alert";
}) {
  return (
    <Card className="!py-4">
      <p className="text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-muted">
        {label}
      </p>
      <p
        className={`text-[26px] font-black tabular-nums leading-tight mt-0.5 ${
          tone === "alert" ? "text-coral" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
    </Card>
  );
}

function NavCard({
  href,
  title,
  body,
  badge,
}: {
  href: string;
  title: string;
  body: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="card flex items-center gap-3 !py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-extrabold">{title}</span>
        <span className="block text-[12px] text-muted leading-relaxed">{body}</span>
      </span>
      {badge && (
        <span className="shrink-0 text-[11px] font-black text-orange bg-tagbg border border-orange/20 rounded-full px-2.5 py-1 tabular-nums">
          {badge}
        </span>
      )}
      <span className="text-orange font-bold text-[18px]">→</span>
    </Link>
  );
}

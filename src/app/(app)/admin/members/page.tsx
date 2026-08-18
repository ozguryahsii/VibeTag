import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findMembers } from "@/lib/admin";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { planLabel } from "@/lib/labels";
import { Avatar } from "@/components/Avatar";
import { LangToggle } from "@/components/LangToggle";
import { MemberPlanForm } from "@/components/admin/MemberPlanForm";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmt(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const FILTERS = ["", "GOLD", "SILVER", "FREE"] as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const plan = FILTERS.includes((params.plan ?? "") as (typeof FILTERS)[number])
    ? params.plan || ""
    : "";

  const [d, locale, members] = await Promise.all([
    getDict(),
    getLocale(),
    findMembers(q, plan || null),
  ]);
  const a = d.admin.members;

  return (
    <main className="px-5 pt-10 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.admin.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">{a.title}</h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1 leading-relaxed">{a.subtitle}</p>

      {/* A plain GET form: the result is a URL an admin can bookmark or send
          to themselves, which a client-side filter would not be. */}
      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={a.searchPlaceholder}
          className="min-w-0 flex-1 h-11 rounded-full bg-white border border-line px-4 text-[13.5px]"
        />
        <input type="hidden" name="plan" value={plan} />
        <button className="h-11 rounded-full grad-score px-5 text-[13px] font-bold text-white">
          {a.search}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href = `/admin/members?q=${encodeURIComponent(q)}${f ? `&plan=${f}` : ""}`;
          const on = f === plan;
          return (
            <Link
              key={f || "all"}
              href={href}
              className={`text-[12px] font-bold rounded-full px-3.5 py-2 border ${
                on
                  ? "text-white grad-score border-transparent"
                  : "text-muted bg-white border-line"
              }`}
            >
              {f ? planLabel(f, d) : a.all}
            </Link>
          );
        })}
      </div>

      {members.length === 0 ? (
        <div className="mt-6">
          <EmptyState emoji="🔍" title={a.empty} body="" />
        </div>
      ) : (
        <div className="mt-5 grid gap-2.5">
          {members.map((m) => (
            <Card key={m.id} className="!py-4">
              <div className="flex items-center gap-3.5">
                <Avatar
                  name={m.name}
                  url={m.avatarUrl}
                  color={m.avatarColor}
                  size={42}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-extrabold truncate">
                    <Link href={`/u/${m.username}`}>{m.name}</Link>
                  </p>
                  <p className="text-[11.5px] text-muted truncate">
                    @{m.username} · {m.email}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {fill(a.joined, { date: fmt(m.createdAt, locale) })}
                  </p>
                </div>
                <span className="shrink-0 text-[10.5px] font-black rounded-full px-2.5 py-1 text-orange bg-tagbg border border-orange/20">
                  {planLabel(m.plan, d)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Tag on={!!m.emailVerifiedAt} label={a.verifiedTag} />
                {m.isAdmin && <Tag on label={a.adminTag} />}
                {m.suspendedAt && <Tag on alert label={a.suspendedTag} />}
                <span className="text-[11px] text-muted">
                  {m.plan === "FREE"
                    ? ""
                    : m.planUntil
                      ? fill(a.planUntil, { date: fmt(m.planUntil, locale) })
                      : a.planForever}
                </span>
              </div>

              <MemberPlanForm username={m.username} plan={m.plan} />
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-[12.5px]">
        <Link href="/admin" className="font-bold text-coral">
          {d.admin.back}
        </Link>
      </p>
    </main>
  );
}

function Tag({ on, label, alert }: { on: boolean; label: string; alert?: boolean }) {
  if (!on) return null;
  return (
    <span
      className={`text-[10.5px] font-bold rounded-full px-2.5 py-1 border ${
        alert
          ? "text-coral bg-coral/8 border-coral/25"
          : "text-muted bg-cream border-line"
      }`}
    >
      {label}
    </span>
  );
}

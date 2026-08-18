import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listCodes } from "@/lib/admin";
import { codeState } from "@/lib/discount";
import { toggleCodeAction } from "@/lib/actions/admin";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { planLabel } from "@/lib/labels";
import { LangToggle } from "@/components/LangToggle";
import { CodeForm } from "@/components/admin/CodeForm";
import { Card, EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmt(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const STATE_STYLE: Record<string, string> = {
  ACTIVE: "text-orange bg-tagbg border-orange/20",
  OFF: "text-muted bg-cream border-line",
  EXPIRED: "text-muted bg-cream border-line",
  USED_UP: "text-coral bg-coral/8 border-coral/25",
};

export default async function AdminCodesPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const [d, locale, codes] = await Promise.all([
    getDict(),
    getLocale(),
    listCodes(),
  ]);
  const a = d.admin.codes;
  const now = new Date();

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

      <div className="mt-5">
        <CodeForm />
      </div>

      <div className="mt-7">
        <SectionTitle>
          {a.title}
          {codes.length > 0 ? ` · ${codes.length}` : ""}
        </SectionTitle>

        {codes.length === 0 ? (
          <EmptyState emoji="🎟️" title={a.empty} body="" />
        ) : (
          <div className="grid gap-2.5">
            {codes.map((c) => {
              const state = codeState(c, c.uses, now);
              return (
                <Card key={c.id} className="!py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-black tracking-[0.08em] break-all">
                        {c.code}
                      </p>
                      <p className="text-[12px] text-muted mt-0.5">
                        {fill(a.grants, { plan: planLabel(c.plan, d) })}{" "}
                        {c.days === null
                          ? a.forever
                          : fill(a.forDays, { n: c.days })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10.5px] font-black rounded-full px-2.5 py-1 border ${STATE_STYLE[state]}`}
                    >
                      {a.state[state]}
                    </span>
                  </div>

                  {c.note && (
                    <p className="text-[12.5px] text-muted leading-relaxed mt-2">
                      {c.note}
                    </p>
                  )}

                  <p className="text-[12.5px] font-bold mt-2 tabular-nums">
                    {c.maxUses === null
                      ? fill(a.usesUnlimited, { used: c.uses })
                      : fill(a.usesOf, { used: c.uses, max: c.maxUses })}
                    {c.expiresAt ? ` · ${fmt(c.expiresAt, locale)}` : ""}
                  </p>

                  {/* Who used it. The whole point of the screen: a code with a
                      count but no names cannot tell you a campaign worked. */}
                  <div className="mt-2.5 rounded-[14px] bg-cream border border-line px-3.5 py-2.5">
                    <p className="text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-muted">
                      {a.recent}
                    </p>
                    {c.recent.length === 0 ? (
                      <p className="text-[12px] text-muted mt-1">{a.never}</p>
                    ) : (
                      <ul className="mt-1 grid gap-0.5">
                        {c.recent.map((r) => (
                          <li key={r.username} className="text-[12px]">
                            <Link href={`/u/${r.username}`} className="font-bold">
                              {r.name}
                            </Link>{" "}
                            <span className="text-muted">
                              @{r.username} · {fmt(r.redeemedAt, locale)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <form action={toggleCodeAction} className="mt-3">
                    <input type="hidden" name="codeId" value={c.id} />
                    <button className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2">
                      {c.active ? a.turnOff : a.turnOn}
                    </button>
                  </form>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[12.5px]">
        <Link href="/admin" className="font-bold text-coral">
          {d.admin.back}
        </Link>
      </p>
    </main>
  );
}

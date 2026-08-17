import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { errorCountSince, recentErrors } from "@/lib/errors";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { LangToggle } from "@/components/LangToggle";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmt(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * The error log, for whoever runs the thing.
 *
 * Nothing here leaves the server — see lib/errors.ts for why that is a
 * decision rather than an omission.
 */
export default async function ErrorsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) notFound();

  const [d, locale, rows, lastDay] = await Promise.all([
    getDict(),
    getLocale(),
    recentErrors(),
    errorCountSince(new Date(Date.now() - 86_400_000)),
  ]);

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.errorsPage.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.errorsPage.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        {d.errorsPage.subtitle}
      </p>
      <p className="mt-2 text-[12.5px] font-bold text-orange tabular-nums">
        {fill(d.errorsPage.lastDay, { n: lastDay })}
      </p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState emoji="🟢" title={d.errorsPage.empty} body="" />
        </div>
      ) : (
        <div className="mt-6 grid gap-2.5">
          {rows.map((e) => (
            <Card key={e.id} className="!py-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12.5px] font-extrabold break-all">
                  {e.where}
                </p>
                <span className="shrink-0 text-[10.5px] font-bold text-muted tabular-nums">
                  {fmt(e.createdAt, locale)}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] text-muted leading-relaxed break-words">
                {e.message}
              </p>
              {e.stack && (
                <details className="mt-2">
                  <summary className="text-[11.5px] font-bold text-coral cursor-pointer">
                    stack
                  </summary>
                  <pre className="mt-1.5 overflow-x-auto rounded-xl bg-cream p-3 text-[10.5px] leading-relaxed">
                    {e.stack}
                  </pre>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 mb-4 text-center text-[12.5px]">
        <Link href="/moderation" className="font-bold text-coral">
          ← {d.nav.moderation}
        </Link>
      </p>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { isLegalSlug, legalDoc, legalIndex } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/support";
import { LangToggle } from "@/components/LangToggle";
import { Wordmark } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();

  const d = await getDict();
  const locale = await getLocale();
  const doc = legalDoc(slug, locale);
  const others = legalIndex(locale).filter((o) => o.slug !== slug);

  // The support address is configurable, so it is substituted rather than
  // written into the texts — a policy pointing at a dead inbox is not a policy.
  const withEmail = (text: string) => fill(text, { email: SUPPORT_EMAIL });

  return (
    <main className="px-6 pt-12 pb-16 max-w-[560px] mx-auto">
      <div className="flex items-start justify-between gap-3">
        <Link href="/">
          <Wordmark size={19} />
        </Link>
        <LangToggle />
      </div>

      <p className="mt-10 text-[10px] font-extrabold tracking-[0.25em] text-coral">
        {d.legal.kicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[30px] tracking-[-0.02em] leading-tight">
        {doc.title}
      </h1>
      <p className="mt-1.5 text-[12px] text-muted">
        {fill(d.legal.updated, { date: doc.updated })}
      </p>

      {/*
       * Standing notice. These texts describe the product accurately, which is
       * the useful half; a lawyer still has to sign them, and pretending
       * otherwise would be the exact kind of claim this app exists to avoid.
       */}
      <p className="mt-5 rounded-[18px] border border-orange/25 bg-tagbg px-4 py-3.5 text-[12px] text-orange leading-relaxed">
        {d.legal.draftNotice}
      </p>

      <p className="mt-6 text-[14px] leading-relaxed text-ink/85">
        {withEmail(doc.intro)}
      </p>

      <div className="mt-8 grid gap-7">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">
              {section.heading}
            </h2>
            {section.body.map((para) => (
              <p
                key={para}
                className="mt-2 text-[13.5px] leading-relaxed text-muted"
              >
                {withEmail(para)}
              </p>
            ))}
            {section.list && (
              <ul className="mt-2.5 grid gap-2">
                {section.list.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                    <span className="text-[13.5px] leading-relaxed text-muted">
                      {withEmail(item)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-5 flex flex-wrap gap-x-5 gap-y-2">
        {others.map((o) => (
          <Link
            key={o.slug}
            href={`/legal/${o.slug}`}
            className="text-[13px] font-bold text-orange"
          >
            {o.title} →
          </Link>
        ))}
      </div>
    </main>
  );
}

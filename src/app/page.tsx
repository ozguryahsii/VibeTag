import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n/server";
import { tagLabel } from "@/lib/labels";
import { fill } from "@/lib/i18n";
import { VibeMark, Wordmark } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { AnonStack, Avatar, Button, Card, TagPill } from "@/components/ui";

export default async function Welcome() {
  const user = await getCurrentUser();
  if (user) redirect("/home");
  const d = await getDict();
  const locale = await getLocale();

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-12 pb-10 overflow-hidden">
      <div className="reveal relative z-10 flex items-start justify-between gap-3">
        <Wordmark size={22} />
        <LangToggle />
      </div>

      <div className="mt-12 reveal relative z-10" style={{ animationDelay: "80ms" }}>
        <p className="text-[10px] font-extrabold tracking-[0.3em] text-coral mb-3">
          {d.welcome.kicker}
        </p>
        <h1 className="vt-page-title text-[43px] leading-[1.02] tracking-[-0.035em]">
          {d.welcome.titleA}
          <br />
          {d.welcome.titleB}{" "}
          <span className="grad-text">{d.welcome.titleC}</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-[19rem]">
          {d.welcome.body}
        </p>
      </div>

      {/* Hero card — the real visual language of the shareable Vibe Card. */}
      <div className="mt-9 pop relative" style={{ animationDelay: "160ms" }}>
        <div className="absolute -inset-8 rounded-full bg-coral/10 blur-3xl" aria-hidden />
        <div
          className="relative min-h-[570px] overflow-hidden rounded-[34px] border border-[#F4AC78] bg-warmwhite px-6 pb-5 pt-8 text-center"
          style={{ boxShadow: "0 24px 60px rgba(83,60,40,0.16)" }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 400 570"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 0h370C305 18 225 82 0 140Z" fill="#F7BD68" opacity=".48" />
            <path d="M0 0h265C212 30 138 78 0 103Z" fill="#F58458" opacity=".72" />
            <path d="M0 0h178C128 25 75 55 0 69Z" fill="#EF5962" opacity=".84" />
            <path d="M0 505C94 458 226 539 400 462V570H0Z" fill="#F8C16F" opacity=".5" />
            <path d="M0 530C122 479 241 559 400 486V570H0Z" fill="#F58D5D" opacity=".66" />
            <path d="M0 551C119 511 260 572 400 513V570H0Z" fill="#EF596A" opacity=".84" />
            <path d="M198 570C270 542 334 555 400 530V570Z" fill="#E93E75" opacity=".78" />
            <g fill="#fff" opacity=".86">
              <path d="m28 30 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
              <path d="m80 48 1.4 3.4 3.5 1.5-3.5 1.4-1.4 3.5-1.4-3.5-3.5-1.4 3.5-1.5Z" />
              <path d="m360 530 1.8 4.5 4.5 1.8-4.5 1.8-1.8 4.5-1.8-4.5-4.5-1.8 4.5-1.8Z" />
            </g>
          </svg>

          <div className="absolute right-5 top-5 z-10" aria-hidden="true">
            <VibeMark size={48} id="welcome-card-mark" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <Avatar name="Özgür Yahşi" color="#D77A52" size={88} ring />
            <p className="mt-4 font-display text-[25px] font-semibold tracking-[-0.035em] text-ink">
              Özgür Yahşi
            </p>
            <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
              <span className="h-px w-8 bg-coral/45" />
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              <span className="h-px w-8 bg-coral/45" />
            </div>

            <p className="mt-6 pl-[.3em] text-[11px] font-semibold tracking-[0.3em] text-coral">
              MY VIBE
            </p>
            <div className="relative mt-1 grid h-[128px] w-[240px] place-items-center">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 128" aria-hidden="true">
                <g strokeLinecap="round" strokeWidth="2" opacity=".48">
                  <path d="M30 64H8M38 38 19 27M55 20 44 6M210 64h22M202 38l19-11M185 20l11-14" stroke="#F2A03F" />
                  <path d="m35 87-21 6m191-6 21 6M55 108l-12 14m142-14 12 14" stroke="#F05262" />
                </g>
              </svg>
              <span
                className="grad-text tabular-nums"
                style={{
                  fontFamily: "var(--font-score)",
                  fontSize: 112,
                  fontWeight: 400,
                  lineHeight: 0.8,
                  letterSpacing: "-0.055em",
                  paddingRight: "0.045em",
                }}
              >
                96
              </span>
            </div>
            <p className="-mt-1 pl-[.28em] text-[11px] font-semibold tracking-[0.28em] text-coral">
              VIBE SCORE
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-coral">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-coral">★</span>
              {fill(d.home.topPercent, { n: 5 })}
            </p>

            <div className="mt-5 flex max-w-[310px] flex-wrap justify-center gap-2">
              {["positiveEnergy", "reliable", "kind", "leader"].map((key) => (
                <TagPill
                  key={key}
                  tagKey={key}
                  label={tagLabel(key, locale)}
                  tone="purple"
                />
              ))}
            </div>

            <div className="mt-6 flex w-full items-center gap-3 border-t border-line/80 pt-4 text-left">
              <AnonStack count={3} size={34} />
              <p className="text-[11px] leading-tight text-muted">
                {d.common.ratedBy}
                <span className="mt-0.5 block text-[15px] font-semibold text-ink">
                  126 {d.common.people}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-2.5 reveal" style={{ animationDelay: "240ms" }}>
        {d.welcome.points.map((point, i) => (
          <Card key={point.title} className="flex items-center gap-3.5 !py-3.5">
            <span className="w-8 h-8 shrink-0 grid place-items-center rounded-full border border-coral/20 bg-tagbg text-[10px] font-black tracking-wider text-coral">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-[13.5px] font-bold">{point.title}</span>
              <span className="block text-[12px] text-muted">{point.body}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-auto pt-8 grid gap-3 reveal" style={{ animationDelay: "320ms" }}>
        <Button href="/onboarding" full>
          {d.welcome.start}
        </Button>
        <Link
          href="/login"
          className="text-center text-[14px] font-bold text-muted py-2"
        >
          {d.welcome.haveAccount}
        </Link>
      </div>
    </main>
  );
}

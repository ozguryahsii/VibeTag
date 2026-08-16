"use client";

import Link from "next/link";
import { useState } from "react";
import { VibeMark } from "@/components/Logo";
import { useD } from "@/components/LocaleProvider";
import { LangToggle } from "@/components/LangToggle";
import { useLocale } from "@/components/LocaleProvider";
import { tagLabel } from "@/lib/labels";

/**
 * Three onboarding screens. Each one carries a single idea and an abstract,
 * on-brand illustration built from the same primitives as the app itself —
 * no stock art, nothing that would look foreign next to the real screens.
 */

/** The copy lives in the dictionary; only the artwork is bound here. */
const ART = [<ArtIdentity key="identity" />, <ArtContext key="context" />, <ArtShare key="share" />];

export function Onboarding() {
  const d = useD();
  const [i, setI] = useState(0);
  const slides = d.onboarding.slides;
  const slide = slides[i];
  const last = i === slides.length - 1;

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-11 pb-10 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <VibeMark size={30} />
        <div className="flex items-center gap-2.5">
          <LangToggle />
          <Link href="/register" className="text-[13px] font-bold text-muted">
            {d.onboarding.skip}
          </Link>
        </div>
      </div>

      <div key={i} className="mt-8 grid place-items-center pop">
        {ART[i]}
      </div>

      <div key={`${i}-t`} className="mt-9 reveal">
        <p className="text-[10px] font-extrabold tracking-[0.28em] text-coral mb-2.5">
          {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </p>
        <h1 className="vt-page-title text-[32px] tracking-[-0.03em] leading-[1.08]">
          {slide.title}
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-muted">
          {slide.body}
        </p>
      </div>

      <div className="mt-7 flex gap-2">
        {slides.map((s, n) => (
          <span
            key={s.title}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: n === i ? 28 : 8,
              background: n === i ? "#FF5C77" : "#F0E5DD",
            }}
          />
        ))}
      </div>

      <div className="mt-auto pt-8 grid gap-3">
        {last ? (
          <>
            <Link
              href="/register"
              className="h-13 grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              {d.onboarding.finish}
            </Link>
            <Link
              href="/login"
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              {d.onboarding.haveAccount}
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={() => setI((n) => n + 1)}
              className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
            >
              {d.onboarding.next}
            </button>
            <button
              onClick={() => setI(slides.length - 1)}
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              {d.onboarding.jump}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ------------------------------------------------------------ illustrations

function ArtIdentity() {
  const locale = useLocale();
  return (
    <div className="relative w-full h-56 grid place-items-center">
      <div
        className="absolute w-52 h-52 rounded-full drift"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,138,61,0.28), rgba(255,122,162,0.16) 60%, transparent 70%)",
        }}
      />
      <div className="relative card px-6 py-5 text-center">
        <div className="text-[10px] font-extrabold tracking-[0.26em] text-coral">
          MY VIBE
        </div>
        <div
          className="grad-text font-display leading-none mt-1"
          style={{ fontSize: 62, letterSpacing: "-0.04em" }}
        >
          94
        </div>
      </div>
      {[
        ["positiveEnergy", "-top-1 -left-1"],
        ["kind", "top-8 -right-2"],
        ["reliable", "bottom-2 -left-3"],
        ["calm", "-bottom-1 right-2"],
      ].map(([key, pos]) => (
        <span
          key={key}
          className={`absolute ${pos} card !py-2 !px-3 text-[9px] font-extrabold tracking-[0.12em] text-coral reveal`}
        >
          {tagLabel(key, locale).toLocaleUpperCase(locale)}
        </span>
      ))}
    </div>
  );
}

function ArtContext() {
  const d = useD();
  return (
    <div className="w-full h-56 grid grid-cols-2 gap-2.5 content-center px-2">
      {[
        ["01", d.onboarding.art.chips[0], true],
        ["02", d.onboarding.art.chips[1], false],
        ["03", d.onboarding.art.chips[2], false],
        ["04", d.onboarding.art.chips[3], false],
      ].map(([e, l, active]) => (
        <div
          key={String(l)}
          className={`rounded-[20px] p-3.5 ${
            active ? "grad-ring" : "bg-warmwhite border border-line"
          }`}
          style={
            active ? { boxShadow: "0 10px 26px rgba(255,138,61,0.18)" } : undefined
          }
        >
          <div className="text-[10px] font-black tracking-[0.15em] text-coral">{e}</div>
          <div className="text-[12.5px] font-bold mt-1">{l}</div>
          {active && (
            <div className="text-[10.5px] text-orange font-bold mt-1">
              {d.onboarding.art.criteriaOpened}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ArtShare() {
  return (
    <div className="relative w-full h-56 grid place-items-center">
      <div
        className="absolute w-40 h-52 rounded-[26px] rotate-[-8deg]"
        style={{
          background: "#FFF3EA",
          border: "1px solid #F0E5DD",
        }}
      />
      <div
        className="absolute w-40 h-52 rounded-[26px] rotate-[6deg]"
        style={{
          background: "#FFE9E4",
          border: "1px solid #F7DED4",
        }}
      />
      <div
        className="relative w-40 h-52 overflow-hidden rounded-[26px] border border-[#F4AC78] bg-warmwhite grid place-items-center text-ink"
        style={{ boxShadow: "0 20px 44px rgba(83,60,40,0.16)" }}
      >
        <span className="absolute -left-8 -top-8 h-20 w-40 rotate-[-9deg] rounded-[50%] bg-gradient-to-br from-orange/80 via-coral/65 to-pink/35" aria-hidden />
        <span className="absolute -bottom-7 -right-8 h-16 w-44 rotate-[-8deg] rounded-[50%] bg-gradient-to-br from-orange/45 via-coral/65 to-pink/85" aria-hidden />
        <span className="absolute right-3 top-3" aria-hidden>
          <VibeMark size={24} id="onboarding-card-mark" />
        </span>
        <div className="relative z-10 text-center">
          <div className="text-[9px] font-extrabold tracking-[0.24em] text-coral">
            MY VIBE
          </div>
          <div
            className="grad-text text-[56px] leading-none"
            style={{ fontFamily: "var(--font-score)", fontWeight: 400 }}
          >
            94
          </div>
          <div className="text-[9px] font-bold tracking-[0.18em] text-coral mt-1">
            VIBE SCORE
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { VibeMark } from "@/components/Logo";

/**
 * Three onboarding screens. Each one carries a single idea and an abstract,
 * on-brand illustration built from the same primitives as the app itself —
 * no stock art, nothing that would look foreign next to the real screens.
 */

const SLIDES = [
  {
    key: "identity",
    title: "İnsanlar sende ne görüyor?",
    body: "Vibe Tag bir puanlama uygulaması değil. Çevrendeki insanların sende gördüğü güzel özellikleri keşfettiğin yer.",
    art: <ArtIdentity />,
  },
  {
    key: "context",
    title: "Herkes seni tanıdığı kadar değerlendirir",
    body: "Değerlendirme öncesi “Bu kişiyi nereden tanıyorsun?” sorusu zorunlu. Sadece o ilişkide gözlemleyebileceği şeyler sorulur.",
    art: <ArtContext />,
  },
  {
    key: "share",
    title: "Sosyal kimliğini paylaş",
    body: "My Vibe profilin, Vibe Score’un ve paylaşılabilir Vibe Card’ın hazır. Story’de paylaş, çevreni davet et.",
    art: <ArtShare />,
  },
];

export function Onboarding() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-12 pb-10">
      <div className="flex items-center justify-between">
        <VibeMark size={30} />
        <Link href="/register" className="text-[13px] font-bold text-muted">
          Atla
        </Link>
      </div>

      <div key={slide.key} className="mt-8 grid place-items-center pop">
        {slide.art}
      </div>

      <div key={`${slide.key}-t`} className="mt-9 reveal">
        <h1 className="text-[30px] font-black tracking-[-0.03em] leading-[1.12]">
          {slide.title}
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-muted">
          {slide.body}
        </p>
      </div>

      <div className="mt-7 flex gap-2">
        {SLIDES.map((s, n) => (
          <span
            key={s.key}
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
              My Vibe’ımı oluştur
            </Link>
            <Link
              href="/login"
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              Zaten hesabım var
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={() => setI((n) => n + 1)}
              className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
            >
              Devam
            </button>
            <button
              onClick={() => setI(SLIDES.length - 1)}
              className="text-center text-[14px] font-bold text-muted py-2"
            >
              Nasıl paylaşılıyor?
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ------------------------------------------------------------ illustrations

function ArtIdentity() {
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
        <div className="text-[10px] font-extrabold tracking-[0.22em] text-muted">
          MY VIBE
        </div>
        <div
          className="grad-text font-black leading-none mt-1"
          style={{ fontSize: 62, letterSpacing: "-0.04em" }}
        >
          94
        </div>
      </div>
      {[
        ["🔥", "-top-1 -left-1"],
        ["❤️", "top-8 -right-2"],
        ["🤝", "bottom-2 -left-3"],
        ["🚀", "-bottom-1 right-2"],
      ].map(([e, pos]) => (
        <span
          key={e}
          className={`absolute ${pos} card !py-2 !px-3 text-[15px] reveal`}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

function ArtContext() {
  return (
    <div className="w-full h-56 grid grid-cols-2 gap-2.5 content-center px-2">
      {[
        ["💼", "İş arkadaşı", true],
        ["💛", "Yakın arkadaş", false],
        ["🛎️", "Hizmet aldım", false],
        ["🌍", "Topluluk", false],
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
          <div className="text-[17px]">{e}</div>
          <div className="text-[12.5px] font-bold mt-1">{l}</div>
          {active && (
            <div className="text-[10.5px] text-orange font-bold mt-1">
              6 kriter açıldı
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
        className="relative w-40 h-52 rounded-[26px] grad-card drift grid place-items-center text-white"
        style={{ boxShadow: "0 20px 44px rgba(255,92,119,0.34)" }}
      >
        <div className="text-center">
          <div className="text-[9px] font-extrabold tracking-[0.24em] opacity-85">
            MY VIBE
          </div>
          <div className="text-[52px] font-black leading-none">94</div>
          <div className="text-[9px] font-bold tracking-[0.18em] opacity-85 mt-1">
            VIBE SCORE
          </div>
        </div>
      </div>
    </div>
  );
}

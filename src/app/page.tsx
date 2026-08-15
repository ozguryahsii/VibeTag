import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import { Button, Card } from "@/components/ui";

export default async function Welcome() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-14 pb-10">
      <div className="reveal">
        <Wordmark size={22} />
      </div>

      <div className="mt-12 reveal" style={{ animationDelay: "80ms" }}>
        <h1 className="text-[40px] leading-[1.05] font-black tracking-[-0.03em]">
          Discover how
          <br />
          people <span className="grad-text">see you.</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-[19rem]">
          Vibe Tag bir puanlama uygulaması değil. Çevrendeki insanların sende
          gördüğü güzel özellikleri keşfettiğin yer.
        </p>
      </div>

      {/* Hero card — a miniature of the real My Vibe screen */}
      <div className="mt-9 pop" style={{ animationDelay: "160ms" }}>
        <div
          className="relative overflow-hidden rounded-[28px] p-6 text-white grad-card drift"
          style={{ boxShadow: "0 24px 60px rgba(255,92,119,0.35)" }}
        >
          <div className="text-[10px] font-extrabold tracking-[0.28em] opacity-80">
            MY VIBE
          </div>
          <div className="text-[76px] font-black leading-none tracking-[-0.04em] mt-1">
            94
          </div>
          <div className="text-[12px] font-bold opacity-85 mt-1">
            Rated by 86 people
          </div>

          <div className="mt-5 text-[12px] font-semibold opacity-85">
            People see me as:
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {[
              ["🔥", "Positive Energy"],
              ["🤝", "Reliable"],
              ["❤️", "Kind"],
              ["💡", "Problem Solver"],
            ].map(([e, l]) => (
              <span
                key={l}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.32)",
                }}
              >
                {e} {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-2.5 reveal" style={{ animationDelay: "240ms" }}>
        {[
          ["🔒", "Tüm oylar anonim", "Kimin ne yazdığını kimse göremez."],
          ["🎯", "Bağlama göre değerlendirme", "Seni nereden tanıyorsa onu puanlar."],
          ["🪄", "AI Vibe analizi", "Sosyal algını sade bir dille özetler."],
        ].map(([e, t, d]) => (
          <Card key={t} className="flex items-center gap-3.5 !py-3.5">
            <span className="text-xl">{e}</span>
            <span>
              <span className="block text-[13.5px] font-bold">{t}</span>
              <span className="block text-[12px] text-muted">{d}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-auto pt-8 grid gap-3 reveal" style={{ animationDelay: "320ms" }}>
        <Button href="/onboarding" full>
          Başla — ücretsiz
        </Button>
        <Link
          href="/login"
          className="text-center text-[14px] font-bold text-muted py-2"
        >
          Zaten hesabım var
        </Link>
      </div>
    </main>
  );
}

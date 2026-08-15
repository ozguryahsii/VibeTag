"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: string; center?: boolean };

const TABS: Tab[] = [
  { href: "/home", label: "My Vibe", icon: "✨" },
  { href: "/people", label: "Kişiler", icon: "🫂" },
  { href: "/rate", label: "Değerlendir", icon: "＋", center: true },
  { href: "/insights", label: "Insights", icon: "📊" },
  { href: "/settings", label: "Profil", icon: "⚙️" },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <>
      <div className="h-24" />
      <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="max-w-[480px] mx-auto px-4 pb-4 pointer-events-auto">
          <div
            className="flex items-center justify-between rounded-full px-2.5 py-2"
            style={{
              background: "rgba(255,248,245,0.86)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid #F0E5DD",
              boxShadow: "0 12px 40px rgba(31,31,31,0.12)",
            }}
          >
            {TABS.map((t) => {
              const active =
                path === t.href || (t.href !== "/home" && path.startsWith(t.href));

              if (t.center) {
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-label={t.label}
                    className="grid place-items-center w-13 h-13 rounded-full grad-score text-white text-2xl font-bold shadow-[0_10px_26px_rgba(255,92,119,0.45)] active:scale-95 transition-transform -mt-6"
                  >
                    {t.icon}
                  </Link>
                );
              }

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    color: active ? "#FF5C77" : "#6B6B6B",
                    background: active ? "#FFF0E8" : "transparent",
                  }}
                >
                  <span className="text-[17px] leading-none">{t.icon}</span>
                  <span className="text-[10px] font-bold leading-none">
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

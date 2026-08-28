"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ICONS } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { useD } from "@/components/LocaleProvider";
import { VibeMark } from "@/components/Logo";

type Tab = {
  href: string;
  /** Key into dict.nav — "My Vibe" and "Insights" stay as-is in both languages. */
  label: "myVibe" | "people" | "dm" | "rate" | "insights" | "badges" | "profile";
  icon: keyof typeof ICONS;
  center?: boolean;
};

/**
 * Three either side of the centre action. Six is the ceiling for a thumb bar
 * — past that the labels stop being readable — so everything here has to earn
 * its slot, which is why the inbox moved down from the home header: it is a
 * destination people return to, not a detail of one screen.
 */
const TABS: Tab[] = [
  { href: "/home", label: "myVibe", icon: "fingerprint" },
  { href: "/people", label: "people", icon: "users" },
  { href: "/messages", label: "dm", icon: "envelope" },
  { href: "/rate", label: "rate", icon: "plus", center: true },
  { href: "/insights", label: "insights", icon: "chart" },
  { href: "/badges", label: "badges", icon: "medal" },
  { href: "/settings", label: "profile", icon: "userCircle" },
];

export function BottomNav({ unreadDm = 0 }: { unreadDm?: number }) {
  const path = usePathname();
  const d = useD();

  /*
   * The count arrives from the (app) layout, which does not re-run on a
   * client-side navigation — so after reading a thread the badge kept
   * claiming an unread message until something forced a full page load. In
   * the app shell that could be days.
   *
   * So the server value is only the first paint, and every route change asks
   * again. A failed request leaves the last known number rather than blanking
   * the badge: a stale one is a smaller lie than a missing one.
   */
  const [unread, setUnread] = useState(unreadDm);
  useEffect(() => setUnread(unreadDm), [unreadDm]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/messages/unread", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled && typeof body?.count === "number") setUnread(body.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [path]);

  // A chat thread owns the whole screen, composer pinned to the bottom —
  // the tab bar would sit on top of the input.
  if (/^\/messages\/[^/]+$/.test(path)) return null;

  return (
    <>
      <div className="h-28" />
      {/* The gradient backdrop is what keeps text from showing under the
          pill: the pill floats, so without it the page scrolled on visibly
          between the pill and the screen edge. Safe-area padding keeps the
          whole thing above the iPhone home indicator. */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 pointer-events-none pt-6"
        style={{
          background:
            "linear-gradient(to top, #FBF8F2 62%, rgba(251,248,242,0))",
        }}
      >
        <div
          className="max-w-[500px] mx-auto px-3 pointer-events-auto"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className="flex items-center justify-between rounded-full px-1.5 py-2"
            style={{
              background: "rgba(252,248,239,0.92)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid #E4D7C8",
              boxShadow: "0 14px 40px rgba(83,60,40,0.14)",
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
                    aria-label={d.nav[t.label]}
                    className="grid place-items-center w-13 h-13 shrink-0 rounded-full grad-score text-white shadow-[0_10px_26px_rgba(255,92,119,0.45)] active:scale-95 transition-transform -mt-6"
                  >
                    <IconGlyph def={ICONS[t.icon]} size={24} color="#fff" strokeWidth={2.4} />
                  </Link>
                );
              }

              const showDot = t.href === "/messages" && unread > 0;

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="relative flex flex-1 min-w-0 flex-col items-center gap-0.5 px-0.5 py-1.5 rounded-full transition-colors"
                  style={{
                    color: active ? "#F05262" : "#8E8179",
                    background: active ? "#EEE4D5" : "transparent",
                  }}
                >
                  {t.icon === "fingerprint" ? (
                    <span style={{ opacity: active ? 1 : 0.58 }}>
                      <VibeMark size={19} id="bottom-nav-vibemark" />
                    </span>
                  ) : (
                    <IconGlyph
                      def={ICONS[t.icon]}
                      size={19}
                      color={active ? "#F05262" : "#8E8179"}
                      strokeWidth={active ? 2.1 : 1.8}
                    />
                  )}

                  {showDot && (
                    <span
                      className="absolute top-0.5 right-1.5 min-w-4 h-4 px-1 grid place-items-center rounded-full grad-score text-white text-[9px] font-black"
                      style={{ boxShadow: "0 0 0 2px #FCF8EF" }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}

                  <span className="text-[9.5px] font-bold leading-none truncate max-w-full">
                    {d.nav[t.label]}
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

import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted at build time — no external request at runtime, and the
// Vibe Card canvas can rely on the family actually being there.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

// The editorial half of the pairing: names and the big Vibe Score number.
// Inter alone reads like a dashboard; the serif is what makes the card feel
// like something you would want on your story. DM Serif Display specifically:
// it has lining figures, so "93" sits on the baseline instead of dropping
// descenders into the label underneath it.
const displaySerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  variable: "--font-display-serif",
});

export const metadata: Metadata = {
  title: "Vibe Tag — Discover how people see you",
  description:
    "Vibe Tag, çevrendeki insanların sende gördüğü güzel özellikleri dijital bir sosyal kimliğe dönüştürür.",
  applicationName: "Vibe Tag",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${displaySerif.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}

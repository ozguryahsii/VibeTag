import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display, Syne } from "next/font/google";
import "./globals.css";

// The approved Vibe Tag pairing: friendly clarity for product UI, an
// editorial serif for story moments, and a distinctive geometric wordmark.
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-playfair",
});

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-syne",
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
  themeColor: "#FBF8F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${dmSans.variable} ${playfair.variable} ${syne.variable}`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}

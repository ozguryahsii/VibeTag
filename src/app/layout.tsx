import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display, Syne } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { dictionaryFor } from "@/lib/i18n";
import { LocaleProvider } from "@/components/LocaleProvider";

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

export async function generateMetadata(): Promise<Metadata> {
  const d = dictionaryFor(await getLocale());
  return {
    title: d.meta.title,
    description: d.meta.description,
    applicationName: d.common.appName,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBF8F2",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${playfair.variable} ${syne.variable}`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <div className="app-shell">
          <LocaleProvider locale={locale} dict={dictionaryFor(locale)}>
            {children}
          </LocaleProvider>
        </div>
      </body>
    </html>
  );
}

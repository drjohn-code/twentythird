import type { Metadata } from "next";
import { Instrument_Serif, Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import Atmosphere from "../components/layout/Atmosphere";
import Grain from "../components/layout/Grain";
import { MarketingNav, MarketingFooter } from "../components/layout/MarketingChrome";
import SiteInteractions from "../components/layout/SiteInteractions";

// Font subsets cover every supported script. Instrument Serif (display)
// has no Cyrillic/Greek coverage on Google Fonts — no new face is added;
// instead its CSS fallback chain in globals.css lands per-glyph on
// Source Serif 4 (which carries cyrillic/greek here) so el/bg/uk
// headlines stay serif and on-brand.
const serifDisplay = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const serifText = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-text",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext", "greek"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Locale is resolved per request from cookie/DB/header (no URL prefix),
// so every route is inherently dynamic — opt out of static prerender
// app-wide. This is the accepted tradeoff of cookie/DB-driven locale
// (see I18N.md): marketing pages lose static caching.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TwentyThird — Psychodynamic AI for the inner life",
  description:
    "Advanced psychodynamic AI for self-discovery. Subconscious loop mapping, deep-core profiling, and Lacanian analysis of the linguistic unconscious.",
  metadataBase: new URL("https://day-23.com"),
  openGraph: {
    title: "TwentyThird",
    description: "Psychodynamic AI for the inner life.",
    siteName: "TwentyThird",
    type: "website",
  },
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Locale is resolved on the server (no first-paint flash), so <html
  // lang> is correct on the first byte. Messages for the active locale
  // are handed to the client provider so client islands can translate.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`${serifDisplay.variable} ${serifText.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Atmosphere />
          <Grain />
          <MarketingNav />
          {children}
          <MarketingFooter />
          <SiteInteractions />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

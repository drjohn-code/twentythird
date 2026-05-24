import type { Metadata } from "next";
import { Instrument_Serif, Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Atmosphere from "../components/layout/Atmosphere";
import Grain from "../components/layout/Grain";
import { MarketingNav, MarketingFooter } from "../components/layout/MarketingChrome";
import SiteInteractions from "../components/layout/SiteInteractions";

const serifDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const serifText = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-text",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${serifDisplay.variable} ${serifText.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Atmosphere />
        <Grain />
        <MarketingNav />
        {children}
        <MarketingFooter />
        <SiteInteractions />
      </body>
    </html>
  );
}

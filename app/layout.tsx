import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Atmosphere from "../components/layout/Atmosphere";
import Grain from "../components/layout/Grain";
import Nav from "../components/layout/Nav";
import Footer from "../components/layout/Footer";
import SiteInteractions from "../components/layout/SiteInteractions";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
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
  metadataBase: new URL("https://twentythird.com"),
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
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Atmosphere />
        <Grain />
        <Nav />
        {children}
        <Footer />
        <SiteInteractions />
      </body>
    </html>
  );
}

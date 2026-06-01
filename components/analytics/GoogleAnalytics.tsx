"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GA_MEASUREMENT_ID,
  gtag,
  isProductionHost,
  pushConsentDefaultDenied,
  readConsent,
  updateGtagConsent,
  utmQueryString,
} from "@/lib/consent/consent";

// Google Analytics 4 under Consent Mode v2 — the loader.
//
// Mounted ONLY on allow-listed marketing routes (the MarketingAnalytics gate
// decides that). It does not self-check the route; if it renders, it runs.
//
// CONSENT-BEFORE-CONFIG (now client-side, no <head> script): the init effect
// pushes consent default = denied to the dataLayer FIRST, then gtag('js') /
// gtag('config'). The remote gtag.js is the only thing that could race those
// pushes, and it is gated behind `loadRemote`, which is set in the SAME effect
// AFTER the pushes — so defaults are always queued before gtag.js can run.
//
// DEV/PREVIEW HYGIENE: the gtag()/dataLayer pushes run wherever this mounts so
// the default-denied → config → update-on-accept sequence is inspectable in
// the console. Only the REMOTE gtag.js <Script> is gated on the production
// host, so dev/preview never send real hits and never pollute the property.
//
// A STRICTER ALTERNATIVE — defer loading gtag.js until the visitor accepts —
// is intentionally NOT implemented; we follow Google's recommended Consent
// Mode v2 pattern (load with analytics_storage denied, update on accept).
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [loadRemote, setLoadRemote] = useState(false);
  const initialized = useRef(false);

  // One-time init: defaults (denied) → js → config (no auto pageview; we send
  // them ourselves below). Then resume a returning 'granted' visitor without
  // re-prompting, and finally arm the remote load on the production host only.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || initialized.current) return;
    initialized.current = true;

    pushConsentDefaultDenied();
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

    if (readConsent()?.status === "granted") updateGtagConsent("granted");

    // Arm the remote gtag.js (production host only). Set last, so the <Script>
    // can never mount before the consent default is queued.
    setLoadRemote(isProductionHost(window.location.hostname));
  }, []);

  // Send a page_view on first load and every client-side navigation. Only
  // marketing paths reach here (non-sensitive), so no path redaction. We keep
  // utm_* in page_location (campaign attribution) and drop the rest of the
  // query string. page_path stays query-free.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !initialized.current) return;
    const utm = utmQueryString(window.location.search);
    gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.origin + pathname + utm,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname]);

  if (!GA_MEASUREMENT_ID || !loadRemote) return null;

  return (
    <Script
      id="ga-gtag"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
    />
  );
}

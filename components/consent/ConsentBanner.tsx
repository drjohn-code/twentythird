"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import Glass from "@/components/ui/Glass";
import Pill from "@/components/ui/Pill";
import {
  CONSENT_OPEN_EVENT,
  GA_MEASUREMENT_ID,
  readConsent,
  updateGtagConsent,
  writeConsent,
} from "@/lib/consent/consent";
import {
  getConsentCopy,
  resolveConsentLocale,
} from "@/lib/consent/translations";

// The in-house consent banner. A quiet floating glass card (not a full-bleed
// bar), pinned bottom-left, that follows Consent Mode v2: shows once when no
// decision is stored, writes the choice, and fires the gtag update. Resuming
// a returning 'granted' visitor is owned by GoogleAnalytics — this component
// only handles the UI + writing a fresh decision.
export default function ConsentBanner() {
  const siteLocale = useLocale();
  const [open, setOpen] = useState(false);

  // Decide visibility on mount (post-hydration, so localStorage is readable
  // and server/first-client render agree on `open=false` → no mismatch).
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    if (readConsent() === null) setOpen(true);

    // The footer "Cookie preferences" control re-opens the banner so a choice
    // can be changed — withdrawing must be as easy as granting.
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!GA_MEASUREMENT_ID || !open) return null;

  const copy = getConsentCopy(
    resolveConsentLocale(
      siteLocale,
      typeof navigator !== "undefined" ? navigator.languages : [],
    ),
  );

  const decide = (status: "granted" | "denied") => {
    writeConsent(status);
    updateGtagConsent(status);
    setOpen(false);
  };

  return (
    <Glass
      as="aside"
      className="consent-banner"
      role="region"
      aria-label={copy.manage}
    >
      <div className="eyebrow consent-eyebrow">{copy.eyebrow}</div>
      <p className="consent-body">{copy.body}</p>
      <div className="consent-actions">
        <Pill type="button" onClick={() => decide("granted")}>
          {copy.accept}
        </Pill>
        <button
          type="button"
          className="consent-decline"
          onClick={() => decide("denied")}
        >
          {copy.decline}
        </button>
      </div>
      <Link href="/legal/cookies" className="consent-policy">
        {copy.policyLinkLabel}
      </Link>
    </Glass>
  );
}

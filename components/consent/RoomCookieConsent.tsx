"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  GA_MEASUREMENT_ID,
  updateGtagConsent,
  writeConsent,
} from "@/lib/consent/consent";
import {
  getConsentCopy,
  resolveConsentLocale,
} from "@/lib/consent/translations";

// Room withdrawal control. GA never runs inside the Room, so there is no
// banner to re-open here — but withdrawal must stay as easy as granting
// (GDPR). This quiet control flips the stored decision straight to denied and
// re-asserts gtag denied, so a later marketing visit will not resume analytics.
// No banner machinery is mounted in the Room.
export default function RoomCookieConsent() {
  const siteLocale = useLocale();
  const [withdrawn, setWithdrawn] = useState(false);

  if (!GA_MEASUREMENT_ID) return null;

  const copy = getConsentCopy(resolveConsentLocale(siteLocale, []));

  const withdraw = () => {
    writeConsent("denied");
    updateGtagConsent("denied");
    setWithdrawn(true);
  };

  return (
    <button
      type="button"
      className="cookie-pref-link"
      onClick={withdraw}
      disabled={withdrawn}
      aria-label={copy.manage}
    >
      {copy.manage} {withdrawn ? "✓" : "→"}
    </button>
  );
}

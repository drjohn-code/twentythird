"use client";

import { useLocale } from "next-intl";
import { GA_MEASUREMENT_ID, openConsentBanner } from "@/lib/consent/consent";
import {
  getConsentCopy,
  resolveConsentLocale,
} from "@/lib/consent/translations";

// Quiet footer control that re-opens the consent banner — the withdrawal /
// re-consent affordance (withdrawing must be as easy as granting). Renders
// nothing when analytics is disabled. Styled per footer context via CSS:
// `.cookie-pref-link` (marketing) and `.room-footer-bot .cookie-pref-link`
// (Room).
export default function CookiePreferencesButton({
  className,
}: {
  className?: string;
}) {
  const siteLocale = useLocale();
  if (!GA_MEASUREMENT_ID) return null;

  // Footers are rendered server-side too; resolve from the site locale only
  // (navigator isn't available there, and the site locale is authoritative).
  const copy = getConsentCopy(resolveConsentLocale(siteLocale, []));

  return (
    <button
      type="button"
      className={["cookie-pref-link", className].filter(Boolean).join(" ")}
      onClick={openConsentBanner}
    >
      {copy.manage}
    </button>
  );
}

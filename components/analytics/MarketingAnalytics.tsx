"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  GA_MEASUREMENT_ID,
  isAnalyticsEligiblePath,
  setGaDisabled,
} from "@/lib/consent/consent";
import GoogleAnalytics from "./GoogleAnalytics";
import ConsentBanner from "@/components/consent/ConsentBanner";

// The single gate that scopes ALL GA machinery to the public marketing
// surface. Rendered once from the root layout (the same self-gating pattern as
// MarketingNav/MarketingFooter), it renders NOTHING — no loader, no consent
// default, no banner, no page_views — on any route not on the fail-closed
// allow-list. So the (room) group, /invite, /auth and /onboarding never load
// GA, even though the component sits in the shared root layout.
//
// Fail-closed: unset id OR a non-allow-listed path → null. The allow-list
// (isAnalyticsEligiblePath) is the only source of truth for GA eligibility.
export default function MarketingAnalytics() {
  const pathname = usePathname();
  const eligible = !!GA_MEASUREMENT_ID && isAnalyticsEligiblePath(pathname);

  // GA kill switch. gtag.js, once injected on a marketing route, stays resident
  // in memory and keeps its own timers/listeners — React unmounting the loader
  // does NOT stop it (its user_engagement pings would still fire off-route).
  // So flip GA's documented opt-out flag: off on eligible routes, ON the moment
  // we leave one, so nothing of ANY type can leave once off marketing.
  useEffect(() => {
    if (eligible) {
      setGaDisabled(false);
      return () => setGaDisabled(true);
    }
    setGaDisabled(true);
  }, [eligible]);

  if (!eligible) return null;

  return (
    <>
      <GoogleAnalytics />
      <ConsentBanner />
    </>
  );
}

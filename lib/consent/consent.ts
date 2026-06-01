// ────────────────────────────────────────────────────────────────────
// Consent state — read/write + the gtag() wiring for Google Consent Mode v2.
//
// This is the single owner of: the stored decision, the dataLayer/gtag
// bridge, and the consent update() calls. The banner and the GA loader both
// reach through here so the persistence shape and the update payload can
// never drift apart. No third-party CMP, no consent library — in-house.
//
// Companion files:
//   • components/analytics/GoogleAnalytics.tsx — loads gtag.js + sends views
//   • components/consent/ConsentBanner.tsx     — the banner UI
//   • lib/consent/translations.ts              — localized copy
// The consent *default = denied* block is registered earlier still, by the
// inline <head> bootstrap in app/layout.tsx, so defaults sit in the
// dataLayer before gtag('config') ever runs.
// ────────────────────────────────────────────────────────────────────

import { siteUrl } from "@/lib/routes";

declare global {
  interface Window {
    // The canonical gtag command queue. Items are array-like command tuples
    // (['consent','default',{…}]); gtag.js reads them by index.
    dataLayer: unknown[];
    // The shim installed by the <head> bootstrap: pushes its `arguments`
    // object onto dataLayer, exactly like Google's snippet.
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 measurement id. Absent → the whole feature renders nothing. */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** localStorage key holding the decision — mirrors the `theme` key pattern. */
export const CONSENT_STORAGE_KEY = "tt-consent";

/**
 * Bump when the privacy posture changes (new vendor, new purpose). A stored
 * decision at a different version is treated as absent, so everyone is
 * re-prompted under the new terms.
 */
export const CONSENT_VERSION = 1;

/** Fired (window-level) by the footer control to re-open the banner. */
export const CONSENT_OPEN_EVENT = "tt-consent:open";

export type ConsentStatus = "granted" | "denied";

export type ConsentDecision = {
  status: ConsentStatus;
  version: number;
  decidedAt: string;
};

// ─── gtag bridge ────────────────────────────────────────────────────

/**
 * Push a gtag command. gtag.js consumes the live `arguments` object from the
 * dataLayer (Google's exact snippet) — NOT plain arrays — so we install the
 * canonical shim on first use and always go through it. (There is no longer a
 * <head> bootstrap; the loader is the first caller, before gtag.js loads.)
 * No-op during SSR.
 */
export function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  let fn = window.gtag;
  if (typeof fn !== "function") {
    fn = function gtagShim() {
      // Push the live `arguments` object, exactly like Google's inline snippet.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag = fn;
  }
  fn(...args);
}

/**
 * Register Consent Mode v2 defaults = denied. The loader pushes this to the
 * dataLayer BEFORE gtag('config'), so defaults always land before config —
 * the client-side equivalent of the old <head> inline script. functionality_
 * and security_storage are granted (they carry no tracking).
 */
export function pushConsentDefaultDenied(): void {
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

/**
 * Update Consent Mode after a user choice (or to resume a returning
 * visitor). Analytics-only install: granting flips `analytics_storage` and
 * leaves every ad_* signal denied; declining (or withdrawing) re-denies
 * everything, including `analytics_storage` for the withdrawal case.
 */
export function updateGtagConsent(status: ConsentStatus): void {
  if (status === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  } else {
    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

// ─── persistence ────────────────────────────────────────────────────

/** Read the stored decision, or null if absent / malformed / out-of-version. */
export function readConsent(): ConsentDecision | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { status, version } = parsed as Partial<ConsentDecision>;
    if (status !== "granted" && status !== "denied") return null;
    if (version !== CONSENT_VERSION) return null; // policy moved on → re-prompt
    return parsed as ConsentDecision;
  } catch {
    return null;
  }
}

/** Persist a decision (current version + an ISO timestamp). */
export function writeConsent(status: ConsentStatus): ConsentDecision {
  const decision: ConsentDecision = {
    status,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(decision));
  } catch {
    // storage blocked (private mode / disabled) — consent still applies for
    // this page-load via the gtag update; it just won't persist.
  }
  return decision;
}

// ─── re-open event ──────────────────────────────────────────────────

/** Ask the (already-mounted) banner to re-open — used by the footer control. */
export function openConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
}

// ─── environment helpers ────────────────────────────────────────────

/**
 * True only on the real production host. Drives the *remote gtag.js load* —
 * localhost and *.vercel.app previews skip it so testing never pollutes the
 * GA property, while the dataLayer consent sequence still runs everywhere and
 * stays inspectable. Production origin comes from NEXT_PUBLIC_SITE_URL
 * (siteUrl()), never hardcoded; apex/www are treated as equivalent.
 */
export function isProductionHost(hostname: string): boolean {
  let configured: string;
  try {
    configured = new URL(siteUrl()).hostname;
  } catch {
    return false;
  }
  const normalize = (h: string) => h.replace(/^www\./i, "").toLowerCase();
  return normalize(hostname) === normalize(configured);
}

/**
 * GA's documented kill switch. When `window['ga-disable-<ID>']` is true, the
 * already-injected gtag.js emits NOTHING for that measurement id — page_view,
 * user_engagement, every transport. React-unmounting our components does not
 * stop the resident library or reset its in-memory state, so the gate toggles
 * this flag: off on eligible marketing routes, ON the moment we leave one.
 */
export function setGaDisabled(disabled: boolean): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  (window as unknown as Record<string, boolean>)[
    `ga-disable-${GA_MEASUREMENT_ID}`
  ] = disabled;
}

// ─── analytics scope (fail-closed allow-list) ───────────────────────
//
// GA runs ONLY on the public marketing surface. This allow-list is the SINGLE
// source of truth for "GA-eligible" — anything not on it gets nothing: no
// gtag.js, no consent-default, no banner, no page_views. It is deliberately
// NOT the inverse of lib/routes.ts PRIVATE_PREFIXES (that denylist omits some
// non-marketing routes, so its inverse would wrongly enable GA on them).
//
// FAIL-CLOSED: a new marketing route gets ZERO analytics until its path is
// added below. If GA looks "missing" on a new page, add it here.
//
// Derived from the actual public marketing pages in app/. Every authenticated
// or sensitive surface is excluded: the (room) group, /invite, /auth,
// /onboarding, /dashboard, /internal.

/** Marketing routes matched by EXACT equality. "/" must be exact — a prefix
 *  match on "/" would re-enable GA on every route. */
const GA_MARKETING_EXACT: ReadonlySet<string> = new Set(["/"]);

/** Marketing routes matched on a segment boundary (prefix or prefix + "/…").
 *  Note "/reports/sample" is the only public page under the otherwise-private
 *  "/reports" — list the full path, never the bare "/reports" prefix. */
const GA_MARKETING_PREFIXES: readonly string[] = [
  "/about",
  "/case-studies",
  "/contact",
  "/examples",
  "/legal",
  "/methodology",
  "/papers",
  "/plan",
  "/reports/sample",
  "/science",
];

/** True only for public marketing routes — the one gate for all GA machinery. */
export function isAnalyticsEligiblePath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  if (GA_MARKETING_EXACT.has(pathname)) return true;
  return GA_MARKETING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Keep only utm_* params from a query string; drop everything else. Marketing
 * pages carry no sensitive ids, so there is no scrubbing reason to strip utm_*
 * — and dropping them would silently kill GA4 campaign attribution. Any other
 * query param is discarded (no privacy cost, and keeps page_location clean).
 * Returns "" or a "?utm_…" string.
 */
export function utmQueryString(search: string): string {
  if (!search) return "";
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const [key, value] of params) {
    if (key.toLowerCase().startsWith("utm_")) kept.append(key, value);
  }
  const out = kept.toString();
  return out ? `?${out}` : "";
}

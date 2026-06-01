// Single source of truth for route privacy and the canonical site URL.
//
// Two consumers import from here so the private-route list can never
// drift apart:
//   • components/layout/MarketingChrome.tsx — hides the marketing
//     Nav/Footer on private routes (they render their own chrome, or none).
//   • app/robots.ts — disallows every private prefix from search indexing.
//
// Analytics is scoped by its OWN fail-closed allow-list, not this denylist:
// GA4 runs only on the public marketing routes (isAnalyticsEligiblePath in
// lib/consent/consent.ts) and never on the (room) group, /invite, /auth, or
// /onboarding. That allow-list — not the inverse of these private prefixes —
// is the single source of truth for GA eligibility.
//
// PRIVATE = must never be indexed by a search engine and never sent to
// analytics. This covers every authenticated Room route, the auth and
// onboarding flows, the secret-token /invite landing, the /dashboard
// redirect, internal render endpoints, and all API routes.
export const PRIVATE_PREFIXES = [
  // authenticated Room — app/(room)/*
  "/room",
  "/readings",
  "/catchup",
  "/consulting",
  "/case-file",
  "/settings",
  "/subscribe",
  "/reports", // room report pages — /reports/sample is a public exception, see below
  "/intake",
  "/connections",
  // public landing that carries a SECRET invite token — keeping it out of
  // the index and out of analytics is a security requirement, not a nicety
  "/invite",
  // auth + onboarding flows
  "/auth",
  "/onboarding",
  "/dashboard", // server redirect to /room
  // internal + machine endpoints — never user-facing, never indexed
  "/internal",
  "/api",
] as const;

// Public marketing pages that live UNDER a private prefix and must stay
// crawlable. Only the sample report today: it is linked from the home
// page, the methodology page, and the footer, and ships its own SEO
// metadata. robots.ts emits an explicit Allow for these (a longer, more
// specific rule wins over the parent Disallow in every major crawler) and
// sitemap.ts lists them. They stay chrome-less and untracked by GA by
// design — only their search indexing is opted back in.
export const PUBLIC_CRAWL_EXCEPTIONS = ["/reports/sample"] as const;

// Prefix match used by MarketingChrome and Analytics. Matches the prefix
// itself or any path beneath it — "/room" matches "/room" and "/room/x"
// but not "/roominess".
export function isPrivatePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Canonical, trailing-slash-free site origin. NEXT_PUBLIC_SITE_URL is the
// source of truth (set per environment); the fallback only guards against
// an unset env at build time and matches the fallback used elsewhere in
// the app (lib/ai/router.ts, app/api/connections/route.ts).
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://day-23.com"
  );
}

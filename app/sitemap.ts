import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/routes";

// Public marketing routes only. Authenticated Room routes, the invite
// landing, the auth/onboarding flows, and the API/internal endpoints are
// intentionally absent — see lib/routes.ts (PRIVATE_PREFIXES) and
// app/robots.ts.
//
// /reports/sample lives under the private /reports prefix but is a public
// marketing asset (PUBLIC_CRAWL_EXCEPTIONS): linked from the home page,
// the methodology page, and the footer, so it is listed here and
// explicitly Allowed in robots.ts. The home page is emitted separately
// with priority 1.
const PUBLIC_PATHS = [
  "/about",
  "/methodology",
  "/science",
  "/plan",
  "/contact",
  "/case-studies/relational-attractor",
  "/examples/dream-interpretation",
  "/papers/professional-blocks",
  "/reports/sample",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...PUBLIC_PATHS.map((path) => ({
      url: `${base}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

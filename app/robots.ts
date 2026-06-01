import type { MetadataRoute } from "next";
import {
  PRIVATE_PREFIXES,
  PUBLIC_CRAWL_EXCEPTIONS,
  siteUrl,
} from "@/lib/routes";

// robots.txt, generated from the single source of truth in lib/routes.ts.
//
// Production: allow the public marketing surface, disallow every private
// prefix (Room, invite, auth, onboarding, internal, api), and point at the
// sitemap. The sample report is the one public page under a private prefix
// — re-allowed explicitly; a longer Allow rule wins over the parent
// Disallow in Google and Bing.
//
// Non-production (local + Vercel preview): block everything so staging
// URLs never get indexed. Vercel preview deploys report NODE_ENV
// "production", so previews are detected via VERCEL_ENV instead.
function isProductionDeploy(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}

export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeploy()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", ...PUBLIC_CRAWL_EXCEPTIONS],
      disallow: [...PRIVATE_PREFIXES],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  COUNTRY_TO_LOCALE,
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/lib/i18n/locales";
import { negotiateAcceptLanguage } from "@/lib/i18n/negotiate";

// First-visit locale guess. Returns a locale to persist, or null to
// leave an already-valid cookie untouched. Edge-safe: only pure i18n
// data + Accept-Language parsing, no server-only / Node imports.
function localeToPersist(request: NextRequest): Locale | null {
  // Dev escape hatch: ?__locale=xx forces and persists a locale.
  const override = request.nextUrl.searchParams.get("__locale");
  if (override && isSupportedLocale(override)) return override;

  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existing && isSupportedLocale(existing)) return null;

  // IP geolocation — Vercel sets x-vercel-ip-country. No geo header
  // locally, so this falls through cleanly to Accept-Language.
  const country = request.headers.get("x-vercel-ip-country");
  if (country) {
    const mapped = COUNTRY_TO_LOCALE[country.toUpperCase()];
    if (mapped) return mapped;
  }

  return (
    negotiateAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

export async function middleware(request: NextRequest) {
  const locale = localeToPersist(request);

  // Forward the locale on the *request* so the current render already
  // resolves it — updateSession's NextResponse.next({ request }) carries
  // forwarded request cookies through.
  if (locale) request.cookies.set(LOCALE_COOKIE, locale);

  const response = await updateSession(request);

  // Persist on the *response* so the browser stores it for next time.
  if (locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - image files in public/
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

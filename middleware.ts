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

// Resolves a raw query param value to a supported locale: lowercase,
// then exact match, then primary subtag (`en-GB` -> `en`).
function resolveLocaleParam(value: string | null): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (isSupportedLocale(lower)) return lower;
  const primary = lower.split("-")[0];
  return isSupportedLocale(primary) ? primary : null;
}

// An explicit choice (switcher, ?__locale=, ?lang=) persists for a year;
// an inferred guess (geo / Accept-Language / default) is session-scoped
// so it never outlives the guess it was.
type LocaleResolution = { locale: Locale; explicit: boolean };

// First-visit locale guess. Returns the locale to persist and whether
// it was an explicit choice or an inference, or null to leave an
// already-valid cookie untouched. Edge-safe: only pure i18n data +
// Accept-Language parsing, no server-only / Node imports.
function localeToPersist(request: NextRequest): LocaleResolution | null {
  // Explicit override: ?__locale=xx (undocumented) or ?lang=xx forces
  // and persists a locale. __locale wins if both are present.
  const override =
    resolveLocaleParam(request.nextUrl.searchParams.get("__locale")) ??
    resolveLocaleParam(request.nextUrl.searchParams.get("lang"));
  if (override) return { locale: override, explicit: true };

  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existing && isSupportedLocale(existing)) return null;

  // IP geolocation — Vercel sets x-vercel-ip-country. No geo header
  // locally, so this falls through cleanly to Accept-Language.
  const country = request.headers.get("x-vercel-ip-country");
  if (country) {
    const mapped = COUNTRY_TO_LOCALE[country.toUpperCase()];
    if (mapped) return { locale: mapped, explicit: false };
  }

  const negotiated = negotiateAcceptLanguage(
    request.headers.get("accept-language"),
  );
  return { locale: negotiated ?? DEFAULT_LOCALE, explicit: false };
}

export async function middleware(request: NextRequest) {
  const resolution = localeToPersist(request);

  // Forward the locale on the *request* so the current render already
  // resolves it — updateSession's NextResponse.next({ request }) carries
  // forwarded request cookies through.
  if (resolution) request.cookies.set(LOCALE_COOKIE, resolution.locale);

  const response = await updateSession(request);

  // Persist on the *response* so the browser stores it for next time.
  // Explicit writes carry Max-Age; an inferred locale doesn't, so it
  // stays a session cookie rather than pinning a guess for a year.
  if (resolution) {
    response.cookies.set(LOCALE_COOKIE, resolution.locale, {
      path: "/",
      sameSite: "lax",
      ...(resolution.explicit ? { maxAge: LOCALE_COOKIE_MAX_AGE } : {}),
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

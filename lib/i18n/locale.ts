import "server-only";

// ────────────────────────────────────────────────────────────────────
// Server-side locale resolution.
//
// Resolution order (evaluated per request):
//   1. Signed-in → users_meta.locale (if set and supported)
//   2. else NEXT_LOCALE cookie (if supported)
//   3. else Accept-Language negotiation
//   4. else DEFAULT_LOCALE
//
// IP geolocation (step 3 in the product spec) is handled in the
// middleware, which writes the cookie on first visit — so by the time
// this runs, the cookie already reflects the IP guess. This function
// keeps an Accept-Language fallback for cookie-less renders (local dev,
// environments without the geo header).
//
// Locale has no first-paint flash problem (unlike theme): it is resolved
// here on the server, so <html lang> is correct on first paint.
// ────────────────────────────────────────────────────────────────────

import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./locales";
import { negotiateAcceptLanguage } from "./negotiate";

export async function getActiveLocale(): Promise<Locale> {
  // 1. Signed-in users: their stored preference is authoritative.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users_meta")
        .select("locale")
        .eq("user_id", user.id)
        .maybeSingle<{ locale: string | null }>();
      if (data?.locale && isSupportedLocale(data.locale)) return data.locale;
    }
  } catch {
    // No session / Supabase unavailable — fall through to the cookie.
  }

  // 2. NEXT_LOCALE cookie — source of truth for anonymous visitors,
  //    set by the middleware on first visit (IP → Accept-Language).
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie && isSupportedLocale(fromCookie)) return fromCookie;

  // 3. Accept-Language negotiation — covers the cookie-less first render
  //    in environments without the middleware geo step (e.g. local dev).
  const fromHeader = negotiateAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  if (fromHeader) return fromHeader;

  // 4. Default.
  return DEFAULT_LOCALE;
}

/**
 * Carry an anonymous visitor's locale into their account on the first
 * authentication. If the NEXT_LOCALE cookie holds a non-default supported
 * locale and the user's stored locale is still the default, adopt the
 * cookie into users_meta.locale. A user who has already chosen a
 * non-default locale is never overwritten. Call from sign-in, sign-up,
 * and the auth callback. Pass the caller's authenticated client.
 */
export async function syncLocaleOnAuth(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (
    !cookieLocale ||
    !isSupportedLocale(cookieLocale) ||
    cookieLocale === DEFAULT_LOCALE
  ) {
    return;
  }
  const { data } = await supabase
    .from("users_meta")
    .select("locale")
    .eq("user_id", userId)
    .maybeSingle<{ locale: string | null }>();
  const stored = data?.locale;
  // Respect an existing explicit (non-default) preference.
  if (stored && isSupportedLocale(stored) && stored !== DEFAULT_LOCALE) return;
  await supabase
    .from("users_meta")
    .update({ locale: cookieLocale })
    .eq("user_id", userId);
}

/**
 * Write the locale cookie. Safe only from a Server Action or Route
 * Handler (where cookies are mutable) — never during render. Used by the
 * post-auth sync, the onboarding name/age step, and settings.
 */
export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

"use server";

// ────────────────────────────────────────────────────────────────────
// Locale mutation — the one server action the client switcher calls.
//
// Lives in its own "use server" module (not in locale.ts) so a client
// component can import it without dragging locale.ts's `server-only`
// dependencies into the client bundle. The call site is responsible for
// refreshing afterwards (router.refresh() / revalidatePath) — this
// action only mutates state.
// ────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./locales";

/**
 * Persist the chosen locale: always the cookie, and — when authenticated
 * — users_meta.locale (the durable source of truth). Returns the locale
 * actually written (normalized to DEFAULT_LOCALE if the input is
 * unsupported) so the caller can reflect it without a refetch.
 */
export async function setUserLocale(locale: string): Promise<Locale> {
  const normalized: Locale = isSupportedLocale(locale)
    ? locale
    : DEFAULT_LOCALE;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, normalized, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("users_meta")
        .update({ locale: normalized })
        .eq("user_id", user.id);
    }
  } catch {
    // Anonymous, or Supabase unavailable — the cookie carries the choice.
  }

  return normalized;
}

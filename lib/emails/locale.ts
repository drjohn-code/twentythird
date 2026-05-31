import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";

// Resolve the locale an email should be written in, from users_meta.locale.
// Email is sent in the RECIPIENT's language (for invites, the recipient may
// have no account, so callers pass the inviter's id instead — the note is
// in the inviter's language and the invite landing lets them switch).
// Best-effort: any miss falls back to DEFAULT_LOCALE.
export async function localeForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data } = await supabase
      .from("users_meta")
      .select("locale")
      .eq("user_id", userId)
      .maybeSingle<{ locale: string | null }>();
    if (data?.locale && isSupportedLocale(data.locale)) return data.locale;
  } catch {
    // fall through
  }
  return DEFAULT_LOCALE;
}

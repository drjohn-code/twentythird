import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Per-user email preference gate. Reads users_meta.email_preferences
// for the given user and returns true if the named preference is on.
//
// Default-on semantics: a missing row, a missing key, or a non-boolean
// value all return true. This matches the live migration default for
// the active toggles and means a user whose row predates the jsonb
// column still receives transactional and opted-in emails.
//
// Which senders gate on which preference is documented in ROOM.md
// under the Email System section. As of this revision:
//   invite                     → no gate (recipient may have no account)
//   connection-accepted        → connection_requests (inviter opts in/out)
//   connection-ended           → no gate (transactional)
//   room-ready                 → no gate (transactional, one-time per user)
//   intake-submitted           → no gate (transactional, one-time per user)
//   weekly-catchup             → weekly_catchup (gated in the drainer)
//   consulting-session-reminder→ consulting_session_reminder (sender pending)
//   onboarding-resume          → no gate (no preference exists for it yet)

export type EmailPreferenceKey =
  | "weekly_catchup"
  | "consulting_session_reminder"
  | "connection_requests";

export async function emailPreferenceEnabled(
  admin: SupabaseClient,
  userId: string,
  key: EmailPreferenceKey,
): Promise<boolean> {
  const { data } = await admin
    .from("users_meta")
    .select("email_preferences")
    .eq("user_id", userId)
    .maybeSingle<{ email_preferences: Record<string, unknown> | null }>();
  const prefs = data?.email_preferences;
  if (!prefs) return true;
  const v = prefs[key];
  return typeof v === "boolean" ? v : true;
}

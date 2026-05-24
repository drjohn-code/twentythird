// Single source of truth for where an authenticated user lands.
// Imported by the callback, server actions, the sign-in/sign-up
// server pages, the middleware route gate, and any other code that
// needs to make the "where should this user be?" decision.
//
// No other file may decide this. If you find yourself open-coding a
// redirect target after auth, route it through here.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileGate = {
  onboarding_completed_at: string | null;
} | null;

const ONBOARDING_PATH = "/onboarding";
const DASHBOARD_PATH = "/room";

/**
 * Decide the path an authenticated user belongs on, given their
 * profile row. A missing/null profile is treated as "onboarding
 * incomplete" — the trigger and backfill in the migration mean a
 * profile should always exist, but if one is missing we route to
 * onboarding rather than letting the user roam.
 *
 * The /onboarding entry then forwards to the correct sub-step via
 * lib/onboarding/routing.ts.
 */
export function resolvePostAuthDestination(profile: ProfileGate): string {
  if (!profile || profile.onboarding_completed_at === null) {
    return ONBOARDING_PATH;
  }
  return DASHBOARD_PATH;
}

/**
 * Fetch the profile gate for the current session user.
 * Returns null if there's no user OR if the profile row doesn't exist
 * yet. Either way, resolvePostAuthDestination will route to onboarding.
 */
export async function fetchProfileGate(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileGate> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileGate;
}

/**
 * Validate an untrusted `?next=...` value.
 *
 * Rules:
 *   - Must start with a single "/" (relative path on this origin).
 *   - Must not start with "//" (protocol-relative URL).
 *   - Must not be under "/auth/*" (those pages are for unauth users
 *     or recovery flows; landing back on them after auth is a loop).
 *   - Must not contradict the onboarding gate: an incomplete user
 *     cannot bypass /onboarding via ?next=/.
 *
 * Returns the validated path, or null if the value should be
 * discarded and the caller should fall back to the computed
 * destination.
 */
export function safeNext(
  raw: string | null | undefined,
  computedDestination: string,
): string | null {
  if (!raw) return null;
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/auth/")) return null;
  if (raw === "/auth") return null;

  // Strip query/hash for the gate check, but preserve them in the
  // returned value so the caller can honour ?foo=bar etc.
  const pathOnly = raw.split(/[?#]/)[0];

  // If onboarding is incomplete, the only acceptable next is the
  // onboarding path itself. Anything else is a bypass attempt.
  if (computedDestination === ONBOARDING_PATH && pathOnly !== ONBOARDING_PATH) {
    return null;
  }

  return raw;
}

/**
 * Convenience: combine fetchProfileGate + resolvePostAuthDestination
 * + safeNext into a single call site. Pass the authenticated
 * supabase client, the user id, and the untrusted next param.
 */
export async function resolveDestinationForUser(
  supabase: SupabaseClient,
  userId: string,
  nextParam: string | null | undefined,
): Promise<string> {
  const profile = await fetchProfileGate(supabase, userId);
  const computed = resolvePostAuthDestination(profile);
  return safeNext(nextParam, computed) ?? computed;
}

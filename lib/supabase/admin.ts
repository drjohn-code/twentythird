// Server-only service-role client. Never imported by a client component.
//
// Used by submitIntake to enqueue analysis_jobs — that table has no
// insert policy for authenticated users by design, so the request has
// to come from the service role.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Returns the service-role client, or null if the env var is missing.
 * Callers should treat a null return as "best-effort failed" and
 * continue — the analysis worker is downstream and not in scope.
 */
export function adminClient(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;

  cached = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

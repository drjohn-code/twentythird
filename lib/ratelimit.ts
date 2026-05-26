import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Postgres-backed sliding-window rate limiter.
//
// In-memory limiters are useless on Vercel — each function invocation
// can land on a fresh cold instance with its own memory. The
// connection_lookup_attempts table gives us a shared counter that's
// consistent across instances.
//
// Currently used only by /api/connections/lookup. If a second endpoint
// ever needs its own bucket, add a `kind` column rather than reusing
// this table.

const LOOKUP_WINDOW_MS = 60_000;
const LOOKUP_MAX_ATTEMPTS = 10;

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

/**
 * Records one lookup attempt for `userId` and returns whether the
 * caller is within the per-minute budget. Read-then-write — not
 * transactional, so a determined attacker on a parallel burst could
 * sneak over the cap by a handful of requests. That's acceptable for
 * an enumeration mitigation; the budget itself is the deterrent.
 */
export async function checkAndRecordLookupRateLimit(
  admin: SupabaseClient,
  userId: string,
): Promise<RateLimitResult> {
  const cutoff = new Date(Date.now() - LOOKUP_WINDOW_MS).toISOString();

  const { count } = await admin
    .from("connection_lookup_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("attempted_at", cutoff);

  const used = count ?? 0;
  if (used >= LOOKUP_MAX_ATTEMPTS) {
    return { ok: false, retryAfterSeconds: 60 };
  }

  await admin
    .from("connection_lookup_attempts")
    .insert({ user_id: userId });

  return { ok: true, remaining: LOOKUP_MAX_ATTEMPTS - used - 1 };
}

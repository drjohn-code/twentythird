import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionCardRow } from "@/components/room/SubscriptionCard";

// Loads the full subscription row used by <SubscriptionCard>. The
// `cancel_at_period_end` column lands in a separate migration; if the
// deploy order slips (code first, schema later) the wide select throws
// PostgREST 42703 and the whole row would disappear — silently flipping
// active subscribers back to "not subscribed." Detect that one error
// and refetch the legacy columns, defaulting the new flag to false.
export async function loadSubscriptionRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionCardRow | null> {
  const wide = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionCardRow>();
  if (!wide.error) return wide.data;
  if (wide.error.code !== "42703") return null;

  const legacy = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<Omit<SubscriptionCardRow, "cancel_at_period_end">>();
  if (legacy.error || !legacy.data) return null;
  return { ...legacy.data, cancel_at_period_end: false };
}

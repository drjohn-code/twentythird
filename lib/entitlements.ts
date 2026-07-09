import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Single source of truth for "is this user allowed into the Consulting
// Room / clinical report generation." Every call site imports
// getEntitlement — nothing else re-derives access from `subscriptions`
// or `users_meta.trial_ends_at` directly.

export type EntitlementReason = "subscribed" | "trial" | "none";

export type Entitlement = {
  active: boolean;
  reason: EntitlementReason;
  trialEndsAt: Date | null;
  trialDaysRemaining: number | null;
};

type UsersMetaTrialRow = { trial_ends_at: string | null };
type SubscriptionStatusRow = { status: string | null };

const TRIAL_DAY_MS = 24 * 60 * 60 * 1000;

export function computeEntitlement(
  usersMeta: UsersMetaTrialRow,
  subscription: SubscriptionStatusRow | null,
): Entitlement {
  const trialEndsAt = usersMeta.trial_ends_at
    ? new Date(usersMeta.trial_ends_at)
    : null;
  const trialActive = !!trialEndsAt && trialEndsAt.getTime() > Date.now();

  if (subscription?.status === "active") {
    return { active: true, reason: "subscribed", trialEndsAt, trialDaysRemaining: null };
  }

  if (trialActive) {
    const daysRemaining = Math.max(
      0,
      Math.ceil((trialEndsAt!.getTime() - Date.now()) / TRIAL_DAY_MS),
    );
    return { active: true, reason: "trial", trialEndsAt, trialDaysRemaining: daysRemaining };
  }

  return { active: false, reason: "none", trialEndsAt, trialDaysRemaining: null };
}

export async function getEntitlement(
  userId: string,
  supabase: SupabaseClient,
): Promise<Entitlement> {
  const [{ data: meta }, { data: sub }] = await Promise.all([
    supabase
      .from("users_meta")
      .select("trial_ends_at")
      .eq("user_id", userId)
      .maybeSingle<UsersMetaTrialRow>(),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle<SubscriptionStatusRow>(),
  ]);

  return computeEntitlement(meta ?? { trial_ends_at: null }, sub ?? null);
}

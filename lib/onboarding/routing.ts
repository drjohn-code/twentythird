// Routing helper — given the profile + intake_responses state, decide
// where an authenticated user belongs inside the onboarding flow.
// One source of truth so the entry page, the account page, the intake
// pages, and the dashboard all agree.

import type { SupabaseClient } from "@supabase/supabase-js";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";
import type { IntakeStatus } from "@/lib/types/intake";

export type IntakeGate = {
  account_initiated_at: string | null;
  intake_submitted_at: string | null;
  intake_status: IntakeStatus | null;
  onboarding_step: number | null;
};

export const ACCOUNT_PATH = "/onboarding/account";
export const INTAKE_INTRO_PATH = "/onboarding/intake";
export const DASHBOARD_PATH = "/room";

export async function fetchIntakeGate(
  supabase: SupabaseClient,
  userId: string,
): Promise<IntakeGate | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "account_initiated_at, intake_submitted_at, intake_status, onboarding_step",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as IntakeGate;
}

/** Highest step_number with a saved row (1..10), or 0 if none. */
export async function fetchHighestSavedStep(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("intake_responses")
    .select("step_number")
    .eq("user_id", userId)
    .order("step_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ step_number: number }>();
  return data?.step_number ?? 0;
}

export function resolveOnboardingDestination(
  gate: IntakeGate | null,
  highestSavedStep: number,
): string {
  if (!gate || !gate.account_initiated_at) {
    return ACCOUNT_PATH;
  }
  if (gate.intake_submitted_at) {
    return DASHBOARD_PATH;
  }
  // If nothing saved yet, show the intro panel.
  if (highestSavedStep === 0) {
    return INTAKE_INTRO_PATH;
  }
  // Mid-intake: resume on the next unsaved step (clamped to last step).
  const next = Math.min(highestSavedStep + 1, TOTAL_STEPS);
  return `${INTAKE_INTRO_PATH}/${next}`;
}

export async function resolveForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [gate, highest] = await Promise.all([
    fetchIntakeGate(supabase, userId),
    fetchHighestSavedStep(supabase, userId),
  ]);
  return resolveOnboardingDestination(gate, highest);
}

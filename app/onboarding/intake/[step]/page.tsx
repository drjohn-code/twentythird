import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StepShell from "@/components/onboarding/StepShell";
import { getStep, isValidStepNumber } from "@/lib/onboarding/steps";
import {
  ACCOUNT_PATH,
  DASHBOARD_PATH,
  fetchIntakeGate,
  fetchHighestSavedStep,
} from "@/lib/onboarding/routing";
import type { StepPayload } from "@/lib/types/intake";

type Params = Promise<{ step: string }>;

type ResponseRow = {
  payload: StepPayload | null;
};

export default async function IntakeStepPage({
  params,
}: {
  params: Params;
}) {
  const { step: rawStep } = await params;
  const stepNumber = Number(rawStep);
  if (!isValidStepNumber(stepNumber)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/onboarding/intake/${stepNumber}`);
  }

  const gate = await fetchIntakeGate(supabase, user.id);
  if (!gate || !gate.account_initiated_at) redirect(ACCOUNT_PATH);
  if (gate.intake_submitted_at) redirect(DASHBOARD_PATH);

  const step = getStep(stepNumber)!;

  // Don't let the user skip ahead: max step they can be on is
  // (highestSaved + 1), clamped to TOTAL_STEPS.
  const highest = await fetchHighestSavedStep(supabase, user.id);
  const maxAllowed = Math.min(highest + 1, 10);
  if (stepNumber > maxAllowed) {
    redirect(`/onboarding/intake/${maxAllowed}`);
  }

  const { data: row } = await supabase
    .from("intake_responses")
    .select("payload")
    .eq("user_id", user.id)
    .eq("step_number", stepNumber)
    .maybeSingle<ResponseRow>();

  const initialPayload: StepPayload = row?.payload ?? {};

  return (
    <StepShell
      step={step}
      initialPayload={initialPayload}
      completedThrough={highest}
    />
  );
}

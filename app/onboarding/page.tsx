import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";
import OnboardingClient from "./OnboardingClient";

type ProfileRow = {
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

type ResponsesRow = {
  data: Record<string, Record<string, unknown>> | null;
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware also gates this, but a server-side check here means
  // the page never renders without a user even if middleware is
  // disabled in a future config change.
  if (!user) {
    redirect("/auth/sign-in?next=/onboarding");
  }

  const [{ data: profile }, { data: responses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_step, onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("onboarding_responses")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle<ResponsesRow>(),
  ]);

  if (profile?.onboarding_completed_at) {
    redirect("/");
  }

  const completedSteps = profile?.onboarding_step ?? 0;
  const initialStep = Math.min(completedSteps + 1, TOTAL_STEPS);
  const initialData = (responses?.data ?? {}) as Record<
    string,
    Record<string, unknown>
  >;

  return (
    <OnboardingClient
      initialStep={initialStep}
      initialCompletedSteps={completedSteps}
      initialData={initialData}
    />
  );
}

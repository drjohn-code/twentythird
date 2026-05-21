import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/layout/Reveal";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Eyebrow from "@/components/ui/Eyebrow";
import IntroPanel from "@/components/onboarding/IntroPanel";
import {
  ACCOUNT_PATH,
  DASHBOARD_PATH,
  fetchHighestSavedStep,
  fetchIntakeGate,
} from "@/lib/onboarding/routing";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";

export default async function IntakeIntroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/onboarding`);
  }

  const gate = await fetchIntakeGate(supabase, user.id);
  if (!gate || !gate.account_initiated_at) redirect(ACCOUNT_PATH);
  if (gate.intake_submitted_at) redirect(DASHBOARD_PATH);

  // If they're mid-intake, jump to the next unsaved step.
  const highest = await fetchHighestSavedStep(supabase, user.id);
  if (highest > 0) {
    const next = Math.min(highest + 1, TOTAL_STEPS);
    redirect(`/onboarding/intake/${next}`);
  }

  return (
    <main className="intake-intro-shell">
      <ScrollToTop />
      <div className="intake-intro-inner">
        <Reveal as="div" className="intake-intro-head">
          <Eyebrow>INTAKE · NO WRONG ANSWERS</Eyebrow>
          <h1 className="serif intake-intro-headline">
            There are no right answers <em>here</em>.
          </h1>
        </Reveal>
        <Reveal as="div" className="intake-intro-panel-wrap">
          <IntroPanel />
        </Reveal>
      </div>
    </main>
  );
}

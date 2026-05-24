import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/layout/Reveal";
import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import SignOutLink from "@/components/onboarding/SignOutLink";
import {
  ACCOUNT_PATH,
  DASHBOARD_PATH,
  INTAKE_INTRO_PATH,
  fetchHighestSavedStep,
  fetchIntakeGate,
} from "@/lib/onboarding/routing";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";

type Search = Promise<{ step?: string }>;

export default async function OnboardingSavedPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { step: stepParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/onboarding");

  const gate = await fetchIntakeGate(supabase, user.id);
  if (!gate || !gate.account_initiated_at) redirect(ACCOUNT_PATH);
  if (gate.intake_submitted_at) redirect(DASHBOARD_PATH);

  const highest = await fetchHighestSavedStep(supabase, user.id);
  const parsed = Number(stepParam);
  const target =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS
      ? parsed
      : Math.min(Math.max(highest, 1), TOTAL_STEPS);
  const keepGoingHref =
    highest === 0 && !Number.isInteger(parsed)
      ? INTAKE_INTRO_PATH
      : `${INTAKE_INTRO_PATH}/${target}`;

  return (
    <main className="intake-intro-shell">
      <div className="intake-intro-inner">
        <Reveal as="div" className="intake-intro-panel-wrap">
          <Glass className="intro-panel">
            <Eyebrow>SAVE &amp; PAUSE</Eyebrow>
            <h1 className="serif intake-intro-headline saved-headline">
              <em>Saved.</em> Come back when you&apos;re ready.
            </h1>
            <p className="intro-graf saved-body">
              Everything you&apos;ve written is in your case file. The
              room will open to the same place next time.
            </p>
            <div className="intro-divider" aria-hidden="true" />
            <div className="saved-actions">
              <RowLink href={keepGoingHref} arrow="left">
                keep going
              </RowLink>
              <SignOutLink>Leave the quiet room</SignOutLink>
            </div>
          </Glass>
        </Reveal>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/layout/Reveal";
import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";
import CTAGhost from "@/components/ui/CTAGhost";
import PendingStatus from "@/components/dashboard/PendingStatus";
import {
  ACCOUNT_PATH,
  INTAKE_INTRO_PATH,
  fetchIntakeGate,
  fetchHighestSavedStep,
} from "@/lib/onboarding/routing";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/dashboard");
  }

  const gate = await fetchIntakeGate(supabase, user.id);

  // No account yet — back to the account form.
  if (!gate || !gate.account_initiated_at) {
    redirect(ACCOUNT_PATH);
  }

  // Account exists but intake not submitted — show "intake incomplete"
  // shell with a button to resume.
  if (!gate.intake_submitted_at) {
    const highest = await fetchHighestSavedStep(supabase, user.id);
    const resumeStep = Math.min(highest + 1, TOTAL_STEPS);
    const resumePath =
      highest === 0
        ? INTAKE_INTRO_PATH
        : `${INTAKE_INTRO_PATH}/${resumeStep}`;
    return (
      <main className="dashboard-shell">
        <Reveal as="section" className="dashboard-head">
          <Eyebrow>STATUS · INTAKE INCOMPLETE</Eyebrow>
          <h1 className="serif dashboard-headline">
            The room is <em>still listening</em>.
          </h1>
          <p className="dashboard-lede">
            Your intake is saved up to step{" "}
            {String(highest).padStart(2, "0")}. Pick up where you left
            off when you have time.
          </p>
        </Reveal>
        <Reveal as="div" className="dashboard-panel-wrap">
          <Glass className="dashboard-panel">
            <div className="vh">
              <span className="lhs">
                <span>PROGRESS</span>{" "}
                <em>
                  {highest} of {TOTAL_STEPS} sections saved
                </em>
              </span>
              <span className="mono">Fig. 00</span>
            </div>
            <div className="dashboard-resume">
              <p className="serif-i">
                There are no right answers. There is no rush.
              </p>
              <a href={resumePath} className="pill dashboard-resume-pill">
                <span>Resume intake</span>
                <span aria-hidden="true" className="serif-i">
                  →
                </span>
              </a>
            </div>
          </Glass>
        </Reveal>
        <div className="dashboard-cta">
          <CTAGhost href="/">return to the quiet room</CTAGhost>
        </div>
      </main>
    );
  }

  // Submitted. The profile is either processing or ready.
  if (gate.intake_status === "ready") {
    // Out of scope per brief — placeholder.
    return (
      <main className="dashboard-shell">
        <Reveal as="section" className="dashboard-head">
          <Eyebrow>STATUS · READY</Eyebrow>
          <h1 className="serif dashboard-headline">
            Your profile is <em>ready</em>.
          </h1>
          <p className="dashboard-lede">
            The dashboard view that surfaces it is not built yet.
          </p>
        </Reveal>
      </main>
    );
  }

  const submittedAt = gate.intake_submitted_at
    ? new Date(gate.intake_submitted_at)
    : null;
  return <PendingStatus submittedAt={submittedAt} />;
}

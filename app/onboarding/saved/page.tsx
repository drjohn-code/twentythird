import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
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

  // Schedule the 24h "your answers are held" reminder. One pending row
  // per user+kind — a revisit to /onboarding/saved bumps send_after
  // instead of inserting a duplicate. The scheduler re-verifies the
  // intake is still unsubmitted at send time; if the user completes
  // the intake before the row fires, the row is sealed with note
  // 'skipped_completed' rather than sending the email.
  await scheduleOnboardingResume(user.id);

  const t = await getTranslations("onboarding");

  return (
    <main className="intake-intro-shell">
      <div className="intake-intro-inner">
        <Reveal as="div" className="intake-intro-panel-wrap">
          <Glass className="intro-panel">
            <Eyebrow>{t("saved.eyebrow")}</Eyebrow>
            <h1 className="serif intake-intro-headline saved-headline">
              <em>{t("saved.headlineItalic")}</em> {t("saved.headlineAfter")}
            </h1>
            <p className="intro-graf saved-body">
              {t("saved.body")}
            </p>
            <div className="intro-divider" aria-hidden="true" />
            <div className="saved-actions">
              <RowLink href={keepGoingHref} arrow="left">
                {t("saved.keepGoing")}
              </RowLink>
              <SignOutLink>{t("saved.leaveRoom")}</SignOutLink>
            </div>
          </Glass>
        </Reveal>
      </div>
    </main>
  );
}

async function scheduleOnboardingResume(userId: string): Promise<void> {
  const admin = adminClient();
  if (!admin) return;
  const sendAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await admin
    .from("scheduled_emails")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", "onboarding_resume")
    .is("sent_at", null)
    .is("failed_at", null)
    .maybeSingle<{ id: string }>();
  if (existing) {
    const { error } = await admin
      .from("scheduled_emails")
      .update({ send_after: sendAfter })
      .eq("id", existing.id);
    if (error) {
      console.error("[onboarding-saved] bump send_after failed:", error);
    }
    return;
  }
  const { error } = await admin.from("scheduled_emails").insert({
    user_id: userId,
    kind: "onboarding_resume",
    payload: {},
    send_after: sendAfter,
  });
  if (error) {
    console.error("[onboarding-saved] insert scheduled row failed:", error);
  }
}

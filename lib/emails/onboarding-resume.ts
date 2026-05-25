import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Onboarding resume — sent 24h after the user hits "save and return
// later" on the intake. The scheduler re-verifies the user has not
// completed the intake at send time; if they have, the row is sealed
// silently with note 'skipped_completed'.
//
// TODO: discuss whether onboarding-resume needs its own preference
// column on users_meta.email_preferences. For now it always sends —
// the user has not yet reached settings.

export type OnboardingResumeEmailInput = {
  to: string;
  firstName: string | null;
  /** Absolute URL back into the intake — typically the last saved step. */
  resumeUrl: string;
};

export function buildOnboardingResumeEmail(
  input: OnboardingResumeEmailInput,
): EmailPayload {
  const { firstName, resumeUrl } = input;
  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "your answers are held.";

  const text = [
    `${salutation}`,
    ``,
    `The intake is where you left it.`,
    ``,
    `Your intake resumes where you stopped. The work doesn't begin until it's complete.`,
    ``,
    `Return to the intake:`,
    resumeUrl,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader:
      "Your intake resumes where you stopped. The work doesn't begin until it's complete.",
    eyebrow: "INTAKE HELD",
    title: {
      text: "The intake is where you left it.",
      italicPhrase: "where you left it",
    },
    lede: "Your intake resumes where you stopped. The work doesn't begin until it's complete.",
    cta: { label: "Return to the intake", href: resumeUrl },
    fallbackUrl: resumeUrl,
    figureFooter: {
      figNumber: "08",
      leftItalic: "intake paused",
      rightLabel: "Resume",
      rightItalic: "where you stopped",
    },
  });

  return { subject, text, html };
}

export async function sendOnboardingResumeEmail(
  input: OnboardingResumeEmailInput,
) {
  const payload = buildOnboardingResumeEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

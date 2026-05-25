import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Intake-submitted email — sent the moment the user submits step 10.
// Confirmation only; no CTA. The room opens when the AI generation
// pipeline + the 5-minute scheduled email fires. See ROOM.md.
//
// Voice: brand-voiced, lowercase subject, single italic phrase in the
// hero title, no signature (the shell renders the institutional
// closer unconditionally).

export type IntakeSubmittedEmailInput = {
  to: string;
  /** Used only in the subject's salutation; null falls back to "you,". */
  firstName: string | null;
};

export function buildIntakeSubmittedEmail(
  input: IntakeSubmittedEmailInput,
): EmailPayload {
  const { firstName } = input;
  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "your profile is being read.";

  const text = [
    `${salutation}`,
    ``,
    `Your answers are in. The first pass through the psychodynamic models is underway. The room opens when the work is ready.`,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader:
      "First pass underway. The room opens when the work is ready.",
    eyebrow: "PROFILE READ",
    title: {
      text: "Your answers are being read.",
      italicPhrase: "being read",
    },
    lede: "The first pass through the psychodynamic models is underway. The room opens when the work is ready.",
    figureFooter: {
      figNumber: "01",
      leftItalic: "intake received",
      rightLabel: "First pass",
      rightItalic: "underway",
    },
  });

  return { subject, text, html };
}

export async function sendIntakeSubmittedEmail(
  input: IntakeSubmittedEmailInput,
) {
  const payload = buildIntakeSubmittedEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

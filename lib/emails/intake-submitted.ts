import "server-only";
import { brandEmailShell, escapeHtml, sendEmail } from "./sender";

// Intake-submitted email — sent the moment the user submits step 10.
// Mirrors the promise on the PendingStatus screen: answers received,
// first pass usually about two hours, we'll write again when the room
// opens. One italic lede, one short paragraph, one italic sign-off.

export type IntakeSubmittedEmailInput = {
  to: string;
  firstName: string | null;
};

export async function sendIntakeSubmittedEmail(
  input: IntakeSubmittedEmailInput,
) {
  const { to, firstName } = input;

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "your profile is being read.";
  const preheader = "answers received. first pass is underway.";

  const text = [
    `${salutation}`,
    ``,
    `your answers are in. the first pass through the psychodynamic models is underway — usually about two hours.`,
    ``,
    `we'll write again when the work is ready and the room opens.`,
    ``,
    `— the analyst.`,
  ].join("\n");

  const bodyHtml = `
    <tr><td style="padding:0 0 22px 0;font-style:italic;color:#5a5a60;font-size:24px;line-height:1.3">
      ${escapeHtml(salutation)}
    </td></tr>
    <tr><td style="padding:0 0 22px 0;color:#121214;font-size:16px;line-height:1.65">
      your answers are in. the first pass through the psychodynamic models is underway — usually about two hours. we&rsquo;ll write again when the work is ready and the room opens.
    </td></tr>
    <tr><td style="padding:6px 0 8px 0;font-style:italic;color:#5a5a60;font-size:15px;line-height:1.55">
      — the analyst.
    </td></tr>
  `;

  const html = brandEmailShell({ preheader, bodyHtml });

  return sendEmail({ to, subject, text, html });
}

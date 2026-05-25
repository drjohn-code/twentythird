import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Weekly catchup reminder — sent once per ISO week from the
// scheduled_emails drainer. The drainer enforces the preference gate
// (users_meta.email_preferences.weekly_catchup) and the per-week
// uniqueness via the partial unique index on (user_id, payload.iso_week).
//
// `isoWeek` is rendered into the figure footer as the clinical date
// stamp (Fig. 07 · 2026-W21) — the real ISO-8601 string from the
// scheduling payload.

export type WeeklyCatchupReminderEmailInput = {
  to: string;
  firstName: string | null;
  /** Absolute URL to /catchup. */
  catchupUrl: string;
  /** ISO-8601 week string from the scheduled_emails payload, e.g. "2026-W21". */
  isoWeek: string;
};

export function buildWeeklyCatchupReminderEmail(
  input: WeeklyCatchupReminderEmailInput,
): EmailPayload {
  const { firstName, catchupUrl, isoWeek } = input;
  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "this week's catchup is open.";

  const text = [
    `${salutation}`,
    ``,
    `A week has passed quietly.`,
    ``,
    `A short reflection — what's loud, what's stayed quiet, what's shifted. It updates the reading.`,
    ``,
    `Open the catchup:`,
    catchupUrl,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader: "A short reflection. Five minutes. It updates the reading.",
    eyebrow: "WEEKLY CATCHUP",
    title: {
      text: "A week has passed quietly.",
      italicPhrase: "quietly",
    },
    lede: "A short reflection — what's loud, what's stayed quiet, what's shifted. It updates the reading.",
    cta: { label: "Open the catchup", href: catchupUrl },
    fallbackUrl: catchupUrl,
    figureFooter: {
      figNumber: "07",
      leftItalic: isoWeek,
      rightLabel: "Catchup",
      rightItalic: "five minutes",
    },
  });

  return { subject, text, html };
}

export async function sendWeeklyCatchupReminderEmail(
  input: WeeklyCatchupReminderEmailInput,
) {
  const payload = buildWeeklyCatchupReminderEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

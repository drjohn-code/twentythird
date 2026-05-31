import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Weekly catchup reminder — sent once per ISO week from the
// scheduled_emails drainer. The drainer enforces the preference gate
// (users_meta.email_preferences.weekly_catchup) and the per-week
// uniqueness via the partial unique index on (user_id, payload.iso_week).
//
// `isoWeek` is rendered into the figure footer as the clinical date
// stamp (Fig. 07 · 2026-W21) — the real ISO-8601 string from the
// scheduling payload. It is data, not copy, so it is passed through
// verbatim rather than read from the catalog.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.

export type WeeklyCatchupReminderEmailInput = {
  to: string;
  firstName: string | null;
  /** Absolute URL to /catchup. */
  catchupUrl: string;
  /** ISO-8601 week string from the scheduled_emails payload, e.g. "2026-W21". */
  isoWeek: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildWeeklyCatchupReminderEmail(
  input: WeeklyCatchupReminderEmailInput,
): Promise<EmailPayload> {
  const { firstName, catchupUrl, isoWeek, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = t("weeklyCatchupReminder.subject");

  const text = t("weeklyCatchupReminder.text", { salutation, catchupUrl });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("weeklyCatchupReminder.titleText");
  let italicPhrase = t("weeklyCatchupReminder.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("weeklyCatchupReminder.titleText");
    italicPhrase = tEn("weeklyCatchupReminder.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("weeklyCatchupReminder.preheader"),
    eyebrow: t("weeklyCatchupReminder.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("weeklyCatchupReminder.lede"),
    cta: { label: t("weeklyCatchupReminder.ctaLabel"), href: catchupUrl },
    fallbackUrl: catchupUrl,
    figureFooter: {
      figNumber: "07",
      leftItalic: isoWeek,
      rightLabel: t("weeklyCatchupReminder.figRightLabel"),
      rightItalic: t("weeklyCatchupReminder.figRightItalic"),
    },
    chrome: {
      orWord: t("shell.orWord"),
      fallbackPreamble: t("shell.fallbackPreamble"),
      attendingInstitution: t("shell.attendingInstitution"),
      tagline: t("shell.tagline"),
      automatedFooter: t("shell.automatedFooter"),
    },
  });

  return { subject, text, html };
}

export async function sendWeeklyCatchupReminderEmail(
  input: WeeklyCatchupReminderEmailInput,
) {
  const payload = await buildWeeklyCatchupReminderEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

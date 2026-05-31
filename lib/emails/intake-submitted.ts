import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Intake-submitted email — sent the moment the user submits step 10.
// Confirmation only; no CTA. The room opens when the AI generation
// pipeline + the 5-minute scheduled email fires. See ROOM.md.
//
// Voice: brand-voiced, lowercase subject, single italic phrase in the
// hero title, no signature (the shell renders the institutional
// closer unconditionally).
//
// Localized: every user-facing string resolves from the "email"
// namespace via getTranslations({ locale }), so the email renders in
// the recipient's language. `locale` is required on the input.

export type IntakeSubmittedEmailInput = {
  to: string;
  /** Used only in the subject's salutation; null falls back to "you,". */
  firstName: string | null;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildIntakeSubmittedEmail(
  input: IntakeSubmittedEmailInput,
): Promise<EmailPayload> {
  const { firstName, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = t("intakeSubmitted.subject");

  const text = t("intakeSubmitted.text", { salutation });

  // ITALICPHRASE FALLBACK GUARD: if the translated phrase is not an
  // exact substring of the translated title, fall back to the English
  // pair so the shell never throws.
  let titleText = t("intakeSubmitted.titleText");
  let italicPhrase = t("intakeSubmitted.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("intakeSubmitted.titleText");
    italicPhrase = tEn("intakeSubmitted.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("intakeSubmitted.preheader"),
    eyebrow: t("intakeSubmitted.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("intakeSubmitted.lede"),
    figureFooter: {
      figNumber: "01",
      leftItalic: t("intakeSubmitted.figLeftItalic"),
      rightLabel: t("intakeSubmitted.figRightLabel"),
      rightItalic: t("intakeSubmitted.figRightItalic"),
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

export async function sendIntakeSubmittedEmail(
  input: IntakeSubmittedEmailInput,
) {
  const payload = await buildIntakeSubmittedEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

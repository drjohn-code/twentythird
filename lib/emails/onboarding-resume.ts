import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Onboarding resume — sent 24h after the user hits "save and return
// later" on the intake. The scheduler re-verifies the user has not
// completed the intake at send time; if they have, the row is sealed
// silently with note 'skipped_completed'.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.
//
// TODO: discuss whether onboarding-resume needs its own preference
// column on users_meta.email_preferences. For now it always sends —
// the user has not yet reached settings.

export type OnboardingResumeEmailInput = {
  to: string;
  firstName: string | null;
  /** Absolute URL back into the intake — typically the last saved step. */
  resumeUrl: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildOnboardingResumeEmail(
  input: OnboardingResumeEmailInput,
): Promise<EmailPayload> {
  const { firstName, resumeUrl, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = t("onboardingResume.subject");

  const text = t("onboardingResume.text", { salutation, resumeUrl });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("onboardingResume.titleText");
  let italicPhrase = t("onboardingResume.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("onboardingResume.titleText");
    italicPhrase = tEn("onboardingResume.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("onboardingResume.preheader"),
    eyebrow: t("onboardingResume.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("onboardingResume.lede"),
    cta: { label: t("onboardingResume.ctaLabel"), href: resumeUrl },
    fallbackUrl: resumeUrl,
    figureFooter: {
      figNumber: "08",
      leftItalic: t("onboardingResume.figLeftItalic"),
      rightLabel: t("onboardingResume.figRightLabel"),
      rightItalic: t("onboardingResume.figRightItalic"),
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

export async function sendOnboardingResumeEmail(
  input: OnboardingResumeEmailInput,
) {
  const payload = await buildOnboardingResumeEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

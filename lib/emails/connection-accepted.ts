import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Sent to the inviter when the invitee accepts the connection. Brief,
// institutional, no celebratory exclamation. Mirrors the Today line.
// Preference-gated: respects users_meta.email_preferences.connection_requests
// at the route layer.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.

export type ConnectionAcceptedEmailInput = {
  to: string;
  /** Inviter's first name — used only in the text body's salutation. */
  inviterFirstName: string | null;
  /** Connection's first name as captured on accept. */
  connectionFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildConnectionAcceptedEmail(
  input: ConnectionAcceptedEmailInput,
): Promise<EmailPayload> {
  const { inviterFirstName, connectionFirstName, roomUrl, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  // Subject keeps the lowercase brand convention; title is sentence
  // case because the proper noun anchors the line. Both casings use
  // the locale-aware variants so non-ASCII names (Turkish "İ",
  // Lithuanian, German ß, etc.) round-trip correctly.
  const nameLower = connectionFirstName.trim().toLocaleLowerCase();
  const nameTitle = capitalizeFirst(connectionFirstName.trim());

  const salutation = inviterFirstName ? `${inviterFirstName},` : "you,";

  const subject = t("connectionAccepted.subject", { nameLower });

  const text = t("connectionAccepted.text", { salutation, nameTitle, roomUrl });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("connectionAccepted.titleText", { nameTitle });
  let italicPhrase = t("connectionAccepted.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("connectionAccepted.titleText", { nameTitle });
    italicPhrase = tEn("connectionAccepted.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("connectionAccepted.preheader", { nameTitle }),
    eyebrow: t("connectionAccepted.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("connectionAccepted.lede"),
    cta: { label: t("connectionAccepted.ctaLabel"), href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "05",
      leftItalic: t("connectionAccepted.figLeftItalic"),
      rightLabel: t("connectionAccepted.figRightLabel"),
      rightItalic: t("connectionAccepted.figRightItalic"),
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

export async function sendConnectionAcceptedEmail(
  input: ConnectionAcceptedEmailInput,
) {
  const payload = await buildConnectionAcceptedEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

function capitalizeFirst(s: string): string {
  // Locale-aware first-letter capitalization. Preserves the rest of
  // the string as written, so "DJ", "Anna-Marie", or "İrem" round-trip
  // correctly (a naive .toLowerCase() pre-pass would mangle the
  // Turkish dotted-I, the German ß, etc.).
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}

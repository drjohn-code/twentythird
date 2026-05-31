import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Sent to the other party when one side disconnects (and on account
// deletion, one per active connection). Transactional — no preference
// gate. The line the Today line uses.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.

export type ConnectionEndedEmailInput = {
  /** Recipient — the party that did NOT initiate the disconnect. */
  to: string;
  /** First name of the party that ended the connection. */
  enderFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildConnectionEndedEmail(
  input: ConnectionEndedEmailInput,
): Promise<EmailPayload> {
  const { enderFirstName, roomUrl, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  // Locale-aware casings so non-ASCII names (Turkish "İ", Lithuanian,
  // German ß, etc.) round-trip correctly.
  const nameLower = enderFirstName.trim().toLocaleLowerCase();
  const nameTitle = capitalizeFirst(enderFirstName.trim());

  const subject = t("connectionEnded.subject", { nameLower });

  const text = t("connectionEnded.text", { nameTitle, roomUrl });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("connectionEnded.titleText", { nameTitle });
  let italicPhrase = t("connectionEnded.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("connectionEnded.titleText", { nameTitle });
    italicPhrase = tEn("connectionEnded.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("connectionEnded.preheader", { nameTitle }),
    eyebrow: t("connectionEnded.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("connectionEnded.lede"),
    cta: { label: t("connectionEnded.ctaLabel"), href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "06",
      leftItalic: t("connectionEnded.figLeftItalic"),
      rightLabel: t("connectionEnded.figRightLabel"),
      rightItalic: t("connectionEnded.figRightItalic"),
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

export async function sendConnectionEndedEmail(
  input: ConnectionEndedEmailInput,
) {
  const payload = await buildConnectionEndedEmail(input);
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

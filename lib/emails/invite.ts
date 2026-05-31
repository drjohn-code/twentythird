import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";
import { NOTE_MAX_LENGTH } from "./invite-constants";

export { NOTE_MAX_LENGTH };

// Connection invite email — sent to a prospective connection on behalf
// of the inviter. The single human beat in an otherwise institutional
// system: the inviter's optional one-line note renders as an italic
// blockquote between the lede and the CTA.
//
// **Contract — the template trusts its input.**
//   - `inviterFirstName: string` (non-nullable). The route resolves it
//     via firstNameFrom(profiles.full_name); if that returns null, the
//     route returns 422 missing_inviter_first_name without calling the
//     template. No fallback to "An invitation, quietly issued."
//   - `note: string | null`. The route trims, length-checks against
//     NOTE_MAX_LENGTH, and treats trim-empty as null. The template
//     receives either a valid non-empty trimmed string or null and
//     renders accordingly. No defensive trim/cap/empty handling here.
//
// NOTE_MAX_LENGTH is exported as the shared source of truth for the
// form layer (InviteForm `maxLength`) and the server layer
// (handleInvite validation). The template does NOT enforce it.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.
//
// TODO: promote profiles.first_name to a real column, backfill from
// full_name, then read it directly in the route.

export type InviteEmailInput = {
  to: string;
  inviterFirstName: string;
  /** Trimmed non-empty note from the form, or null. Route's responsibility. */
  note: string | null;
  /** Full URL to /invite/<token>. */
  acceptUrl: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildInviteEmail(
  input: InviteEmailInput,
): Promise<EmailPayload> {
  const { inviterFirstName, note, acceptUrl, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  const subject = t("invite.subject", { inviterName: inviterFirstName });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("invite.titleText", { inviterName: inviterFirstName });
  let italicPhrase = t("invite.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("invite.titleText", { inviterName: inviterFirstName });
    italicPhrase = tEn("invite.italicPhrase");
  }

  // Null = absent (don't render the blockquote). Anything non-null is
  // assumed already trimmed + length-checked by the route.
  const noteForShell = note !== null ? { italicText: note } : undefined;

  // Plain-text body. Blank lines are dropped (filter) so the assembled
  // string matches the original layout: content lines joined by "\n",
  // the optional note line inserted between body and the "open" line.
  const text = [
    t("invite.textIntro", { inviterName: inviterFirstName }),
    t("invite.textBody"),
    note !== null
      ? t("invite.textNote", { inviterName: inviterFirstName, note })
      : ``,
    t("invite.textOpen"),
    acceptUrl,
    t("invite.textSecurity"),
    t("invite.textCloser"),
  ]
    .filter((l) => l !== ``)
    .join("\n");

  const html = brandEmailShell({
    preheader: t("invite.preheader", { inviterName: inviterFirstName }),
    eyebrow: t("invite.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("invite.lede"),
    note: noteForShell,
    cta: { label: t("invite.ctaLabel"), href: acceptUrl },
    fallbackUrl: acceptUrl,
    figureFooter: {
      figNumber: "04",
      leftItalic: t("invite.figLeftItalic"),
      rightLabel: t("invite.figRightLabel"),
      rightItalic: t("invite.figRightItalic"),
    },
    securityNote: t("invite.securityNote"),
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

export async function sendInviteEmail(input: InviteEmailInput) {
  const payload = await buildInviteEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

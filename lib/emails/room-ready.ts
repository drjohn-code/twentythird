import "server-only";
import { getTranslations } from "next-intl/server";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Room-ready email — sent once intake_status flips from 'processing'
// to 'ready'. Production trigger is the scheduled_emails drainer at
// /api/internal/run-scheduled-emails (5 min after intake submit, with
// up to 6h of retry deferrals while intake_status is still
// 'processing'). Dev manual trigger remains at /api/dev/open-room.
//
// One-time per user; no preference gate. CTA points at /room.
//
// Localized: strings resolve from the "email" namespace via
// getTranslations({ locale }) so the email renders in the recipient's
// language. `locale` is required on the input.

export type RoomReadyEmailInput = {
  to: string;
  /** First name from profiles.full_name (via firstNameFrom), or null. */
  firstName: string | null;
  /** Fully composed URL to /room. Caller resolves NEXT_PUBLIC_SITE_URL. */
  roomUrl: string;
  /** Recipient's locale — renders the email in their language. */
  locale: string;
};

export async function buildRoomReadyEmail(
  input: RoomReadyEmailInput,
): Promise<EmailPayload> {
  const { firstName, roomUrl, locale } = input;
  const t = await getTranslations({ locale, namespace: "email" });

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = t("roomReady.subject");

  const text = t("roomReady.text", { salutation, roomUrl });

  // ITALICPHRASE FALLBACK GUARD.
  let titleText = t("roomReady.titleText");
  let italicPhrase = t("roomReady.italicPhrase");
  if (!titleText.includes(italicPhrase)) {
    const tEn =
      locale === "en"
        ? t
        : await getTranslations({ locale: "en", namespace: "email" });
    titleText = tEn("roomReady.titleText");
    italicPhrase = tEn("roomReady.italicPhrase");
  }

  const html = brandEmailShell({
    preheader: t("roomReady.preheader"),
    eyebrow: t("roomReady.eyebrow"),
    title: { text: titleText, italicPhrase },
    lede: t("roomReady.lede"),
    cta: { label: t("roomReady.ctaLabel"), href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "03",
      leftItalic: t("roomReady.figLeftItalic"),
      rightLabel: t("roomReady.figRightLabel"),
      rightItalic: t("roomReady.figRightItalic"),
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

export async function sendRoomReadyEmail(input: RoomReadyEmailInput) {
  const payload = await buildRoomReadyEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

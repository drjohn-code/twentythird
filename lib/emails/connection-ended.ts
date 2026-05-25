import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Sent to the other party when one side disconnects (and on account
// deletion, one per active connection). Transactional — no preference
// gate. The line the Today line uses.

export type ConnectionEndedEmailInput = {
  /** Recipient — the party that did NOT initiate the disconnect. */
  to: string;
  /** First name of the party that ended the connection. */
  enderFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
};

export function buildConnectionEndedEmail(
  input: ConnectionEndedEmailInput,
): EmailPayload {
  const { enderFirstName, roomUrl } = input;

  // Locale-aware casings so non-ASCII names (Turkish "İ", Lithuanian,
  // German ß, etc.) round-trip correctly.
  const nameLower = enderFirstName.trim().toLocaleLowerCase();
  const nameTitle = capitalizeFirst(enderFirstName.trim());
  const subject = `${nameLower} has ended the connection.`;
  const titleText = `${nameTitle} has ended the connection.`;

  const text = [
    `${nameTitle} has ended the connection.`,
    ``,
    `Your reading will adjust over the next session. What was said about the relationship is retained in the case file; it no longer factors into the active reading.`,
    ``,
    `Return to the room:`,
    roomUrl,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader: `${nameTitle} has ended the connection. Your reading will adjust over the next session.`,
    eyebrow: "CONNECTION ENDED",
    title: {
      text: titleText,
      italicPhrase: "ended the connection",
    },
    lede: "Your reading will adjust over the next session. What was said about the relationship is retained in the case file; it no longer factors into the active reading.",
    cta: { label: "Return to the room", href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "06",
      leftItalic: "connection ended",
      rightLabel: "Effect",
      rightItalic: "next session forward",
    },
  });

  return { subject, text, html };
}

export async function sendConnectionEndedEmail(
  input: ConnectionEndedEmailInput,
) {
  const payload = buildConnectionEndedEmail(input);
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

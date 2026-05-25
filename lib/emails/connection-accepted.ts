import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Sent to the inviter when the invitee accepts the connection. Brief,
// institutional, no celebratory exclamation. Mirrors the Today line.
// Preference-gated: respects users_meta.email_preferences.connection_requests
// at the route layer.

export type ConnectionAcceptedEmailInput = {
  to: string;
  /** Inviter's first name — used only in the text body's salutation. */
  inviterFirstName: string | null;
  /** Connection's first name as captured on accept. */
  connectionFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
};

export function buildConnectionAcceptedEmail(
  input: ConnectionAcceptedEmailInput,
): EmailPayload {
  const { inviterFirstName, connectionFirstName, roomUrl } = input;

  // Subject keeps the lowercase brand convention; title is sentence
  // case because the proper noun anchors the line. Both casings use
  // the locale-aware variants so non-ASCII names (Turkish "İ",
  // Lithuanian, German ß, etc.) round-trip correctly.
  const nameLower = connectionFirstName.trim().toLocaleLowerCase();
  const nameTitle = capitalizeFirst(connectionFirstName.trim());
  const subject = `${nameLower} has accepted the connection.`;
  const titleText = `${nameTitle} has accepted the connection.`;

  const salutation = inviterFirstName ? `${inviterFirstName},` : "you,";
  const text = [
    `${salutation}`,
    ``,
    `${nameTitle} has accepted the connection.`,
    ``,
    `Their relationship intake will inform your reading from the next session forward. They will not see your readings; you will not see theirs.`,
    ``,
    `Return to the room:`,
    roomUrl,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader: `${nameTitle} has accepted the connection. Effect on next session forward.`,
    eyebrow: "CONNECTION ACCEPTED",
    title: {
      text: titleText,
      italicPhrase: "accepted the connection",
    },
    lede: "Their relationship intake will inform your reading from the next session forward. They will not see your readings; you will not see theirs.",
    cta: { label: "Return to the room", href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "05",
      leftItalic: "connection accepted",
      rightLabel: "Effect",
      rightItalic: "next session forward",
    },
  });

  return { subject, text, html };
}

export async function sendConnectionAcceptedEmail(
  input: ConnectionAcceptedEmailInput,
) {
  const payload = buildConnectionAcceptedEmail(input);
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

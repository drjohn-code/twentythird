import "server-only";
import { brandEmailShell, escapeHtml, sendEmail } from "./sender";

// Sent to the other party when one side disconnects. No judgment, no
// blame. The line is the same the Today line uses.

export type ConnectionEndedEmailInput = {
  /** Recipient email — the party that did NOT initiate the disconnect. */
  to: string;
  /** First name of the party that ended the connection. */
  enderFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
};

export async function sendConnectionEndedEmail(
  input: ConnectionEndedEmailInput,
) {
  const { to, enderFirstName, roomUrl } = input;

  const name = enderFirstName.trim().toLowerCase();
  const subject = `${name} has ended the connection.`;

  const text = [
    `${name} has ended the connection.`,
    ``,
    `Your reading will adjust over the next session. What was said about the relationship is retained in the case file; it no longer factors into the active reading.`,
    ``,
    `Return to the room when you are ready:`,
    roomUrl,
  ].join("\n");

  const bodyHtml = `
    <tr><td style="padding:0 0 22px 0;font-style:italic;color:#5a5a60;font-size:22px;line-height:1.35">
      ${escapeHtml(name)} has ended the connection.
    </td></tr>
    <tr><td style="padding:0 0 22px 0;color:#121214;font-size:16px;line-height:1.65">
      Your reading will adjust over the next session. What was said about the relationship is retained in the case file; it no longer factors into the active reading.
    </td></tr>
    <tr><td style="padding:6px 0 0 0">
      <a href="${escapeHtml(roomUrl)}" style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:-0.005em;color:#121214;text-decoration:none;border-bottom:1px solid #121214;padding-bottom:3px">
        return to the room →
      </a>
    </td></tr>
  `;

  const html = brandEmailShell({
    preheader: `${name} has ended the connection.`,
    bodyHtml,
  });

  return sendEmail({ to, subject, text, html });
}

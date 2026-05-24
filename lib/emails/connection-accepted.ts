import "server-only";
import { brandEmailShell, escapeHtml, sendEmail } from "./sender";

// Sent to the inviter when the invitee accepts the connection. Brief,
// analyst-voiced, no celebratory exclamation. Mirrors the Today line.

export type ConnectionAcceptedEmailInput = {
  /** Inviter's email. */
  to: string;
  /** Inviter's first name — used in the body greeting. */
  inviterFirstName: string | null;
  /** Connection's first name as captured on accept. */
  connectionFirstName: string;
  /** Absolute URL back to /room. */
  roomUrl: string;
};

export async function sendConnectionAcceptedEmail(
  input: ConnectionAcceptedEmailInput,
) {
  const { to, inviterFirstName, connectionFirstName, roomUrl } = input;

  const name = connectionFirstName.trim().toLowerCase();
  const subject = `${name} has accepted the connection.`;

  const greeting = inviterFirstName ? `${inviterFirstName}, ` : "";

  const text = [
    `${greeting}${name} has accepted the connection.`,
    ``,
    `Their relationship intake will inform your reading from the next session forward. They will not see your readings; you will not see theirs.`,
    ``,
    `Return to the room when you are ready:`,
    roomUrl,
  ].join("\n");

  const bodyHtml = `
    <tr><td style="padding:0 0 22px 0;font-style:italic;color:#5a5a60;font-size:22px;line-height:1.35">
      ${escapeHtml(name)} has accepted the connection.
    </td></tr>
    <tr><td style="padding:0 0 22px 0;color:#121214;font-size:16px;line-height:1.65">
      Their relationship intake will inform your reading from the next session forward. They will not see your readings; you will not see theirs.
    </td></tr>
    <tr><td style="padding:6px 0 0 0">
      <a href="${escapeHtml(roomUrl)}" style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:-0.005em;color:#121214;text-decoration:none;border-bottom:1px solid #121214;padding-bottom:3px">
        return to the room →
      </a>
    </td></tr>
  `;

  const html = brandEmailShell({
    preheader: `${name} has accepted the connection.`,
    bodyHtml,
  });

  return sendEmail({ to, subject, text, html });
}

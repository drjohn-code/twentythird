import "server-only";
import { brandEmailShell, escapeHtml, sendEmail } from "./sender";
import { inviteEmail } from "@/lib/copy";

// Connection invite email — sent to a prospective connection on behalf
// of the inviter. Subject and body live entirely inside the analyst's
// voice; the inviter's optional note appears as a serif italic block.

export type InviteEmailInput = {
  to: string;
  inviterFirstName: string;
  /** Optional one-line note the inviter wrote on the form. Already trimmed. */
  note: string | null;
  /** Full URL to /invite/<token> — the route handler composes this. */
  acceptUrl: string;
};

export async function sendInviteEmail(input: InviteEmailInput) {
  const { to, inviterFirstName, note, acceptUrl } = input;

  const subject = inviteEmail.subject(inviterFirstName);

  const text = [
    `${inviterFirstName} has invited you into their reading at TwentyThird.`,
    ``,
    `TwentyThird is an editorial-clinical instrument: a quiet room where the structure of someone's inner life is read with care and language they can take to a clinician. A connection does not see the inviter's readings or sessions, and you will not see theirs. What you say about the relationship feeds the model that produces ${inviterFirstName}'s reading — and, if you choose, your own.`,
    ``,
    note ? `${inviterFirstName} added a note for you:\n  ${note}` : ``,
    note ? `` : ``,
    `Open the invite to read more and choose how to respond:`,
    acceptUrl,
    ``,
    `If this arrived in error, the invite expires on its own in fourteen days.`,
  ]
    .filter((l) => l !== ``)
    .join("\n");

  const noteHtml = note
    ? `<tr><td style="padding:24px 0 24px 0">
        <blockquote style="margin:0;padding:0 0 0 18px;border-left:1px solid rgba(0,0,0,0.16);font-style:italic;color:#5a5a60;font-size:18px;line-height:1.55">
          ${escapeHtml(note)}
        </blockquote>
      </td></tr>`
    : "";

  const bodyHtml = `
    <tr><td style="padding:0 0 22px 0;font-style:italic;color:#5a5a60;font-size:24px;line-height:1.3">
      ${escapeHtml(inviterFirstName)} has invited you into their reading.
    </td></tr>
    <tr><td style="padding:0 0 18px 0;color:#121214;font-size:16px;line-height:1.65">
      TwentyThird is an editorial-clinical instrument — a quiet room where the structure of someone's inner life is read with care, and rendered in language a clinician can use. A connection does not see the inviter's readings or sessions, and ${escapeHtml(inviterFirstName)} will not see yours. What you say about the relationship feeds the model that produces their reading.
    </td></tr>
    ${noteHtml}
    <tr><td style="padding:6px 0 28px 0">
      <a href="${escapeHtml(acceptUrl)}" style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:-0.005em;color:#121214;text-decoration:none;border-bottom:1px solid #121214;padding-bottom:3px">
        open the invite →
      </a>
    </td></tr>
    <tr><td style="padding:0 0 8px 0;color:#5a5a60;font-style:italic;font-size:14px;line-height:1.55">
      if this arrived in error, the invite expires on its own in fourteen days.
    </td></tr>
  `;

  const html = brandEmailShell({
    preheader: `${inviterFirstName} would like you in the reading.`,
    bodyHtml,
  });

  return sendEmail({ to, subject, text, html });
}

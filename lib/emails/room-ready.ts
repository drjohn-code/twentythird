import "server-only";
import { brandEmailShell, escapeHtml, sendEmail } from "./sender";

// Room-ready email — sent once intake_status flips from 'processing'
// to 'ready'. Today the trigger is the dev-only manual route at
// app/api/dev/open-room/route.ts; production will be the scheduled
// 2-hour pg_cron job described in ROOM.md under "Known gaps before
// launch". The template stays small on purpose — one italic lede, one
// short paragraph, one CTA. Nothing else.

export type RoomReadyEmailInput = {
  to: string;
  /** First name from profiles.full_name, or null if unknown. */
  firstName: string | null;
  /** Fully composed URL to /room. The caller is the one with NEXT_PUBLIC_SITE_URL. */
  roomUrl: string;
};

export async function sendRoomReadyEmail(input: RoomReadyEmailInput) {
  const { to, firstName, roomUrl } = input;

  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "your room is open.";
  const preheader = "the first reading is ready.";

  const text = [
    `${salutation}`,
    ``,
    `the work is ready.`,
    ``,
    `your first reading is in the room — twelve blocks of psychodynamic profile, ready to read in your own time. nothing about the room is fixed; everything refines as you bring more of yourself to it.`,
    ``,
    `enter the room:`,
    roomUrl,
    ``,
    `we'll keep listening.`,
  ].join("\n");

  const bodyHtml = `
    <tr><td style="padding:0 0 22px 0;font-style:italic;color:#5a5a60;font-size:24px;line-height:1.3">
      ${escapeHtml(salutation)}
    </td></tr>
    <tr><td style="padding:0 0 18px 0;font-style:italic;color:#121214;font-size:22px;line-height:1.35">
      the work is ready.
    </td></tr>
    <tr><td style="padding:0 0 22px 0;color:#121214;font-size:16px;line-height:1.65">
      your first reading is in the room — twelve blocks of psychodynamic profile, ready to read in your own time. nothing about the room is fixed; everything refines as you bring more of yourself to it.
    </td></tr>
    <tr><td style="padding:6px 0 28px 0">
      <a href="${escapeHtml(roomUrl)}" style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:-0.005em;color:#121214;text-decoration:none;border-bottom:1px solid #121214;padding-bottom:3px">
        enter the room →
      </a>
    </td></tr>
    <tr><td style="padding:0 0 8px 0;color:#5a5a60;font-style:italic;font-size:14px;line-height:1.55">
      we&rsquo;ll keep listening.
    </td></tr>
  `;

  const html = brandEmailShell({ preheader, bodyHtml });

  return sendEmail({ to, subject, text, html });
}

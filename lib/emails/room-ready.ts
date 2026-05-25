import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";

// Room-ready email — sent once intake_status flips from 'processing'
// to 'ready'. Production trigger is the scheduled_emails drainer at
// /api/internal/run-scheduled-emails (5 min after intake submit, with
// up to 6h of retry deferrals while intake_status is still
// 'processing'). Dev manual trigger remains at /api/dev/open-room.
//
// One-time per user; no preference gate. CTA points at /room.

export type RoomReadyEmailInput = {
  to: string;
  /** First name from profiles.full_name (via firstNameFrom), or null. */
  firstName: string | null;
  /** Fully composed URL to /room. Caller resolves NEXT_PUBLIC_SITE_URL. */
  roomUrl: string;
};

export function buildRoomReadyEmail(input: RoomReadyEmailInput): EmailPayload {
  const { firstName, roomUrl } = input;
  const salutation = firstName ? `${firstName},` : "you,";

  const subject = "your room is open.";

  const text = [
    `${salutation}`,
    ``,
    `The first reading is open.`,
    ``,
    `Twelve blocks of psychodynamic profile, in the room and ready to read. The work refines as you return to it.`,
    ``,
    `Enter the room:`,
    roomUrl,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ].join("\n");

  const html = brandEmailShell({
    preheader:
      "Twelve blocks ready to read. The work refines as you return to it.",
    eyebrow: "ROOM READY",
    title: {
      text: "The first reading is open.",
      italicPhrase: "first reading",
    },
    lede: "Twelve blocks of psychodynamic profile, in the room and ready to read. The work refines as you return to it.",
    cta: { label: "Enter the room", href: roomUrl },
    fallbackUrl: roomUrl,
    figureFooter: {
      figNumber: "03",
      leftItalic: "room opened",
      rightLabel: "First reading",
      rightItalic: "ready",
    },
  });

  return { subject, text, html };
}

export async function sendRoomReadyEmail(input: RoomReadyEmailInput) {
  const payload = buildRoomReadyEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

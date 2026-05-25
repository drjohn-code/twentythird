import "server-only";
import { brandEmailShell, sendEmail, type EmailPayload } from "./sender";
import { inviteEmail } from "@/lib/copy";
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
// TODO: promote profiles.first_name to a real column, backfill from
// full_name, then read it directly in the route.

export type InviteEmailInput = {
  to: string;
  inviterFirstName: string;
  /** Trimmed non-empty note from the form, or null. Route's responsibility. */
  note: string | null;
  /** Full URL to /invite/<token>. */
  acceptUrl: string;
};

export function buildInviteEmail(input: InviteEmailInput): EmailPayload {
  const { inviterFirstName, note, acceptUrl } = input;

  const subject = inviteEmail.subject(inviterFirstName);
  const titleText = `${inviterFirstName} would like you in the reading.`;

  // Null = absent (don't render the blockquote). Anything non-null is
  // assumed already trimmed + length-checked by the route.
  const noteForShell = note !== null ? { italicText: note } : undefined;

  const text = [
    `${inviterFirstName} would like you in the reading at TwentyThird.`,
    ``,
    `TwentyThird is a quiet room where the structure of someone's inner life is read with care. A connection does not see the inviter's readings or sessions, and you will not see theirs.`,
    ``,
    note !== null ? `${inviterFirstName} added a note:\n  ${note}` : ``,
    note !== null ? `` : ``,
    `Open the invite:`,
    acceptUrl,
    ``,
    `If this arrived in error, the invite expires on its own in fourteen days.`,
    ``,
    `CognitiveLab, WelloWork AB`,
    `ATTENDING INSTITUTION`,
  ]
    .filter((l) => l !== ``)
    .join("\n");

  const html = brandEmailShell({
    preheader: `${inviterFirstName} would like you in the reading. A connection does not see your readings; you will not see theirs.`,
    eyebrow: "INVITATION",
    title: {
      text: titleText,
      italicPhrase: "in the reading",
    },
    lede: "TwentyThird is a quiet room where the structure of someone's inner life is read with care. A connection does not see the inviter's readings or sessions, and you will not see theirs.",
    note: noteForShell,
    cta: { label: "Open the invite", href: acceptUrl },
    fallbackUrl: acceptUrl,
    figureFooter: {
      figNumber: "04",
      leftItalic: "invitation issued",
      rightLabel: "Expires",
      rightItalic: "fourteen days",
    },
    securityNote:
      "If this arrived in error, the invite expires on its own in fourteen days.",
  });

  return { subject, text, html };
}

export async function sendInviteEmail(input: InviteEmailInput) {
  const payload = buildInviteEmail(input);
  return sendEmail({ to: input.to, ...payload });
}

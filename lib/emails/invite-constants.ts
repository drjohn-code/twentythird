// Constants shared between the invite email template (server-only) and
// the InviteForm (client). Kept in a separate module so the client bundle
// does not pull in `server-only` via lib/emails/invite.ts.

export const NOTE_MAX_LENGTH = 140;

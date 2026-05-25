import { NextResponse } from "next/server";
import "server-only";
import { buildIntakeSubmittedEmail } from "@/lib/emails/intake-submitted";
import { buildRoomReadyEmail } from "@/lib/emails/room-ready";
import { buildInviteEmail } from "@/lib/emails/invite";
import { buildConnectionAcceptedEmail } from "@/lib/emails/connection-accepted";
import { buildConnectionEndedEmail } from "@/lib/emails/connection-ended";
import { buildWeeklyCatchupReminderEmail } from "@/lib/emails/weekly-catchup-reminder";
import { buildOnboardingResumeEmail } from "@/lib/emails/onboarding-resume";

// GET /api/dev/preview-email?kind=<kind>
//
// Dev-only HTML preview of every transactional/scheduled email
// template. Visit the URL in a browser to inspect the rendered shell
// in Apple Mail / Gmail-web colors. Each `kind` runs the template's
// `buildXxxEmail()` with stub args and returns the html body directly.
//
// Returns 404 outside `NODE_ENV === "development"` — matches the
// existing /api/dev/open-room gating pattern.
//
// The KIND_RENDERERS map is the single source of truth for "what
// previewable kinds exist." `invite` and `invite-with-note` are two
// variants of the same template so the optional-note rendering branch
// can be verified in one sitting.

type Renderer = () => { subject: string; text: string; html: string };

const ROOM_URL = "http://localhost:3000/room";
const CATCHUP_URL = "http://localhost:3000/catchup";
const ACCEPT_URL = "http://localhost:3000/invite/abc123def456";
const RESUME_URL = "http://localhost:3000/onboarding/intake/4";

const KIND_RENDERERS: Record<string, Renderer> = {
  "intake-submitted": () =>
    buildIntakeSubmittedEmail({
      to: "dev@example.com",
      firstName: "Anna",
    }),
  "room-ready": () =>
    buildRoomReadyEmail({
      to: "dev@example.com",
      firstName: "Anna",
      roomUrl: ROOM_URL,
    }),
  invite: () =>
    buildInviteEmail({
      to: "invitee@example.com",
      inviterFirstName: "Anna",
      note: null,
      acceptUrl: ACCEPT_URL,
    }),
  "invite-with-note": () =>
    buildInviteEmail({
      to: "invitee@example.com",
      inviterFirstName: "Anna",
      note: "Looking forward to your read of our dynamic.",
      acceptUrl: ACCEPT_URL,
    }),
  "connection-accepted": () =>
    buildConnectionAcceptedEmail({
      to: "dev@example.com",
      inviterFirstName: "Anna",
      connectionFirstName: "Marcus",
      roomUrl: ROOM_URL,
    }),
  "connection-ended": () =>
    buildConnectionEndedEmail({
      to: "dev@example.com",
      enderFirstName: "Marcus",
      roomUrl: ROOM_URL,
    }),
  "weekly-catchup-reminder": () =>
    buildWeeklyCatchupReminderEmail({
      to: "dev@example.com",
      firstName: "Anna",
      catchupUrl: CATCHUP_URL,
      isoWeek: "2026-W21",
    }),
  "onboarding-resume": () =>
    buildOnboardingResumeEmail({
      to: "dev@example.com",
      firstName: "Anna",
      resumeUrl: RESUME_URL,
    }),
};

export async function GET(req: Request): Promise<Response> {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "";
  const renderer = KIND_RENDERERS[kind];
  if (!renderer) {
    const available = Object.keys(KIND_RENDERERS).sort().join(", ");
    return new NextResponse(
      `Unknown kind. Try ?kind=<one of: ${available}>`,
      { status: 400, headers: { "content-type": "text/plain" } },
    );
  }
  const { html } = renderer();
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

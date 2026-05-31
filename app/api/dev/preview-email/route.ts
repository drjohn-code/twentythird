import { NextResponse } from "next/server";
import "server-only";
import { buildIntakeSubmittedEmail } from "@/lib/emails/intake-submitted";
import { buildRoomReadyEmail } from "@/lib/emails/room-ready";
import { buildInviteEmail } from "@/lib/emails/invite";
import { buildConnectionAcceptedEmail } from "@/lib/emails/connection-accepted";
import { buildConnectionEndedEmail } from "@/lib/emails/connection-ended";
import { buildWeeklyCatchupReminderEmail } from "@/lib/emails/weekly-catchup-reminder";
import { buildOnboardingResumeEmail } from "@/lib/emails/onboarding-resume";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";

// GET /api/dev/preview-email?kind=<kind>&locale=<code>
//
// Dev-only HTML preview of every transactional/scheduled email
// template. Visit the URL in a browser to inspect the rendered shell
// in Apple Mail / Gmail-web colors. Each `kind` runs the template's
// `buildXxxEmail()` with stub args and returns the html body directly.
//
// `&locale=<code>` renders the email in any supported locale (defaults
// to "en"); unknown codes fall back to "en". This is how each email
// renders in the recipient's language.
//
// Returns 404 outside `NODE_ENV === "development"` — matches the
// existing /api/dev/open-room gating pattern.
//
// The KIND_RENDERERS map is the single source of truth for "what
// previewable kinds exist." `invite` and `invite-with-note` are two
// variants of the same template so the optional-note rendering branch
// can be verified in one sitting.

type Renderer = (
  locale: string,
) => Promise<{ subject: string; text: string; html: string }>;

const ROOM_URL = "http://localhost:3000/room";
const CATCHUP_URL = "http://localhost:3000/catchup";
const ACCEPT_URL = "http://localhost:3000/invite/abc123def456";
const RESUME_URL = "http://localhost:3000/onboarding/intake/4";

const KIND_RENDERERS: Record<string, Renderer> = {
  "intake-submitted": (locale) =>
    buildIntakeSubmittedEmail({
      to: "dev@example.com",
      firstName: "Anna",
      locale,
    }),
  "room-ready": (locale) =>
    buildRoomReadyEmail({
      to: "dev@example.com",
      firstName: "Anna",
      roomUrl: ROOM_URL,
      locale,
    }),
  invite: (locale) =>
    buildInviteEmail({
      to: "invitee@example.com",
      inviterFirstName: "Anna",
      note: null,
      acceptUrl: ACCEPT_URL,
      locale,
    }),
  "invite-with-note": (locale) =>
    buildInviteEmail({
      to: "invitee@example.com",
      inviterFirstName: "Anna",
      note: "Looking forward to your read of our dynamic.",
      acceptUrl: ACCEPT_URL,
      locale,
    }),
  "connection-accepted": (locale) =>
    buildConnectionAcceptedEmail({
      to: "dev@example.com",
      inviterFirstName: "Anna",
      connectionFirstName: "Marcus",
      roomUrl: ROOM_URL,
      locale,
    }),
  "connection-ended": (locale) =>
    buildConnectionEndedEmail({
      to: "dev@example.com",
      enderFirstName: "Marcus",
      roomUrl: ROOM_URL,
      locale,
    }),
  "weekly-catchup-reminder": (locale) =>
    buildWeeklyCatchupReminderEmail({
      to: "dev@example.com",
      firstName: "Anna",
      catchupUrl: CATCHUP_URL,
      isoWeek: "2026-W21",
      locale,
    }),
  "onboarding-resume": (locale) =>
    buildOnboardingResumeEmail({
      to: "dev@example.com",
      firstName: "Anna",
      resumeUrl: RESUME_URL,
      locale,
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
  const requested = url.searchParams.get("locale");
  const locale = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  const { html } = await renderer(locale);
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

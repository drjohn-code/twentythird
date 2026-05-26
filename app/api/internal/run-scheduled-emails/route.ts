import { NextResponse } from "next/server";
import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { firstNameFrom } from "@/lib/connections";
import { sendRoomReadyEmail } from "@/lib/emails/room-ready";
import { sendWeeklyCatchupReminderEmail } from "@/lib/emails/weekly-catchup-reminder";
import { sendOnboardingResumeEmail } from "@/lib/emails/onboarding-resume";

// POST /api/internal/run-scheduled-emails
//
// Drains the scheduled_emails table — Vercel Cron hits this every
// minute. Authenticated by AI_INTERNAL_TOKEN (accepts both the
// `Authorization: Bearer ...` form that Vercel Cron sends and the
// `x-internal-token: ...` header used by /api/internal/initial-readings,
// so curl and the canonical internal pattern both work).
//
// Per tick the route:
//   1. Picks up to BATCH_SIZE pending rows (sent_at IS NULL AND
//      failed_at IS NULL AND send_after <= now()) ordered by send_after.
//   2. Dispatches each row by `kind`. Each handler returns one of:
//        'sent'   — write sent_at, attempts++ (terminal success)
//        'defer'  — leave row pending, attempts++ (retry next tick)
//        'fail'   — write failed_at + failure_reason, attempts++
//   3. The 6h retry window is enforced here, not in the handlers — a
//      handler that returns 'defer' beyond 6h after send_after gets
//      converted to a 'fail' with reason 'retry_window_expired'.
//
// Idempotency lives at the table layer: only successful sends write
// sent_at. A crash between Resend accepting the message and the row
// update will retry next tick. See scheduled_emails migration for the
// rationale.

const BATCH_SIZE = 50;
const RETRY_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

type Kind = "room_ready" | "weekly_catchup_reminder" | "onboarding_resume";

type ScheduledRow = {
  id: string;
  user_id: string;
  kind: Kind;
  payload: Record<string, unknown>;
  send_after: string;
  attempts: number;
};

type Outcome =
  | { action: "sent"; note?: string }
  | { action: "defer"; reason: string }
  | { action: "fail"; reason: string };

type Admin = NonNullable<ReturnType<typeof adminClient>>;

function tokenOk(req: Request): boolean {
  const required = process.env.AI_INTERNAL_TOKEN;
  if (!required) return false;
  const header = req.headers.get("x-internal-token");
  if (header && header === required) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${required}`) return true;
  return false;
}

// Exported as both GET and POST: Vercel Cron only invokes GET, but
// manual curl + symmetry with /api/internal/initial-readings keeps the
// POST form available.
export async function GET(req: Request): Promise<NextResponse> {
  return handle(req);
}

export async function POST(req: Request): Promise<NextResponse> {
  return handle(req);
}

async function handle(req: Request): Promise<NextResponse> {
  if (!tokenOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("scheduled_emails")
    .select("id, user_id, kind, payload, send_after, attempts")
    .is("sent_at", null)
    .is("failed_at", null)
    .lte("send_after", nowIso)
    .order("send_after", { ascending: true })
    .limit(BATCH_SIZE)
    .returns<ScheduledRow[]>();

  if (error) {
    console.error("[scheduled-emails] drain query failed:", error);
    return NextResponse.json(
      { error: "drain_failed", detail: error.message },
      { status: 500 },
    );
  }

  const tally = { processed: 0, sent: 0, deferred: 0, failed: 0 };

  for (const row of rows ?? []) {
    tally.processed += 1;
    let outcome: Outcome;
    try {
      outcome = await dispatch(admin, row);
    } catch (e) {
      console.error(
        `[scheduled-emails] dispatch threw for ${row.id} (${row.kind}):`,
        e,
      );
      outcome = { action: "fail", reason: "dispatch_threw" };
    }

    // Enforce the 6h cap on deferrals.
    if (outcome.action === "defer") {
      const ageMs = Date.now() - new Date(row.send_after).getTime();
      if (ageMs > RETRY_WINDOW_MS) {
        outcome = { action: "fail", reason: "retry_window_expired" };
      }
    }

    const update: Record<string, unknown> = { attempts: row.attempts + 1 };
    if (outcome.action === "sent") {
      update.sent_at = new Date().toISOString();
      if (outcome.note) update.failure_reason = outcome.note; // benign note
      tally.sent += 1;
    } else if (outcome.action === "fail") {
      update.failed_at = new Date().toISOString();
      update.failure_reason = outcome.reason;
      tally.failed += 1;
      console.error(
        `[scheduled-emails] ${row.kind} ${row.id} → failed: ${outcome.reason}`,
      );
    } else {
      // defer — keep pending, log the reason at info level
      tally.deferred += 1;
      console.log(
        `[scheduled-emails] ${row.kind} ${row.id} → deferred: ${outcome.reason}`,
      );
    }

    const { error: updErr } = await admin
      .from("scheduled_emails")
      .update(update)
      .eq("id", row.id);
    if (updErr) {
      console.error(
        `[scheduled-emails] row update failed for ${row.id}:`,
        updErr,
      );
    }
  }

  return NextResponse.json({ ok: true, ...tally });
}

// ────────────────────────────────────────────────────────────────────
// dispatch
// ────────────────────────────────────────────────────────────────────

async function dispatch(admin: Admin, row: ScheduledRow): Promise<Outcome> {
  switch (row.kind) {
    case "room_ready":
      return dispatchRoomReady(admin, row);
    case "weekly_catchup_reminder":
      return dispatchWeeklyCatchup(admin, row);
    case "onboarding_resume":
      return dispatchOnboardingResume(admin, row);
    default:
      return { action: "fail", reason: `unknown_kind:${row.kind as string}` };
  }
}

// Resolve the user's email via auth.admin.getUserById — the only
// always-correct source. profiles.email can lag or be null (e.g. a
// row created late by initiateAccount with a missing email field).
// Returns the email string on success, or null if auth lookup failed
// or returned no email. Callers should treat null as fail
// `auth_user_missing`.
async function resolveUserEmail(
  admin: Admin,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return null;
    const email = data.user?.email;
    if (typeof email !== "string" || !email) return null;
    return email;
  } catch {
    return null;
  }
}

async function dispatchRoomReady(
  admin: Admin,
  row: ScheduledRow,
): Promise<Outcome> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("full_name, intake_status")
    .eq("id", row.user_id)
    .maybeSingle<{
      full_name: string | null;
      intake_status: string | null;
    }>();
  if (error) return { action: "defer", reason: "profile_lookup_failed" };
  if (!profile) return { action: "fail", reason: "profile_not_found" };

  // The room-ready email is only meaningful once readings exist.
  // If intake is still processing, defer to the next tick.
  if (profile.intake_status === "processing") {
    return { action: "defer", reason: "intake_still_processing" };
  }
  if (profile.intake_status !== "ready") {
    return {
      action: "fail",
      reason: `intake_status_${profile.intake_status ?? "null"}`,
    };
  }

  const email = await resolveUserEmail(admin, row.user_id);
  if (!email) return { action: "fail", reason: "auth_user_missing" };

  const res = await sendRoomReadyEmail({
    to: email,
    firstName: firstNameFrom(profile.full_name),
    roomUrl: `${siteOrigin()}/room`,
  });
  if (!res.ok) {
    return { action: "defer", reason: `resend_${res.error}` };
  }
  return { action: "sent" };
}

async function dispatchWeeklyCatchup(
  admin: Admin,
  row: ScheduledRow,
): Promise<Outcome> {
  const isoWeek =
    typeof row.payload?.iso_week === "string" ? row.payload.iso_week : null;
  if (!isoWeek) return { action: "fail", reason: "payload_missing_iso_week" };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", row.user_id)
    .maybeSingle<{ full_name: string | null }>();

  // Preference gate — `weekly_catchup` toggle on users_meta.email_preferences.
  const { data: meta } = await admin
    .from("users_meta")
    .select("email_preferences")
    .eq("user_id", row.user_id)
    .maybeSingle<{ email_preferences: Record<string, unknown> | null }>();
  const enabled = readBoolPref(meta?.email_preferences, "weekly_catchup");
  if (!enabled) {
    return { action: "sent", note: "skipped_preference_off" };
  }

  // Don't send if the user has already submitted a catchup for this
  // ISO week. catchups stores `week_number` (int) with no ISO-year
  // column, so the lookback window guards against a same-week-number
  // collision across years.
  const weekMatch = isoWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!weekMatch) return { action: "fail", reason: "invalid_iso_week" };
  const weekNumber = parseInt(weekMatch[2]!, 10);
  const lookbackIso = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count } = await admin
    .from("catchups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", row.user_id)
    .eq("week_number", weekNumber)
    .gte("created_at", lookbackIso);
  if ((count ?? 0) > 0) {
    return { action: "sent", note: "skipped_catchup_already_done" };
  }

  const email = await resolveUserEmail(admin, row.user_id);
  if (!email) return { action: "fail", reason: "auth_user_missing" };

  const res = await sendWeeklyCatchupReminderEmail({
    to: email,
    firstName: firstNameFrom(profile?.full_name ?? null),
    catchupUrl: `${siteOrigin()}/catchup`,
    isoWeek,
  });
  if (!res.ok) {
    return { action: "defer", reason: `resend_${res.error}` };
  }
  return { action: "sent" };
}

async function dispatchOnboardingResume(
  admin: Admin,
  row: ScheduledRow,
): Promise<Outcome> {
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, intake_status, onboarding_step")
    .eq("id", row.user_id)
    .maybeSingle<{
      full_name: string | null;
      intake_status: string | null;
      onboarding_step: number | null;
    }>();

  // If they completed intake between scheduling and now, seal the row
  // as a no-op send rather than emailing.
  // TODO: discuss whether onboarding-resume needs its own preference
  // column on users_meta.email_preferences (currently always sends).
  if (
    profile?.intake_status === "processing" ||
    profile?.intake_status === "ready"
  ) {
    return { action: "sent", note: "skipped_completed" };
  }

  const email = await resolveUserEmail(admin, row.user_id);
  if (!email) return { action: "fail", reason: "auth_user_missing" };

  const res = await sendOnboardingResumeEmail({
    to: email,
    firstName: firstNameFrom(profile?.full_name ?? null),
    resumeUrl: `${siteOrigin()}/onboarding/intake/${profile?.onboarding_step ?? 1}`,
  });
  if (!res.ok) {
    return { action: "defer", reason: `resend_${res.error}` };
  }
  return { action: "sent" };
}

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

function readBoolPref(
  prefs: Record<string, unknown> | null | undefined,
  key: string,
): boolean {
  if (!prefs) return true; // default-on if the user has never written prefs
  const v = prefs[key];
  return typeof v === "boolean" ? v : true;
}


function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://day-23.com"
  );
}

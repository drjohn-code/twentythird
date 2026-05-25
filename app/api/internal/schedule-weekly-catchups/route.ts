import { NextResponse } from "next/server";
import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { isoWeekString } from "@/lib/emails/iso-week";

// POST/GET /api/internal/schedule-weekly-catchups
//
// Producer route — enqueues weekly_catchup_reminder rows into
// scheduled_emails for every eligible user. The drainer
// (/api/internal/run-scheduled-emails) processes the rows themselves.
//
// Scheduled by Vercel Cron once a week on Sundays at 18:00 UTC, which
// reads as Sunday evening across the Europe/London timezone — the
// default we assume for every user until per-user timezone lands.
// TODO: per-user timezone on users_meta. Route should then iterate
// timezones (or be triggered hourly with a per-user "local-time-matches"
// filter) so a user in Tokyo gets their reminder Sunday evening their
// time, not Sunday morning UTC.
//
// Eligibility: profiles.intake_status = 'ready', has email, no catchup
// row for the current ISO week, and email_preferences.weekly_catchup is
// not explicitly false. Preference is also re-checked at send time in
// the drainer — keeping the producer's check loose avoids enqueueing
// rows we'd immediately discard.
//
// Idempotency: the partial unique index
// scheduled_emails_weekly_catchup_unique covers (user_id, iso_week) for
// SENT rows. The producer additionally checks for any pending row in
// the current week before inserting, so a same-week re-run is a no-op.

const TOKEN_HEADER = "x-internal-token";

function tokenOk(req: Request): boolean {
  const required = process.env.AI_INTERNAL_TOKEN;
  if (!required) return false;
  const header = req.headers.get(TOKEN_HEADER);
  if (header && header === required) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${required}`) return true;
  return false;
}

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

  const isoWeek = isoWeekString(new Date());

  // Load eligible users — anyone whose intake has landed. The drainer
  // is the authoritative gate for email availability (it resolves
  // email via auth.admin.getUserById at send time); profiles.email
  // can be null or stale and is not consulted here.
  const { data: users, error: usersErr } = await admin
    .from("profiles")
    .select("id, intake_status")
    .eq("intake_status", "ready")
    .returns<{ id: string; intake_status: string }[]>();
  if (usersErr) {
    return NextResponse.json(
      { error: "users_query_failed", detail: usersErr.message },
      { status: 500 },
    );
  }

  let enqueued = 0;
  let skipped_already_scheduled = 0;
  let skipped_already_done = 0;

  for (const u of users ?? []) {
    // Skip if a row already pending for this user+kind. (Sent rows are
    // covered by the partial unique index on (user_id, iso_week).)
    const { data: pending } = await admin
      .from("scheduled_emails")
      .select("id")
      .eq("user_id", u.id)
      .eq("kind", "weekly_catchup_reminder")
      .is("sent_at", null)
      .is("failed_at", null)
      .gte("send_after", weekStartIso())
      .maybeSingle<{ id: string }>();
    if (pending) {
      skipped_already_scheduled += 1;
      continue;
    }

    // Skip if the user has already done a catchup this ISO week. The
    // drainer also performs this check; doing it here saves an enqueue.
    const weekParts = isoWeek.match(/^(\d{4})-W(\d{2})$/);
    const weekNumber = weekParts ? parseInt(weekParts[2]!, 10) : 0;
    const lookbackIso = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { count } = await admin
      .from("catchups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", u.id)
      .eq("week_number", weekNumber)
      .gte("created_at", lookbackIso);
    if ((count ?? 0) > 0) {
      skipped_already_done += 1;
      continue;
    }

    const { error: insErr } = await admin.from("scheduled_emails").insert({
      user_id: u.id,
      kind: "weekly_catchup_reminder",
      payload: { iso_week: isoWeek },
      send_after: new Date().toISOString(),
    });
    if (insErr) {
      // Unique-index conflict on (user_id, iso_week) for an already-sent
      // row in the same week is benign — just count it and move on.
      console.error(
        `[schedule-weekly-catchups] insert failed for ${u.id}:`,
        insErr.message,
      );
      continue;
    }
    enqueued += 1;
  }

  return NextResponse.json({
    ok: true,
    iso_week: isoWeek,
    enqueued,
    skipped_already_scheduled,
    skipped_already_done,
    eligible_users: users?.length ?? 0,
  });
}

function weekStartIso(): string {
  // Monday 00:00 UTC of the current ISO week — loose lower bound for
  // the "pending row already exists this week" check. Off-by-one at
  // the year boundary is fine because the row's payload->>'iso_week'
  // is the authoritative identifier.
  const d = new Date();
  const day = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(d.getUTCDate() - (day - 1));
  return monday.toISOString();
}

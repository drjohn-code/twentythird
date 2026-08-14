import { NextResponse } from "next/server";
import "server-only";
import { adminClient } from "@/lib/supabase/admin";

// GET /api/internal/intake-status?user_id=<uuid>   (or ?email=<email>)
//
// Read-only status probe for a single intake. Guarded by the same
// AI_INTERNAL_TOKEN convention as every other /api/internal/* route
// (header x-internal-token, or Authorization: Bearer <token>) — no new
// secret introduced.
//
// Exists because nothing could answer "did this intake reach ready,
// and if not, where did it stop and when" without a live browser
// session or direct SQL (task 57VyV23jSwHwEFz03Jt3). Reports both
// state machines that gate the Room — profiles.intake_status and
// users_meta.initial_readings_status, set by
// app/api/internal/initial-readings/route.ts and
// app/onboarding/intake/[step]/actions.ts — plus the room_ready
// scheduled-email row, so a stuck or failed pipeline is visible
// without guessing which of the two statuses is authoritative.

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

type ProfileRow = {
  id: string;
  email: string | null;
  intake_status: string | null;
  intake_submitted_at: string | null;
  onboarding_step: number | null;
  account_initiated_at: string | null;
};

type UsersMetaRow = {
  initial_readings_status: string | null;
};

type ScheduledEmailRow = {
  send_after: string;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  attempts: number;
};

export async function GET(req: Request): Promise<NextResponse> {
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

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  const email = searchParams.get("email");
  if (!userId && !email) {
    return NextResponse.json(
      { error: "user_id or email query param required" },
      { status: 400 },
    );
  }

  const profileSelect =
    "id, email, intake_status, intake_submitted_at, onboarding_step, account_initiated_at";
  const { data: profile, error: profileErr } = userId
    ? await admin
        .from("profiles")
        .select(profileSelect)
        .eq("id", userId)
        .maybeSingle<ProfileRow>()
    : await admin
        .from("profiles")
        .select(profileSelect)
        .eq("email", email as string)
        .maybeSingle<ProfileRow>();
  if (profileErr) {
    return NextResponse.json(
      { error: "profile_query_failed", detail: profileErr.message },
      { status: 500 },
    );
  }
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: meta, error: metaErr } = await admin
    .from("users_meta")
    .select("initial_readings_status")
    .eq("user_id", profile.id)
    .maybeSingle<UsersMetaRow>();
  if (metaErr) {
    return NextResponse.json(
      { error: "users_meta_query_failed", detail: metaErr.message },
      { status: 500 },
    );
  }

  const { data: roomReadyEmail, error: emailErr } = await admin
    .from("scheduled_emails")
    .select("send_after, sent_at, failed_at, failure_reason, attempts")
    .eq("user_id", profile.id)
    .eq("kind", "room_ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ScheduledEmailRow>();
  if (emailErr) {
    return NextResponse.json(
      { error: "scheduled_emails_query_failed", detail: emailErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    user_id: profile.id,
    email: profile.email,
    intake_status: profile.intake_status,
    intake_submitted_at: profile.intake_submitted_at,
    onboarding_step: profile.onboarding_step,
    account_initiated_at: profile.account_initiated_at,
    initial_readings_status: meta?.initial_readings_status ?? null,
    room_ready_email: roomReadyEmail ?? null,
  });
}

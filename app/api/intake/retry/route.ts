import { NextResponse } from "next/server";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// POST /api/intake/retry
//
// User-session authenticated (NOT service-role). The caller can only
// retry their own intake, and only when profiles.intake_status='failed'
// — the precondition that the Room gate's failed-state branch is the
// sole entry point. We don't expose this for 'processing' (it'd let
// users spam the AI pipeline while it's still working) or for 'ready'
// (already done).
//
// Side effects, in order:
//   1. profiles.intake_status → 'processing'
//   2. users_meta.initial_readings_status → 'pending'
//   3. INSERT scheduled_emails {kind:'room_ready', send_after=now+5m}
//      — the original row may have expired beyond its 6h retry cap; a
//      fresh row ensures the user gets the email once readings land.
//   4. Fire-and-forget POST /api/internal/initial-readings with the
//      service-role token to re-run the AI pipeline.

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("intake_status, intake_submitted_at")
    .eq("id", user.id)
    .maybeSingle<{
      intake_status: string | null;
      intake_submitted_at: string | null;
    }>();

  if (!profile) {
    return NextResponse.json({ error: "no_profile" }, { status: 400 });
  }
  if (!profile.intake_submitted_at) {
    return NextResponse.json({ error: "intake_not_submitted" }, { status: 400 });
  }
  if (profile.intake_status !== "failed") {
    return NextResponse.json(
      { error: "not_retryable", status: profile.intake_status },
      { status: 400 },
    );
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  await admin
    .from("profiles")
    .update({ intake_status: "processing" })
    .eq("id", user.id);

  await admin
    .from("users_meta")
    .update({ initial_readings_status: "pending" })
    .eq("user_id", user.id);

  const sendAfter = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { error: schedErr } = await admin.from("scheduled_emails").insert({
    user_id: user.id,
    kind: "room_ready",
    payload: {},
    send_after: sendAfter,
  });
  if (schedErr) {
    console.error("[intake-retry] room_ready scheduling failed:", schedErr);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const internalToken = process.env.AI_INTERNAL_TOKEN;
  if (internalToken) {
    try {
      const res = await fetch(`${siteUrl}/api/internal/initial-readings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": internalToken,
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) {
        console.error(
          `[intake-retry] initial-readings trigger rejected: ${res.status}`,
        );
        await markTriggerFailed(admin, user.id);
      }
    } catch (e) {
      console.error("[intake-retry] initial-readings trigger threw:", e);
      await markTriggerFailed(admin, user.id);
    }
  } else {
    console.error(
      "[intake-retry] AI_INTERNAL_TOKEN missing — initial readings never triggered",
    );
    await markTriggerFailed(admin, user.id);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}

// A rejected or thrown trigger means the background job never started,
// so the row would otherwise sit in 'processing'/'pending' forever with
// nothing to move it — the original silent-hang shape.
async function markTriggerFailed(
  admin: NonNullable<ReturnType<typeof adminClient>>,
  userId: string,
): Promise<void> {
  await admin
    .from("users_meta")
    .update({ initial_readings_status: "failed" })
    .eq("user_id", userId);
  await admin
    .from("profiles")
    .update({ intake_status: "failed" })
    .eq("id", userId);
}

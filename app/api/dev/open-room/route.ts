import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendRoomReadyEmail } from "@/lib/emails/room-ready";

// POST /api/dev/open-room
//
// Dev-only manual trigger that flips the caller's profiles.intake_status
// from 'processing' to 'ready' and fires the room-ready email via Resend.
// Used while building/testing the post-intake flow without waiting for
// the eventual 2-hour scheduled job.
//
// Behaviour is idempotent: only the first call (the one that actually
// transitions the row from 'processing' → 'ready') sends the email.
// Repeat calls return { ok: true, alreadyReady: true, emailed: false }
// so the curl is safe to spam during testing.
//
// TODO: replace with 2-hour scheduled job (pg_cron or queue worker).
//   The cron's `where` clause must mirror the one below
//   (intake_status = 'processing') so the two paths can't race and
//   double-fire the email.

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  // Idempotent transition: only the row currently in 'processing' is
  // updated. The returned rows tell us whether the transition actually
  // happened on this call.
  const { data: updatedRows, error: updateErr } = await admin
    .from("profiles")
    .update({ intake_status: "ready" })
    .eq("id", user.id)
    .eq("intake_status", "processing")
    .select("id, full_name");

  if (updateErr) {
    return NextResponse.json(
      { error: "update_failed", detail: updateErr.message },
      { status: 500 },
    );
  }

  const transitioned = (updatedRows?.length ?? 0) === 1;

  if (!transitioned) {
    return NextResponse.json({
      ok: true,
      alreadyReady: true,
      emailed: false,
    });
  }

  // Pair the email with the actual transition so concurrent callers
  // (or repeat curl during testing) can't double-send.
  const fullName =
    (updatedRows?.[0]?.full_name as string | null | undefined) ?? null;
  const firstName = firstNameFrom(fullName);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const emailed = await sendRoomReadyEmail({
    to: user.email!,
    firstName,
    roomUrl: `${siteUrl}/room`,
  });

  revalidatePath("/room");

  return NextResponse.json({
    ok: true,
    alreadyReady: false,
    emailed,
  });
}

function firstNameFrom(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

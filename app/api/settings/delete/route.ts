import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

// DELETE /api/settings/delete
//
// Hard delete of the calling user. Requires a typed confirmation
// (`confirm` field equal to the phrase) to prevent reflexive clicks.
// Cascades through auth.users.on_delete to every table in the room
// schema (every fk is `references auth.users(id) on delete cascade`).
//
// Connection-end notifications are stubbed — Phase 6 wires Resend.

const REQUIRED_PHRASE = "delete the case file";

type Body = { confirm?: string };

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if ((body.confirm ?? "").trim().toLowerCase() !== REQUIRED_PHRASE) {
    return NextResponse.json(
      { error: "confirmation_required" },
      { status: 400 },
    );
  }

  // Mark any active connections as ended-by-this-user before deletion
  // so the other party's depth recompute and notification (Phase 6)
  // can read accurate metadata after the cascade.
  await supabase
    .from("connections")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
      ended_by: user.id,
    })
    .or(
      `inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`,
    )
    .eq("status", "active");

  // TODO: Phase 6 — Resend the connection-ended email to each other party.

  // The actual auth.users delete requires service role. If the env is
  // missing, fail closed — partial deletes are worse than a refused one.
  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "admin_unavailable" },
      { status: 503 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // Sign the local session out — the cookie is now orphaned.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { firstNameOrEmailLocal } from "@/lib/connections";
import { sendConnectionEndedEmail } from "@/lib/emails/connection-ended";
import { localeForUser } from "@/lib/emails/locale";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// DELETE /api/settings/delete
//
// Hard delete of the calling user. Requires a typed confirmation
// (`confirm` field equal to the phrase) to prevent reflexive clicks.
// Cascades through auth.users.on_delete to every table in the room
// schema (every fk is `references auth.users(id) on delete cascade`).
//
// Before the cascade we notify every other party that an active
// connection is ending. These emails are always sent — connection-end
// is transactional, not preference-gated.

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

  // The actual auth.users delete requires service role. If the env is
  // missing, fail closed — partial deletes are worse than a refused one.
  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "admin_unavailable" },
      { status: 503 },
    );
  }

  // Resolve the ender's first name + each other party's email BEFORE
  // mutating connections / deleting the user. Profile rows survive the
  // status flip but vanish on auth.users cascade.
  const { data: enderProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; email: string | null }>();
  const enderFirstName =
    firstNameOrEmailLocal(
      enderProfile?.full_name,
      enderProfile?.email ?? "",
    ) || "your connection";

  const { data: activeConnections } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, connection_user_id, connection_email",
    )
    .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`)
    .eq("status", "active")
    .returns<
      {
        id: string;
        inviter_user_id: string;
        connection_user_id: string | null;
        connection_email: string;
      }[]
    >();

  // Mark active connections ended-by-this-user before cascade so the
  // other party's depth recompute reads accurate metadata.
  await admin
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

  // Notify each other party. Transactional — no preference gate.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://day-23.com";
  for (const c of activeConnections ?? []) {
    const otherIsInviter = c.inviter_user_id !== user.id;
    const otherUserId = otherIsInviter ? c.inviter_user_id : c.connection_user_id;
    let otherEmail: string | null = null;
    if (otherUserId) {
      const { data: other } = await admin
        .from("profiles")
        .select("email")
        .eq("id", otherUserId)
        .maybeSingle<{ email: string | null }>();
      otherEmail = other?.email ?? null;
    }
    if (!otherEmail && !otherIsInviter) {
      // Other party is the connection on a no-account invite; fall
      // back to the email captured on the connections row.
      otherEmail = c.connection_email;
    }
    if (!otherEmail) continue;
    try {
      await sendConnectionEndedEmail({
        to: otherEmail,
        enderFirstName,
        roomUrl: `${siteUrl}/room`,
        locale: otherUserId
          ? await localeForUser(admin, otherUserId)
          : DEFAULT_LOCALE,
      });
    } catch (e) {
      console.error("[delete-account] connection-ended send threw:", e);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // Sign the local session out — the cookie is now orphaned.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}


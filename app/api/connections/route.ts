import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { recomputeDepthFor } from "@/lib/depth";
import {
  MAX_ACTIVE_CONNECTIONS,
  firstNameFrom,
  firstNameOrEmailLocal,
  generateInviteToken,
  inviteExpiryFromNow,
  isConnectionRole,
  isLikelyEmail,
  type ConnectionRole,
} from "@/lib/connections";
import { sendInviteEmail } from "@/lib/emails/invite";
import { sendConnectionAcceptedEmail } from "@/lib/emails/connection-accepted";
import { sendConnectionEndedEmail } from "@/lib/emails/connection-ended";

// /api/connections — every write side of the Connections feature.
//
// Reads stay client-side via RLS (select policy on connections covers
// both inviter and connection_user_id). Writes pass through here:
//
//   POST ?action=invite           — authed, subscribed, < 2 active
//   POST ?action=accept           — public, by token (no account path)
//   POST ?action=accept-account   — public, by token (sends magic link)
//   POST ?action=decline          — public, by token
//   POST ?action=disconnect       — authed, must be one of the parties
//   POST ?action=resend           — authed, inviter only
//   POST ?action=cancel           — authed, inviter only
//
// The connections table has no INSERT/UPDATE policy by design — every
// mutation runs through the service-role admin client. The public
// (token) actions verify the invite_token before any write.

type AdminClient = NonNullable<ReturnType<typeof adminClient>>;

type ConnectionRow = {
  id: string;
  inviter_user_id: string;
  connection_user_id: string | null;
  connection_email: string;
  connection_first_name: string | null;
  role: ConnectionRole;
  note: string | null;
  invite_token: string;
  status: "pending" | "active" | "declined" | "expired" | "ended";
  accepted_at: string | null;
  ended_at: string | null;
  ended_by: string | null;
  expires_at: string;
  created_at: string;
};

const ALLOWED_ACTIONS = new Set([
  "invite",
  "accept",
  "accept-account",
  "decline",
  "disconnect",
  "resend",
  "cancel",
]);

export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "";
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  switch (action) {
    case "invite":
      return handleInvite(req, body);
    case "accept":
      return handleAccept(body, /* withAccount */ false);
    case "accept-account":
      return handleAccept(body, /* withAccount */ true);
    case "decline":
      return handleDecline(body);
    case "disconnect":
      return handleDisconnect(body);
    case "resend":
      return handleResend(body);
    case "cancel":
      return handleCancel(body);
    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }
}

// ────────────────────────────────────────────────────────────────────
// invite
// ────────────────────────────────────────────────────────────────────

async function handleInvite(req: Request, body: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Subscription gate. Read via RLS — the user can read their own row.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle<{ status: string | null }>();
  if (!sub || sub.status !== "active") {
    return NextResponse.json(
      { error: "subscription_required" },
      { status: 402 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role;
  const noteRaw =
    typeof body.note === "string" ? body.note.trim().slice(0, 240) : "";

  if (!isLikelyEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!isConnectionRole(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (email === (user.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "self_invite" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Active-count guard. Counts ACTIVE rows where caller is inviter OR
  // is the connection — caps total active relationships for this user.
  const { count: activeCount } = await admin
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`);

  if ((activeCount ?? 0) >= MAX_ACTIVE_CONNECTIONS) {
    return NextResponse.json({ error: "limit_reached" }, { status: 409 });
  }

  // Pending guard — at most one pending invite per (inviter, email).
  const { data: existingPending } = await admin
    .from("connections")
    .select("id")
    .eq("inviter_user_id", user.id)
    .eq("connection_email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    return NextResponse.json(
      { error: "pending_invite_exists" },
      { status: 409 },
    );
  }

  // Resolve inviter first name for the email subject.
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; email: string | null }>();
  const inviterName = firstNameOrEmailLocal(
    profile?.full_name ?? null,
    profile?.email ?? user.email ?? "",
  );

  const token = generateInviteToken();
  const expiresAt = inviteExpiryFromNow().toISOString();

  const { data: inserted, error: insertError } = await admin
    .from("connections")
    .insert({
      inviter_user_id: user.id,
      connection_email: email,
      role,
      note: noteRaw || null,
      invite_token: token,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const acceptUrl = `${resolveSiteOrigin(req)}/invite/${token}`;
  await sendInviteEmail({
    to: email,
    inviterFirstName: inviterName,
    note: noteRaw || null,
    acceptUrl,
  });

  return NextResponse.json({ ok: true, id: inserted.id, expiresAt });
}

// ────────────────────────────────────────────────────────────────────
// accept (no-account) and accept-account (magic-link path stubbed)
// ────────────────────────────────────────────────────────────────────

async function handleAccept(
  body: Record<string, unknown>,
  withAccount: boolean,
) {
  const token = typeof body.token === "string" ? body.token : "";
  const firstName =
    typeof body.first_name === "string"
      ? body.first_name.trim().slice(0, 60)
      : "";
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }
  if (!firstName) {
    return NextResponse.json({ error: "missing_first_name" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const conn = await loadConnectionByToken(admin, token);
  if (!conn) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 });
  }
  if (conn.status === "active") {
    // Idempotent — already accepted is treated as success.
    return NextResponse.json({ ok: true, connection_id: conn.id });
  }
  if (conn.status !== "pending") {
    return NextResponse.json(
      { error: `invite_${conn.status}` },
      { status: 410 },
    );
  }
  if (new Date(conn.expires_at).getTime() < Date.now()) {
    await admin
      .from("connections")
      .update({ status: "expired" })
      .eq("id", conn.id);
    return NextResponse.json({ error: "invite_expired" }, { status: 410 });
  }

  // TODO: wire magic-link OTP for the account-creation acceptance flow.
  //       For Phase 6 both paths converge on the lightweight flow — the
  //       relationship intake writes through the service-role guest
  //       endpoint, and full-account creation lands later.
  const acceptanceMode = withAccount ? "with_account_pending" : "no_account";

  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("connections")
    .update({
      status: "active",
      accepted_at: now,
      connection_first_name: firstName,
    })
    .eq("id", conn.id);
  if (updErr) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // Recompute the inviter's depth — accepted connection contributes.
  await recomputeDepthFor(conn.inviter_user_id, admin);

  // Notify the inviter (best-effort).
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", conn.inviter_user_id)
    .maybeSingle<{ email: string | null; full_name: string | null }>();
  if (inviterProfile?.email) {
    await sendConnectionAcceptedEmail({
      to: inviterProfile.email,
      inviterFirstName: firstNameFrom(inviterProfile.full_name),
      connectionFirstName: firstName,
      roomUrl: `${siteOriginFromEnv()}/room`,
    });
  }

  return NextResponse.json({
    ok: true,
    connection_id: conn.id,
    mode: acceptanceMode,
  });
}

// ────────────────────────────────────────────────────────────────────
// decline
// ────────────────────────────────────────────────────────────────────

async function handleDecline(body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const conn = await loadConnectionByToken(admin, token);
  if (!conn) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 });
  }
  if (conn.status === "declined") {
    return NextResponse.json({ ok: true });
  }
  if (conn.status !== "pending") {
    return NextResponse.json(
      { error: `invite_${conn.status}` },
      { status: 410 },
    );
  }

  const { error } = await admin
    .from("connections")
    .update({ status: "declined" })
    .eq("id", conn.id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// ────────────────────────────────────────────────────────────────────
// disconnect — either party may end an ACTIVE connection.
// ────────────────────────────────────────────────────────────────────

async function handleDisconnect(body: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connectionId =
    typeof body.connection_id === "string" ? body.connection_id : "";
  const typedConfirm =
    typeof body.confirm_name === "string" ? body.confirm_name.trim() : "";

  if (!connectionId) {
    return NextResponse.json(
      { error: "missing_connection_id" },
      { status: 400 },
    );
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, status",
    )
    .eq("id", connectionId)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      connection_user_id: string | null;
      connection_email: string;
      connection_first_name: string | null;
      status: string;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    user.id !== conn.inviter_user_id &&
    user.id !== conn.connection_user_id
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (conn.status !== "active") {
    return NextResponse.json({ error: "not_active" }, { status: 409 });
  }

  // Typed-name confirmation. Compare case-insensitively against the
  // captured first name; fall back to the email's local part if no
  // first name was provided.
  const expected = (
    conn.connection_first_name ??
    conn.connection_email.split("@")[0] ??
    ""
  )
    .trim()
    .toLowerCase();
  if (!expected || typedConfirm.toLowerCase() !== expected) {
    return NextResponse.json(
      { error: "confirmation_mismatch" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("connections")
    .update({
      status: "ended",
      ended_at: now,
      ended_by: user.id,
    })
    .eq("id", conn.id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // Recompute depth for both parties; the active connection no longer
  // contributes once status flips out of 'active'.
  await recomputeDepthFor(conn.inviter_user_id, admin);
  if (conn.connection_user_id) {
    await recomputeDepthFor(conn.connection_user_id, admin);
  }

  // Notify the other party (best-effort).
  const enderFirstName = await loadFirstName(admin, user.id);
  let otherEmail: string | null = null;
  if (user.id === conn.inviter_user_id) {
    // Inviter is disconnecting → notify the connection.
    if (conn.connection_user_id) {
      const { data: row } = await admin
        .from("profiles")
        .select("email")
        .eq("id", conn.connection_user_id)
        .maybeSingle<{ email: string | null }>();
      otherEmail = row?.email ?? conn.connection_email;
    } else {
      otherEmail = conn.connection_email;
    }
  } else {
    // Connection is disconnecting → notify the inviter.
    const { data: row } = await admin
      .from("profiles")
      .select("email")
      .eq("id", conn.inviter_user_id)
      .maybeSingle<{ email: string | null }>();
    otherEmail = row?.email ?? null;
  }

  if (otherEmail && enderFirstName) {
    await sendConnectionEndedEmail({
      to: otherEmail,
      enderFirstName,
      roomUrl: `${siteOriginFromEnv()}/room`,
    });
  }

  return NextResponse.json({ ok: true });
}

// ────────────────────────────────────────────────────────────────────
// resend — inviter regenerates token and re-sends pending invite.
// ────────────────────────────────────────────────────────────────────

async function handleResend(body: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const connectionId =
    typeof body.connection_id === "string" ? body.connection_id : "";
  if (!connectionId) {
    return NextResponse.json(
      { error: "missing_connection_id" },
      { status: 400 },
    );
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, connection_email, role, note, status",
    )
    .eq("id", connectionId)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      connection_email: string;
      role: ConnectionRole;
      note: string | null;
      status: string;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conn.inviter_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (conn.status !== "pending" && conn.status !== "expired") {
    return NextResponse.json({ error: "wrong_status" }, { status: 409 });
  }

  const newToken = generateInviteToken();
  const newExpiry = inviteExpiryFromNow().toISOString();
  const { error: updErr } = await admin
    .from("connections")
    .update({
      invite_token: newToken,
      expires_at: newExpiry,
      status: "pending",
    })
    .eq("id", conn.id);
  if (updErr) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  const inviterName = (await loadFirstName(admin, user.id)) ?? "your friend";
  const acceptUrl = `${siteOriginFromEnv()}/invite/${newToken}`;
  await sendInviteEmail({
    to: conn.connection_email,
    inviterFirstName: inviterName,
    note: conn.note,
    acceptUrl,
  });

  return NextResponse.json({ ok: true, expiresAt: newExpiry });
}

// ────────────────────────────────────────────────────────────────────
// cancel — inviter cancels a pending invite. Status → expired.
// ────────────────────────────────────────────────────────────────────

async function handleCancel(body: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const connectionId =
    typeof body.connection_id === "string" ? body.connection_id : "";
  if (!connectionId) {
    return NextResponse.json(
      { error: "missing_connection_id" },
      { status: 400 },
    );
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select("id, inviter_user_id, status")
    .eq("id", connectionId)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      status: string;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conn.inviter_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (conn.status !== "pending") {
    return NextResponse.json({ error: "not_pending" }, { status: 409 });
  }

  const { error } = await admin
    .from("connections")
    .update({ status: "expired" })
    .eq("id", conn.id);
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

async function loadConnectionByToken(
  admin: AdminClient,
  token: string,
): Promise<ConnectionRow | null> {
  const { data } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, role, note, invite_token, status, accepted_at, ended_at, ended_by, expires_at, created_at",
    )
    .eq("invite_token", token)
    .maybeSingle<ConnectionRow>();
  return data ?? null;
}

async function loadFirstName(
  admin: AdminClient,
  userId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; email: string | null }>();
  return firstNameFrom(data?.full_name) ?? firstNameFrom(data?.email);
}

// Resolve the absolute origin to use in user-facing URLs.
// Prefers the request's Origin/host (right during the call); falls back
// to NEXT_PUBLIC_SITE_URL, then to day-23.com.
function resolveSiteOrigin(req: Request): string {
  const headerOrigin = req.headers.get("origin");
  if (headerOrigin) return headerOrigin;
  const host = req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return siteOriginFromEnv();
}

function siteOriginFromEnv(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://day-23.com"
  );
}

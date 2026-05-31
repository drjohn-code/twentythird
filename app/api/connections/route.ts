import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { recomputeDepthFor } from "@/lib/depth";
import {
  effectiveConnectionsLimit,
  firstNameFrom,
  generateInviteToken,
  inviteExpiryFromNow,
  isConnectionRole,
  isLikelyEmail,
  type ConnectionRole,
} from "@/lib/connections";
import { sendInviteEmail, NOTE_MAX_LENGTH } from "@/lib/emails/invite";
import { sendConnectionEndedEmail } from "@/lib/emails/connection-ended";
import { sendConnectionAcceptedEmail } from "@/lib/emails/connection-accepted";
import { emailPreferenceEnabled } from "@/lib/emails/preferences";
import { localeForUser } from "@/lib/emails/locale";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// /api/connections — every write side of the Connections feature.
//
// Reads stay client-side via RLS (select policy on connections covers
// both inviter and connection_user_id). Writes pass through here:
//
//   POST ?action=invite           — authed, < 2 active
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
  "accept-incoming",
  "decline",
  "decline-incoming",
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
    case "accept-incoming":
      return handleAcceptIncoming(body);
    case "decline":
      return handleDecline(body);
    case "decline-incoming":
      return handleDeclineIncoming(body);
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

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role;
  const noteRawInput = typeof body.note === "string" ? body.note : "";

  if (!isLikelyEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!isConnectionRole(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (email === (user.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "self_invite" }, { status: 400 });
  }

  // Note validation — server is the enforcement point. The template
  // trusts its input. The form caps via maxLength but a hand-crafted
  // POST can still arrive with a longer string.
  const noteTrimmed = noteRawInput.trim();
  if (noteTrimmed.length > NOTE_MAX_LENGTH) {
    return NextResponse.json(
      { error: "invalid_note_length" },
      { status: 422 },
    );
  }
  const note: string | null = noteTrimmed.length > 0 ? noteTrimmed : null;

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Active-count guard. Counts ACTIVE rows where caller is inviter OR
  // is the connection — caps total active relationships for this user.
  // Effective limit accounts for the subscriber bonus.
  const [{ count: activeCount }, { data: subRow }] = await Promise.all([
    admin
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`),
    admin
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<{ status: string | null }>(),
  ]);

  const isSubscribed = subRow?.status === "active";
  const limit = effectiveConnectionsLimit(isSubscribed);
  if ((activeCount ?? 0) >= limit) {
    return NextResponse.json({ error: "limit_reached" }, { status: 409 });
  }

  // Membership check — only active members may be invited. The lookup
  // endpoint runs this same check before this POST fires; we repeat it
  // here as defense in depth because a hand-crafted POST could skip
  // the lookup. Banned (banned_until > now) is reported as not_member;
  // ban status is not leaked.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle<{ id: string; email: string | null }>();

  if (!targetProfile) {
    return NextResponse.json({ error: "not_member" }, { status: 404 });
  }

  const { data: targetAuth } = await admin.auth.admin.getUserById(
    targetProfile.id,
  );
  const targetAuthUser = targetAuth?.user ?? null;
  if (!targetAuthUser) {
    return NextResponse.json({ error: "not_member" }, { status: 404 });
  }
  const bannedUntilMs = targetAuthUser.banned_until
    ? new Date(targetAuthUser.banned_until).getTime()
    : 0;
  if (Number.isFinite(bannedUntilMs) && bannedUntilMs > Date.now()) {
    return NextResponse.json({ error: "not_member" }, { status: 404 });
  }

  const targetId = targetProfile.id;
  const callerEmail = (user.email ?? "").trim().toLowerCase();

  // Existing relationship — block duplicate sends in either direction
  // and any already-active pairing. connection_user_id can be null on
  // legacy rows so we match on connection_email too.
  const [
    outByEmail,
    outByUserId,
    inByEmail,
    inByUserId,
  ] = await Promise.all([
    admin
      .from("connections")
      .select("status")
      .eq("inviter_user_id", user.id)
      .eq("connection_email", email)
      .in("status", ["pending", "active"]),
    admin
      .from("connections")
      .select("status")
      .eq("inviter_user_id", user.id)
      .eq("connection_user_id", targetId)
      .in("status", ["pending", "active"]),
    admin
      .from("connections")
      .select("status")
      .eq("inviter_user_id", targetId)
      .eq("connection_email", callerEmail)
      .in("status", ["pending", "active"]),
    admin
      .from("connections")
      .select("status")
      .eq("inviter_user_id", targetId)
      .eq("connection_user_id", user.id)
      .in("status", ["pending", "active"]),
  ]);

  const outRows = [
    ...(outByEmail.data ?? []),
    ...(outByUserId.data ?? []),
  ];
  const inRows = [
    ...(inByEmail.data ?? []),
    ...(inByUserId.data ?? []),
  ];

  if (
    outRows.some((r) => r.status === "active") ||
    inRows.some((r) => r.status === "active")
  ) {
    return NextResponse.json({ error: "already_connected" }, { status: 409 });
  }
  if (outRows.some((r) => r.status === "pending")) {
    return NextResponse.json(
      { error: "pending_invite_exists" },
      { status: 409 },
    );
  }
  if (inRows.some((r) => r.status === "pending")) {
    return NextResponse.json({ error: "request_received" }, { status: 409 });
  }

  // Strict inviter first name — derived only from profiles.full_name.
  // If null, return 422 before inserting the connections row: the
  // named summons is the whole point of the invite template, and we
  // want the user to fix their settings rather than send a generic
  // email. TODO: promote profiles.first_name to a real column so
  // this lookup becomes an indexed column read.
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null }>();
  const inviterName = firstNameFrom(profile?.full_name ?? null);
  if (!inviterName) {
    return NextResponse.json(
      { error: "missing_inviter_first_name" },
      { status: 422 },
    );
  }

  const token = generateInviteToken();
  const expiresAt = inviteExpiryFromNow().toISOString();

  const { data: inserted, error: insertError } = await admin
    .from("connections")
    .insert({
      inviter_user_id: user.id,
      connection_user_id: targetId,
      connection_email: email,
      role,
      note,
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
    note,
    acceptUrl,
    // Invite goes in the inviter's language — the note is theirs, and the
    // invite landing lets the recipient switch.
    locale: await localeForUser(admin, user.id),
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

  // Notify the inviter (Fig. 05), gated on their preference.
  await notifyInviterAccepted(admin, conn.inviter_user_id, firstName);

  return NextResponse.json({
    ok: true,
    connection_id: conn.id,
    mode: acceptanceMode,
  });
}

// ────────────────────────────────────────────────────────────────────
// accept-incoming / decline-incoming
//
// Authenticated recipient acts on a pending row they received. Distinct
// from the token-based handlers above — those serve the public /invite
// landing for invitees without an account; these serve members who are
// already signed in and can see the pending row on /connections.
// ────────────────────────────────────────────────────────────────────

async function handleAcceptIncoming(body: Record<string, unknown>) {
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
      "id, inviter_user_id, connection_user_id, connection_email, status, expires_at",
    )
    .eq("id", connectionId)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      connection_user_id: string | null;
      connection_email: string;
      status: string;
      expires_at: string;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conn.connection_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (conn.status === "active") {
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

  // Recipient-side cap. Accepting cannot push the recipient over their
  // effective limit — same enforcement as the inviter's send-side cap.
  const [{ count: activeCount }, { data: subRow }] = await Promise.all([
    admin
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`),
    admin
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<{ status: string | null }>(),
  ]);
  const limit = effectiveConnectionsLimit(subRow?.status === "active");
  if ((activeCount ?? 0) >= limit) {
    return NextResponse.json({ error: "limit_reached" }, { status: 409 });
  }

  // First name for the inviter's view of this connection. Profile's
  // full_name → first name; falls back to the email local part so the
  // row never renders blank.
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; email: string | null }>();
  const firstName =
    firstNameFrom(profile?.full_name) ??
    firstNameFrom(profile?.email) ??
    (user.email?.split("@")[0] ?? "");

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

  // Depth contribution flips on for both parties.
  await Promise.all([
    recomputeDepthFor(conn.inviter_user_id, admin),
    recomputeDepthFor(user.id, admin),
  ]);

  // Notify the inviter (Fig. 05), gated on their preference.
  await notifyInviterAccepted(admin, conn.inviter_user_id, firstName);

  return NextResponse.json({ ok: true, connection_id: conn.id });
}

async function handleDeclineIncoming(body: Record<string, unknown>) {
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
    .select("id, connection_user_id, status")
    .eq("id", connectionId)
    .maybeSingle<{
      id: string;
      connection_user_id: string | null;
      status: string;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (conn.connection_user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  const recipientUserId =
    user.id === conn.inviter_user_id
      ? conn.connection_user_id
      : conn.inviter_user_id;
  if (otherEmail && enderFirstName) {
    await sendConnectionEndedEmail({
      to: otherEmail,
      enderFirstName,
      roomUrl: `${siteOriginFromEnv()}/room`,
      locale: recipientUserId
        ? await localeForUser(admin, recipientUserId)
        : DEFAULT_LOCALE,
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

  // Strict inviter first name — same contract as handleInvite. Resolve
  // BEFORE regenerating the token so we don't burn a token if the name
  // is missing.
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null }>();
  const inviterName = firstNameFrom(profile?.full_name ?? null);
  if (!inviterName) {
    return NextResponse.json(
      { error: "missing_inviter_first_name" },
      { status: 422 },
    );
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

  const acceptUrl = `${siteOriginFromEnv()}/invite/${newToken}`;
  await sendInviteEmail({
    to: conn.connection_email,
    inviterFirstName: inviterName,
    note: conn.note,
    acceptUrl,
    locale: await localeForUser(admin, user.id),
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

// Notify the inviter that their invitation was accepted — gated on the
// inviter's connection_requests email preference, sent in the inviter's
// locale (Fig. 05). Best-effort: never blocks or fails the accept.
async function notifyInviterAccepted(
  admin: AdminClient,
  inviterUserId: string,
  connectionFirstName: string,
): Promise<void> {
  try {
    const enabled = await emailPreferenceEnabled(
      admin,
      inviterUserId,
      "connection_requests",
    );
    if (!enabled) return;
    const { data: inviter } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", inviterUserId)
      .maybeSingle<{ email: string | null; full_name: string | null }>();
    if (!inviter?.email) return;
    await sendConnectionAcceptedEmail({
      to: inviter.email,
      inviterFirstName: firstNameFrom(inviter.full_name),
      connectionFirstName,
      roomUrl: `${siteOriginFromEnv()}/room`,
      locale: await localeForUser(admin, inviterUserId),
    });
  } catch {
    // best-effort — a failed notification never blocks the accept.
  }
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

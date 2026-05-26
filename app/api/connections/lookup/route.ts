import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  effectiveConnectionsLimit,
  isLikelyEmail,
} from "@/lib/connections";
import { checkAndRecordLookupRateLimit } from "@/lib/ratelimit";

// POST /api/connections/lookup
//
// Resolves the membership + relationship state for an email the caller
// is about to invite. Read-only — does not create rows. The form calls
// this first so the UI can branch (not a member / already connected /
// already requested / available) before the actual invite POST.
//
// Privacy: this endpoint confirms membership to an authenticated, in-
// good-standing member. We rate-limit to 10/min/user so it cannot be
// pumped as a user-enumeration oracle. Banned accounts are reported as
// `not_member` — ban status is not leaked.

type LookupStatus =
  | "invalid_email"
  | "self"
  | "limit_reached"
  | "not_member"
  | "request_sent"
  | "request_received"
  | "already_connected"
  | "available";

type LookupResponse =
  | { status: LookupStatus }
  | { status: "limit_reached"; limit: number; used: number };

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Rate-limit first so the cap also throttles malformed-body floods.
  const rate = await checkAndRecordLookupRateLimit(admin, user.id);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!isLikelyEmail(email)) {
    return NextResponse.json<LookupResponse>({ status: "invalid_email" });
  }

  const callerEmail = (user.email ?? "").trim().toLowerCase();
  if (email === callerEmail) {
    return NextResponse.json<LookupResponse>({ status: "self" });
  }

  // Cap check before membership lookup — an at-cap caller cannot add a
  // new connection anyway, and short-circuiting here prevents the
  // endpoint from being usable as an enumeration oracle once the
  // caller has filled their slots.
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
  const used = activeCount ?? 0;
  const limit = effectiveConnectionsLimit(subRow?.status === "active");
  if (used >= limit) {
    return NextResponse.json<LookupResponse>({
      status: "limit_reached",
      limit,
      used,
    });
  }

  // Membership: profile row + un-banned auth user. Banned is reported
  // as `not_member` — we do not leak ban status to other members.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle<{ id: string; email: string | null }>();

  if (!profile) {
    return NextResponse.json<LookupResponse>({ status: "not_member" });
  }

  const { data: authData } = await admin.auth.admin.getUserById(profile.id);
  const authUser = authData?.user ?? null;
  if (!authUser) {
    return NextResponse.json<LookupResponse>({ status: "not_member" });
  }
  const bannedUntilMs = authUser.banned_until
    ? new Date(authUser.banned_until).getTime()
    : 0;
  if (Number.isFinite(bannedUntilMs) && bannedUntilMs > Date.now()) {
    return NextResponse.json<LookupResponse>({ status: "not_member" });
  }

  // Existing relationship — four indexed point lookups in parallel.
  // The connections table doesn't always have connection_user_id
  // populated (the legacy invite-accept path leaves it null), so we
  // match on connection_email as well. Status filter excludes the
  // dead states (declined/expired/ended) so re-invite is possible.
  const targetId = profile.id;
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

  const anyActive =
    outRows.some((r) => r.status === "active") ||
    inRows.some((r) => r.status === "active");
  if (anyActive) {
    return NextResponse.json<LookupResponse>({ status: "already_connected" });
  }
  if (outRows.some((r) => r.status === "pending")) {
    return NextResponse.json<LookupResponse>({ status: "request_sent" });
  }
  if (inRows.some((r) => r.status === "pending")) {
    return NextResponse.json<LookupResponse>({ status: "request_received" });
  }

  return NextResponse.json<LookupResponse>({ status: "available" });
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import ConnectionList, {
  type ActiveConnectionDisplay,
  type IncomingConnectionDisplay,
  type PendingConnectionDisplay,
} from "@/components/room/ConnectionList";
import InviteForm from "@/components/room/InviteForm";
import {
  SUBSCRIBER_BONUS_CONNECTIONS,
  effectiveConnectionsLimit,
  firstNameFrom,
} from "@/lib/connections";
import { connectionExplainer } from "@/lib/copy";

// /connections — manage the people whose presence shapes the reading.
// Free users may invite up to the base cap; subscribers add the bonus.
// The invite form is the only way to add one and it lives directly on
// this page. Incoming requests from other members are surfaced above
// the active list so the recipient can accept or decline in place.

type ConnectionRow = {
  id: string;
  inviter_user_id: string;
  connection_user_id: string | null;
  connection_email: string;
  connection_first_name: string | null;
  role: string;
  status: "pending" | "active" | "declined" | "expired" | "ended";
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: connectionRows }, { data: subRow }] = await Promise.all([
    supabase
      .from("connections")
      .select(
        "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, role, status, accepted_at, expires_at, created_at",
      )
      .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<{ status: string | null }>(),
  ]);

  const rows = (connectionRows as ConnectionRow[] | null) ?? [];

  // For each incoming pending row we need the inviter's display name
  // and email. The 'profiles: select own' RLS policy blocks reading
  // other users' profiles via the user client, so we resolve through
  // the service-role admin client (the inviter user ids are already
  // bound to rows the caller can see, so we're not enabling new
  // disclosure — just filling in detail for rows they already have).
  const incomingPendingRows = rows.filter(
    (r) => r.status === "pending" && r.connection_user_id === user.id,
  );
  const inviterIds = Array.from(
    new Set(incomingPendingRows.map((r) => r.inviter_user_id)),
  );
  const inviterById = new Map<
    string,
    { email: string | null; firstName: string | null }
  >();
  if (inviterIds.length > 0) {
    const admin = adminClient();
    if (admin) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", inviterIds);
      for (const p of (profiles ?? []) as Array<{
        id: string;
        email: string | null;
        full_name: string | null;
      }>) {
        inviterById.set(p.id, {
          email: p.email,
          firstName: firstNameFrom(p.full_name),
        });
      }
    }
  }

  const { active, pending, incoming } = buildConnectionDisplays(
    rows,
    user.id,
    inviterById,
  );
  const isSubscribed = subRow?.status === "active";
  const limit = effectiveConnectionsLimit(isSubscribed);
  const canInvite = active.length < limit;

  return (
    <>
      <Reveal as="section" className="room-section settings-head">
        <Eyebrow>CONNECTIONS</Eyebrow>
        <h1 className="settings-h">
          The people in <span className="it">the reading.</span>
        </h1>
        <p className="lede settings-lede">{connectionExplainer(limit)}</p>
      </Reveal>

      <section className="settings-block">
        <div className="settings-block-body">
          <p className="connection-usage">
            <span className="connection-usage-label">USED</span>
            <span className="connection-usage-value">
              {active.length} / {limit}
            </span>
          </p>

          <ConnectionList
            active={active}
            pending={pending}
            incoming={incoming}
          />

          {canInvite ? (
            <div className="connection-invite-wrap">
              <p className="connection-invite-eyebrow">INVITE A CONNECTION</p>
              <InviteForm effectiveLimit={limit} />
            </div>
          ) : isSubscribed ? (
            <p className="connection-limit-note">
              <em className="serif-i">
                {limit} connections is the limit. disconnect one to add
                another.
              </em>
            </p>
          ) : (
            <div className="connection-limit-upsell">
              <p className="connection-limit-note">
                <em className="serif-i">
                  {limit} connections is the limit on the free tier.
                </em>
              </p>
              <Link
                href="/subscribe/confirm"
                className="connection-limit-upsell-link"
              >
                <span>subscribers add {SUBSCRIBER_BONUS_CONNECTIONS} more</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function buildConnectionDisplays(
  rows: ConnectionRow[],
  currentUserId: string,
  inviterById: Map<
    string,
    { email: string | null; firstName: string | null }
  >,
): {
  active: ActiveConnectionDisplay[];
  pending: PendingConnectionDisplay[];
  incoming: IncomingConnectionDisplay[];
} {
  const active: ActiveConnectionDisplay[] = [];
  const pending: PendingConnectionDisplay[] = [];
  const incoming: IncomingConnectionDisplay[] = [];
  for (const r of rows) {
    if (r.status === "active") {
      active.push({
        id: r.id,
        firstName: r.connection_first_name,
        email: r.connection_email,
        role: r.role,
        acceptedAt: r.accepted_at,
      });
      continue;
    }
    if (r.status !== "pending") continue;
    if (r.inviter_user_id === currentUserId) {
      pending.push({
        id: r.id,
        email: r.connection_email,
        role: r.role,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      });
      continue;
    }
    if (r.connection_user_id === currentUserId) {
      const inviter = inviterById.get(r.inviter_user_id);
      incoming.push({
        id: r.id,
        inviterEmail: inviter?.email ?? "",
        inviterFirstName: inviter?.firstName ?? null,
        role: r.role,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      });
    }
  }
  return { active, pending, incoming };
}

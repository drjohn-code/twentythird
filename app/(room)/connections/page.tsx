import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import RowLink from "@/components/ui/RowLink";
import Hairline from "@/components/room/Hairline";
import ConnectionList, {
  type ActiveConnectionDisplay,
  type PendingConnectionDisplay,
} from "@/components/room/ConnectionList";
import InviteForm from "@/components/room/InviteForm";
import { MAX_ACTIVE_CONNECTIONS } from "@/lib/connections";
import { connectionExplainer } from "@/lib/copy";

// /connections — manage the people whose presence shapes the reading.
// Pulled out of Settings → Section 04 so the Settings page can host
// the new consolidated Reading Depth block without competing concerns.

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

type SubscriptionRow = {
  status: string | null;
};

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [connectionsRes, subRes] = await Promise.all([
    supabase
      .from("connections")
      .select(
        "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, role, status, accepted_at, expires_at, created_at",
      )
      .or(
        `inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
  ]);

  const rows = (connectionsRes.data as ConnectionRow[] | null) ?? [];
  const { active, pending } = buildConnectionDisplays(rows, user.id);
  const isSubscribed = subRes.data?.status === "active";
  const canInvite = isSubscribed && active.length < MAX_ACTIVE_CONNECTIONS;

  return (
    <>
      <Reveal as="section" className="room-section settings-head">
        <Eyebrow>CONNECTIONS</Eyebrow>
        <h1 className="settings-h">
          The people in <span className="it">the reading.</span>
        </h1>
        <p className="lede settings-lede">{connectionExplainer}</p>
      </Reveal>

      <section className="settings-block">
        <div className="settings-block-body">
          <ConnectionList active={active} pending={pending} />

          {isSubscribed ? (
            canInvite ? (
              <div className="connection-invite-wrap">
                <p className="connection-invite-eyebrow">INVITE A CONNECTION</p>
                <InviteForm />
              </div>
            ) : (
              <p className="connection-limit-note">
                <em className="serif-i">
                  two connections is the limit. disconnect one to add another.
                </em>
              </p>
            )
          ) : (
            <div className="settings-stub-cta connection-unsubscribed">
              <p className="connection-unsubscribed-line">
                <em className="serif-i">
                  connections begin with the consulting room. enter to unlock
                  the invite.
                </em>
              </p>
              <RowLink href="/consulting">enter the consulting room</RowLink>
            </div>
          )}
        </div>
      </section>

      <Hairline />
    </>
  );
}

function buildConnectionDisplays(
  rows: ConnectionRow[],
  currentUserId: string,
): {
  active: ActiveConnectionDisplay[];
  pending: PendingConnectionDisplay[];
} {
  const active: ActiveConnectionDisplay[] = [];
  const pending: PendingConnectionDisplay[] = [];
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
    if (r.status === "pending" && r.inviter_user_id === currentUserId) {
      pending.push({
        id: r.id,
        email: r.connection_email,
        role: r.role,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      });
    }
  }
  return { active, pending };
}

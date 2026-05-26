import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import ConnectionList, {
  type ActiveConnectionDisplay,
  type PendingConnectionDisplay,
} from "@/components/room/ConnectionList";
import InviteForm from "@/components/room/InviteForm";
import { MAX_ACTIVE_CONNECTIONS } from "@/lib/connections";
import { connectionExplainer } from "@/lib/copy";

// /connections — manage the people whose presence shapes the reading.
// Any authenticated user can add up to MAX_ACTIVE_CONNECTIONS; the
// invite form is the only way to add one and it lives directly on
// this page.

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

  const { data: connectionRows } = await supabase
    .from("connections")
    .select(
      "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, role, status, accepted_at, expires_at, created_at",
    )
    .or(`inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const rows = (connectionRows as ConnectionRow[] | null) ?? [];
  const { active, pending } = buildConnectionDisplays(rows, user.id);
  const canInvite = active.length < MAX_ACTIVE_CONNECTIONS;

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

          {canInvite ? (
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
          )}
        </div>
      </section>
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

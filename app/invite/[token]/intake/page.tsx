import "server-only";
import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import RelationshipIntake from "@/components/room/RelationshipIntake";
import { firstNameFrom } from "@/lib/connections";

// The relationship-intake page is reached after the invitee accepts.
// It re-verifies the token (so a stale URL can't be filled in), then
// renders the question runner.

type Params = { token: string };

export const dynamic = "force-dynamic";

export default async function InviteIntakePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const admin = adminClient();

  if (!admin) {
    return (
      <main className="invite-shell">
        <header className="invite-shell-head">
          <Link href="/" className="invite-shell-wordmark">
            TwentyThird
          </Link>
        </header>
        <section className="invite-page invite-page-quiet">
          <p className="eyebrow">RELATIONSHIP INTAKE</p>
          <h1 className="invite-page-h">
            The intake is being <span className="it">prepared.</span>
          </h1>
          <p className="invite-page-lede">Please try again shortly.</p>
        </section>
      </main>
    );
  }

  const { data: conn } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, status, accepted_at, connection_first_name",
    )
    .eq("invite_token", token)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      status: string;
      accepted_at: string | null;
      connection_first_name: string | null;
    }>();

  if (!conn) {
    return (
      <main className="invite-shell">
        <header className="invite-shell-head">
          <Link href="/" className="invite-shell-wordmark">
            TwentyThird
          </Link>
        </header>
        <section className="invite-page invite-page-quiet">
          <p className="eyebrow">RELATIONSHIP INTAKE</p>
          <h1 className="invite-page-h">
            This link is <span className="it">not recognised.</span>
          </h1>
          <p className="invite-page-lede">
            Open the most recent invite email for the active link.
          </p>
        </section>
      </main>
    );
  }

  if (conn.status !== "active") {
    return (
      <main className="invite-shell">
        <header className="invite-shell-head">
          <Link href="/" className="invite-shell-wordmark">
            TwentyThird
          </Link>
        </header>
        <section className="invite-page invite-page-quiet">
          <p className="eyebrow">RELATIONSHIP INTAKE</p>
          <h1 className="invite-page-h">
            The intake is <span className="it">not open.</span>
          </h1>
          <p className="invite-page-lede">
            This invite has not been accepted, or has been declined or
            ended. Return to the invite link to choose again.
          </p>
          <Link href={`/invite/${token}`} className="auth-rowlink invite-cta-link">
            <span>back to the invite</span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    );
  }

  // Look up the inviter's first name for the intake's framing copy.
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", conn.inviter_user_id)
    .maybeSingle<{ full_name: string | null; email: string | null }>();
  const inviterFirstName =
    firstNameFrom(inviterProfile?.full_name) ??
    firstNameFrom(inviterProfile?.email) ??
    "your connection";

  return (
    <main className="invite-shell">
      <header className="invite-shell-head">
        <Link href="/" className="invite-shell-wordmark">
          TwentyThird
        </Link>
      </header>
      <RelationshipIntake token={token} inviterFirstName={inviterFirstName} />
      <footer className="invite-shell-foot">
        TwentyThird is not a substitute for clinical care. In crisis,
        contact your local emergency line.
      </footer>
    </main>
  );
}

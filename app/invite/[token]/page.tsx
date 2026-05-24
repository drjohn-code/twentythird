import "server-only";
import Link from "next/link";
import { adminClient } from "@/lib/supabase/admin";
import AcceptInviteActions from "@/components/room/AcceptInviteActions";
import {
  firstNameFrom,
  firstNameOrEmailLocal,
  roleLabel,
  formatShortDate,
  daysUntil,
} from "@/lib/connections";

// Public route — no auth required. The marketing Nav/Footer is already
// suppressed for /invite/* in MarketingChrome.tsx; the page renders its
// own minimal chrome (logo wordmark + atmosphere + safety footer).
//
// Five distinct states render here:
//   - not found          — token doesn't exist
//   - expired            — pending past expires_at
//   - declined           — invitee chose "no, thank you"
//   - already accepted   — invitee returned to the link after accepting
//   - active invitation  — the normal landing
//
// The same atmosphere/grain layers from app/layout.tsx are visible
// here, so this page just renders content directly.

type Params = {
  token: string;
};

type ConnectionRow = {
  id: string;
  inviter_user_id: string;
  connection_email: string;
  connection_first_name: string | null;
  role: string;
  note: string | null;
  status: "pending" | "active" | "declined" | "expired" | "ended";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type ProfileRow = {
  full_name: string | null;
  email: string | null;
};

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const admin = adminClient();

  if (!admin) {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              The invite system is being{" "}
              <span className="it">prepared.</span>
            </>
          }
          body="Please try again shortly."
        />
      </InviteShell>
    );
  }

  const { data: conn } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, connection_email, connection_first_name, role, note, status, expires_at, accepted_at, created_at",
    )
    .eq("invite_token", token)
    .maybeSingle<ConnectionRow>();

  if (!conn) {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              This link is <span className="it">not recognised.</span>
            </>
          }
          body="If the link came from an email recently, the invite may have been resent. Open the most recent email for the active link."
        />
      </InviteShell>
    );
  }

  // Lookup the inviter for their first name and email — best effort.
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", conn.inviter_user_id)
    .maybeSingle<ProfileRow>();

  const inviterFirstName =
    firstNameFrom(inviterProfile?.full_name) ??
    firstNameFrom(inviterProfile?.email) ??
    "Someone";

  // Status branches.
  if (conn.status === "declined") {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              This invite was <span className="it">declined.</span>
            </>
          }
          body={`Nothing more is needed from you. ${inviterFirstName} will not be notified beyond what they already see.`}
        />
      </InviteShell>
    );
  }

  if (conn.status === "active") {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              You have already <span className="it">accepted.</span>
            </>
          }
          body="If the relationship intake is not yet complete, you can continue below."
          footer={
            <Link
              href={`/invite/${token}/intake`}
              className="auth-rowlink invite-cta-link"
            >
              <span>continue the relationship intake</span>
              <span aria-hidden="true">→</span>
            </Link>
          }
        />
      </InviteShell>
    );
  }

  if (conn.status === "ended") {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              This connection has <span className="it">ended.</span>
            </>
          }
          body="The link is no longer active. The relationship record remains in the case file, but no longer informs the reading."
        />
      </InviteShell>
    );
  }

  const expired =
    conn.status === "expired" ||
    new Date(conn.expires_at).getTime() < Date.now();

  if (expired) {
    return (
      <InviteShell>
        <QuietState
          eyebrow="INVITE"
          headline={
            <>
              This invite has <span className="it">expired.</span>
            </>
          }
          body={`Invites expire fourteen days after they are sent. Ask ${inviterFirstName} to send a new one if you would like to respond.`}
        />
      </InviteShell>
    );
  }

  // Status === "pending" — the live invitation.
  const daysLeft = daysUntil(conn.expires_at);
  const sentTo = firstNameOrEmailLocal(null, conn.connection_email);

  return (
    <InviteShell>
      <section className="invite-page">
        <header className="invite-page-head">
          <p className="eyebrow">CONNECTION REQUEST</p>
          <h1 className="invite-page-h">
            {inviterFirstName} has invited you into{" "}
            <span className="it">their reading.</span>
          </h1>
          <p className="invite-page-lede">
            TwentyThird is an editorial-clinical instrument — a quiet room
            where the structure of someone&apos;s inner life is read with
            care, and rendered in language a clinician can use.
          </p>
        </header>

        <div className="invite-page-explainer">
          <p>
            A <em className="serif-i">connection</em> is not a shared
            account. {inviterFirstName} will not see your readings,
            sessions, or case file. You will not see theirs. What you say
            about the relationship feeds the model that produces{" "}
            {inviterFirstName}&apos;s reading.
          </p>
          <p>
            If you would like a reading of your own, the first path below
            also begins your own account. The middle path lets you
            contribute to {inviterFirstName}&apos;s reading without an
            account. Either is allowed.
          </p>
        </div>

        {conn.note ? (
          <blockquote className="invite-page-note">
            {conn.note}
            <span className="invite-page-note-attrib">
              — {inviterFirstName.toLowerCase()}
            </span>
          </blockquote>
        ) : null}

        <AcceptInviteActions
          token={token}
          inviterFirstName={inviterFirstName}
        />

        <footer className="invite-page-meta">
          <span>
            sent to{" "}
            <em className="serif-i">{sentTo.toLowerCase()}</em>{" "}
          </span>
          <span>·</span>
          <span>
            invite as{" "}
            <em className="serif-i">{roleLabel(conn.role)}</em>
          </span>
          <span>·</span>
          <span>
            received {formatShortDate(conn.created_at)}
          </span>
          <span>·</span>
          <span>
            expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
          </span>
        </footer>
      </section>
    </InviteShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// Shared layout pieces — keep the invite chrome scoped to this route
// (no Room nav, no marketing nav, no Today line).
// ────────────────────────────────────────────────────────────────────

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="invite-shell">
      <header className="invite-shell-head">
        <Link href="/" className="invite-shell-wordmark">
          TwentyThird
        </Link>
      </header>
      {children}
      <footer className="invite-shell-foot">
        TwentyThird is not a substitute for clinical care. In crisis,
        contact your local emergency line.
      </footer>
    </main>
  );
}

function QuietState({
  eyebrow,
  headline,
  body,
  footer,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="invite-page invite-page-quiet">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="invite-page-h">{headline}</h1>
      <p className="invite-page-lede">{body}</p>
      {footer ? <div className="invite-page-footer">{footer}</div> : null}
    </section>
  );
}

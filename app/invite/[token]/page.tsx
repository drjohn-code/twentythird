import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminClient } from "@/lib/supabase/admin";
import AcceptInviteActions from "@/components/room/AcceptInviteActions";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import {
  firstNameFrom,
  firstNameOrEmailLocal,
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
  const t = await getTranslations("invite");
  const tc = await getTranslations("connections");

  if (!admin) {
    return (
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("notReady.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("notReady.body")}
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
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("notFound.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("notFound.body")}
          footer={
            <Link href="/auth/sign-up" className="auth-rowlink invite-cta-link">
              <span>{t("notFound.startLink")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          }
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
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("alreadyDeclined.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("alreadyDeclined.body", { name: inviterFirstName })}
        />
      </InviteShell>
    );
  }

  if (conn.status === "active") {
    return (
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("alreadyAccepted.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("alreadyAccepted.body")}
          footer={
            <Link
              href={`/invite/${token}/intake`}
              className="auth-rowlink invite-cta-link"
            >
              <span>{t("alreadyAccepted.continueLink")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          }
        />
      </InviteShell>
    );
  }

  if (conn.status === "ended") {
    return (
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("ended.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("ended.body")}
        />
      </InviteShell>
    );
  }

  const expired =
    conn.status === "expired" ||
    new Date(conn.expires_at).getTime() < Date.now();

  if (expired) {
    return (
      <InviteShell safetyFooter={t("safetyFooter")}>
        <QuietState
          eyebrow={t("eyebrow")}
          headline={t.rich("expired.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
          body={t("expired.body", { name: inviterFirstName })}
          footer={
            <Link href="/auth/sign-up" className="auth-rowlink invite-cta-link">
              <span>{t("expired.startLink")}</span>
              <span aria-hidden="true">→</span>
            </Link>
          }
        />
      </InviteShell>
    );
  }

  // Status === "pending" — the live invitation.
  const daysLeft = daysUntil(conn.expires_at);
  const sentTo = firstNameOrEmailLocal(null, conn.connection_email);

  return (
    <InviteShell safetyFooter={t("safetyFooter")}>
      <section className="invite-page">
        <header className="invite-page-head">
          <p className="eyebrow">{t("live.eyebrow")}</p>
          <h1 className="invite-page-h">
            {t.rich("live.headline", {
              name: inviterFirstName,
              it: (chunks) => <span className="it">{chunks}</span>,
            })}
          </h1>
          <p className="invite-page-lede">{t("live.lede")}</p>
        </header>

        <div className="invite-page-explainer">
          <p>
            {t.rich("live.explainerOne", {
              name: inviterFirstName,
              em: (chunks) => <em className="serif-i">{chunks}</em>,
            })}
          </p>
          <p>{t("live.explainerTwo", { name: inviterFirstName })}</p>
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
            {t("live.metaSentTo")}{" "}
            <em className="serif-i">{sentTo.toLowerCase()}</em>{" "}
          </span>
          <span>·</span>
          <span>
            {t("live.metaInviteAs")}{" "}
            <em className="serif-i">{tc(`roles.${conn.role}`)}</em>
          </span>
          <span>·</span>
          <span>
            {t("live.metaReceived")} {formatShortDate(conn.created_at)}
          </span>
          <span>·</span>
          <span>
            {t("live.metaExpiresIn", { count: daysLeft })}
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

function InviteShell({
  children,
  safetyFooter,
}: {
  children: React.ReactNode;
  safetyFooter: string;
}) {
  return (
    <main className="invite-shell">
      <div className="absolute right-9 top-9 z-10">
        <LocaleSwitcher />
      </div>
      <header className="invite-shell-head">
        <Link href="/" className="invite-shell-wordmark">
          TwentyThird
        </Link>
      </header>
      {children}
      <footer className="invite-shell-foot">{safetyFooter}</footer>
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

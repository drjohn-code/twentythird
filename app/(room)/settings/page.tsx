import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import SettingsBlock from "@/components/room/SettingsBlock";
import SettingsSaveStrip from "@/components/room/SettingsSaveStrip";
import DepthMeter from "@/components/room/DepthMeter";
import IntakeAnswersList, {
  type QuestionWithAnswer,
} from "@/components/room/IntakeAnswersList";
import EmailToggles, {
  type EmailPreferences,
} from "@/components/room/EmailToggles";
import DangerZone from "@/components/room/DangerZone";
import ConnectionList, {
  type ActiveConnectionDisplay,
  type PendingConnectionDisplay,
} from "@/components/room/ConnectionList";
import InviteForm from "@/components/room/InviteForm";
import {
  loadDepthInputs,
  computeDepthBreakdown,
} from "@/lib/depth";
import { MAX_ACTIVE_CONNECTIONS } from "@/lib/connections";
import { STEPS } from "@/lib/onboarding/steps";
import type {
  AnyQuestion,
  AnswerValue,
} from "@/lib/types/intake";

// /settings — long single column. Section heads with hairline dividers.
// No save button anywhere: writes happen on blur or selection and the
// quiet hairline strip at the top of the page pulses on success.

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  birth_year: number | null;
};
type UsersMetaRow = {
  locale: string;
  email_preferences: EmailPreferences | null;
};
type SubscriptionRow = {
  status: string | null;
  current_period_end: string | null;
};
type ReportRow = {
  id: string;
  status: string;
  pdf_url: string | null;
  created_at: string;
};
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
type IntakeResponseRow = {
  step_number: number;
  payload: Record<string, unknown> | null;
};
type IntakeAnswerRow = {
  question_key: string;
  answer: { value: AnswerValue } | null;
  version: number;
};

const DEFAULT_EMAIL_PREFS: EmailPreferences = {
  weekly_catchup: true,
  session_summaries: true,
  report_ready: true,
  connection_requests: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "08:00",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    profileRes,
    metaRes,
    subRes,
    reportsRes,
    intakeResponsesRes,
    intakeAnswersRes,
    connectionsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, birth_year")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("users_meta")
      .select("locale, email_preferences")
      .eq("user_id", user.id)
      .maybeSingle<UsersMetaRow>(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("reports")
      .select("id, status, pdf_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("intake_responses")
      .select("step_number, payload")
      .eq("user_id", user.id),
    supabase
      .from("intake_answers")
      .select("question_key, answer, version")
      .eq("user_id", user.id)
      .order("version", { ascending: false }),
    supabase
      .from("connections")
      .select(
        "id, inviter_user_id, connection_user_id, connection_email, connection_first_name, role, status, accepted_at, expires_at, created_at",
      )
      .or(
        `inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`,
      )
      .order("created_at", { ascending: false }),
  ]);

  const inputs = await loadDepthInputs(user.id, supabase);
  const breakdown = computeDepthBreakdown(inputs);
  // The depth row itself is the up-to-date source of truth; the
  // breakdown above only describes the source split.
  const { data: depthRow } = await supabase
    .from("users_meta")
    .select("reading_depth")
    .eq("user_id", user.id)
    .maybeSingle<{ reading_depth: number | null }>();
  const depth = depthRow?.reading_depth ?? 0;

  const profile = profileRes.data ?? {
    full_name: null,
    email: user.email ?? null,
    birth_year: null,
  };
  const locale = metaRes.data?.locale ?? "en";
  const emailPrefs: EmailPreferences = {
    ...DEFAULT_EMAIL_PREFS,
    ...(metaRes.data?.email_preferences ?? {}),
  };

  const isSubscribed = subRes.data?.status === "active";
  const reports = (reportsRes.data as ReportRow[] | null) ?? [];

  const intakeItems = buildIntakeAnswers(
    (intakeResponsesRes.data as IntakeResponseRow[] | null) ?? [],
    (intakeAnswersRes.data as IntakeAnswerRow[] | null) ?? [],
  );

  const connectionRows =
    (connectionsRes.data as ConnectionRow[] | null) ?? [];
  const { active: activeConnections, pending: pendingConnections } =
    buildConnectionDisplays(connectionRows, user.id);
  const canInvite =
    isSubscribed && activeConnections.length < MAX_ACTIVE_CONNECTIONS;

  return (
    <>
      <SettingsSaveStrip />

      <Reveal as="section" className="room-section settings-head">
        <Eyebrow>SETTINGS</Eyebrow>
        <h1 className="settings-h">
          The shape of <span className="it">the room.</span>
        </h1>
        <p className="lede settings-lede">
          Nothing here is permanent. Answers can be edited, preferences
          flipped, and the case file can be erased entirely.
        </p>
      </Reveal>

      {/* 1 — Account */}
      <SettingsBlock eyebrow="01" title="Account">
        <dl className="account-list">
          <div className="account-row">
            <dt>name</dt>
            <dd>{profile.full_name ?? "—"}</dd>
          </div>
          <div className="account-row">
            <dt>email</dt>
            <dd className="account-row-with-edit">
              <span>{profile.email ?? "—"}</span>
              <Link href="/auth/change-email" className="auth-rowlink">
                <span>change</span>
                <span aria-hidden="true">→</span>
              </Link>
            </dd>
          </div>
          <div className="account-row">
            <dt>birth year</dt>
            <dd>{profile.birth_year ?? "—"}</dd>
          </div>
          <div className="account-row">
            <dt>language</dt>
            <dd>
              <span>english</span>
              <span className="account-row-note">
                more locales arrive after launch.
              </span>
            </dd>
          </div>
        </dl>
        {locale !== "en" ? null : null}
      </SettingsBlock>

      {/* 2 — Your intake */}
      <SettingsBlock
        eyebrow="02"
        title="Your intake"
        id="intake"
        intro={
          <em className="serif-i">
            the intake is not a one-time form. answers can deepen.
          </em>
        }
      >
        <IntakeAnswersList items={intakeItems} />
      </SettingsBlock>

      {/* 3 — Reading depth */}
      <SettingsBlock
        eyebrow="03"
        title="Reading depth"
        id="depth"
        intro={
          <em className="serif-i">
            a quieter, more accurate reading — not a higher score.
          </em>
        }
      >
        <DepthMeter
          variant="settings"
          depth={depth}
          breakdown={breakdown}
        />
      </SettingsBlock>

      {/* 4 — Connections */}
      <SettingsBlock
        eyebrow="04"
        title="Connections"
        id="connections"
        intro={
          <em className="serif-i">
            up to two people whose presence shapes the reading. they do
            not see your readings; you do not see theirs.
          </em>
        }
      >
        <ConnectionList
          active={activeConnections}
          pending={pendingConnections}
        />

        {isSubscribed ? (
          canInvite ? (
            <div className="connection-invite-wrap">
              <p className="connection-invite-eyebrow">INVITE A CONNECTION</p>
              <InviteForm />
            </div>
          ) : (
            <p className="connection-limit-note">
              <em className="serif-i">
                two connections is the limit. disconnect one to add
                another.
              </em>
            </p>
          )
        ) : (
          <div className="settings-stub-cta connection-unsubscribed">
            <p className="connection-unsubscribed-line">
              <em className="serif-i">
                connections begin with the consulting room. enter to
                unlock the invite.
              </em>
            </p>
            <RowLink href="/consulting">enter the consulting room</RowLink>
          </div>
        )}
      </SettingsBlock>

      {/* 5 — Subscription */}
      <SettingsBlock eyebrow="05" title="Subscription">
        {isSubscribed ? (
          <dl className="account-list">
            <div className="account-row">
              <dt>plan</dt>
              <dd>consulting room — monthly</dd>
            </div>
            <div className="account-row">
              <dt>renews</dt>
              <dd>
                {subRes.data?.current_period_end
                  ? formatDate(subRes.data.current_period_end)
                  : "—"}
              </dd>
            </div>
            <div className="account-row">
              <dt>manage</dt>
              <dd>
                <form method="POST" action="/api/stripe/portal">
                  <button
                    type="submit"
                    className="auth-rowlink auth-rowlink-button"
                  >
                    <span>open the billing portal</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </form>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="settings-cta-row">
            <p className="settings-stub">
              no active subscription. the consulting room and one
              clinical report each month are gated behind it.
            </p>
            <CTA href="/consulting">Enter the consulting room</CTA>
          </div>
        )}
      </SettingsBlock>

      {/* 6 — Reports */}
      <SettingsBlock eyebrow="06" title="Reports">
        {reports.length === 0 ? (
          <p className="settings-stub">
            no reports yet. the first one is requested from the bottom
            of the readings page.
          </p>
        ) : (
          <ul className="reports-list">
            {reports.map((r) => (
              <li key={r.id} className="reports-row">
                <span className="reports-date">{formatDate(r.created_at)}</span>
                <span className="reports-kind">clinical report</span>
                <span className="reports-status">
                  {r.status === "ready" ? "ready" : r.status}
                </span>
                <span className="reports-link">
                  {r.status === "ready" && r.pdf_url ? (
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="auth-rowlink"
                    >
                      <span>download</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <Link
                      href={`/reports/${r.id}`}
                      className="auth-rowlink"
                    >
                      <span>open</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="settings-cta-row">
          <RowLink href="/readings#clinical-report">
            request a new report
          </RowLink>
        </div>
      </SettingsBlock>

      {/* 7 — Data */}
      <SettingsBlock
        eyebrow="07"
        title="Data"
        intro={
          <em className="serif-i">
            every reading, catchup, session, and report — yours, always.
          </em>
        }
      >
        <p className="settings-stub">
          export the full case file as a single PDF. preparation takes
          a few minutes; an email arrives when it is ready.
        </p>
        <div className="settings-cta-row">
          {/* Stub — actual export is a follow-up. */}
          <button type="button" className="settings-link-button" disabled>
            <span>export everything</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </SettingsBlock>

      {/* 8 — Email */}
      <SettingsBlock eyebrow="08" title="Email">
        <EmailToggles initial={emailPrefs} />
      </SettingsBlock>

      {/* 9 — Danger zone */}
      <SettingsBlock
        eyebrow="09"
        title="Danger zone"
        intro={
          <em className="serif-i">
            the only undoable action in the room.
          </em>
        }
      >
        <DangerZone />
      </SettingsBlock>

      <Hairline />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Merge original intake_responses (one row per step, payload jsonb)
// with the latest versioned edit per question from intake_answers.
// ────────────────────────────────────────────────────────────────────

function buildIntakeAnswers(
  responses: IntakeResponseRow[],
  edits: IntakeAnswerRow[],
): QuestionWithAnswer[] {
  // For each (question_key), keep the highest-version edit only. The
  // SELECT was ordered desc, so first wins.
  const latestEdit = new Map<string, AnswerValue>();
  for (const e of edits) {
    if (latestEdit.has(e.question_key)) continue;
    if (e.answer && "value" in e.answer) {
      latestEdit.set(e.question_key, e.answer.value);
    }
  }

  const responsesByStep = new Map<number, Record<string, unknown>>();
  for (const r of responses) {
    responsesByStep.set(r.step_number, r.payload ?? {});
  }

  const out: QuestionWithAnswer[] = [];
  for (const step of STEPS) {
    const payload = responsesByStep.get(step.number) ?? {};
    const allQs: AnyQuestion[] = [
      ...step.closeQuestions,
      ...step.openQuestions,
    ] as AnyQuestion[];
    for (const q of allQs) {
      // per_option_number is edited inside the intake itself.
      if (q.kind === "per_option_number") continue;
      const edited = latestEdit.get(q.id);
      const original = payload[q.id];
      const effective =
        edited !== undefined ? edited : (original as AnswerValue | undefined);
      out.push({
        question: q,
        answer: effective ?? null,
        stepNumber: step.number,
        stepSlug: step.slug,
        stepEyebrow: step.eyebrow,
      });
    }
  }
  return out;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

// ────────────────────────────────────────────────────────────────────
// Connection rows → display props for ConnectionList.
//
// Filters rows the user shouldn't see in their settings: ended /
// declined / expired entries belong to the case file, not Settings.
// The pending list shows only invites SENT by this user; we don't
// show invites they have received (they live at /invite/<token>).
// ────────────────────────────────────────────────────────────────────

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

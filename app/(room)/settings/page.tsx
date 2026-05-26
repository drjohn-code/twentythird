import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import SettingsBlock from "@/components/room/SettingsBlock";
import SettingsSaveStrip from "@/components/room/SettingsSaveStrip";
import DepthMeter, {
  type DepthSubBlock,
} from "@/components/room/DepthMeter";
import EmailToggles, {
  type EmailPreferences,
} from "@/components/room/EmailToggles";
import SubscriptionCard from "@/components/room/SubscriptionCard";
import DangerZone from "@/components/room/DangerZone";
import {
  loadDepthInputs,
  computeDepthBreakdown,
  depthStatusFor,
  type DepthBreakdown,
} from "@/lib/depth";
import type { DepthInputs } from "@/lib/depth";

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
  cancel_at_period_end: boolean | null;
};

const DEFAULT_EMAIL_PREFS: EmailPreferences = {
  weekly_catchup: true,
  consulting_session_reminder: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "08:00",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, metaRes, subscription] = await Promise.all([
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
    loadSubscriptionRow(supabase, user.id),
  ]);

  const inputs = await loadDepthInputs(user.id, supabase);
  const breakdown = computeDepthBreakdown(inputs);
  const { data: depthRow } = await supabase
    .from("users_meta")
    .select("reading_depth")
    .eq("user_id", user.id)
    .maybeSingle<{ reading_depth: number | null }>();
  const depth = depthRow?.reading_depth ?? 0;

  const subBlocks = buildDepthSubBlocks(inputs, breakdown);

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

  // Settings ordering:
  //   01  Account
  //   02  Reading depth
  //   03  Notifications  | 04  Subscription   ← two-column pair above 980px
  //   05  Danger zone
  // Reports moved to /readings and the Case File. Data export was
  // stubbed and removed.

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

      {/* Account */}
      <SettingsBlock title="Account" wideBody>
        <dl className="account-row-horizontal">
          <div className="account-cell">
            <dt>name</dt>
            <dd>{profile.full_name ?? "—"}</dd>
          </div>
          <div className="account-cell">
            <dt>email</dt>
            <dd className="account-cell-with-edit">
              <span title={profile.email ?? undefined}>
                {profile.email ?? "—"}
              </span>
              <Link href="/auth/change-email" className="auth-rowlink">
                <span>change</span>
                <span aria-hidden="true">→</span>
              </Link>
            </dd>
          </div>
          <div className="account-cell">
            <dt>birth year</dt>
            <dd>{profile.birth_year ?? "—"}</dd>
          </div>
          <div className="account-cell">
            <dt>language</dt>
            <dd>
              <span>english</span>
              <span className="account-row-note">
                more locales arrive in next version.
              </span>
            </dd>
          </div>
        </dl>
        {locale !== "en" ? null : null}
      </SettingsBlock>

      {/* Reading depth — consolidates the old per-source breakdown and
          the old standalone Connections section. */}
      <SettingsBlock title="Reading depth" id="depth" wideBody>
        <DepthMeter
          variant="settings"
          depth={depth}
          subBlocks={subBlocks}
        />
      </SettingsBlock>

      {/* Notifications + Subscription — two-column pair (stacks below 980px). */}
      <div className="settings-pair">
        <SettingsBlock title="Notifications" id="notifications">
          <EmailToggles initial={emailPrefs} />
        </SettingsBlock>

        <SettingsBlock title="Subscription" id="subscription">
          <SubscriptionCard subscription={subscription} />
        </SettingsBlock>
      </div>

      {/* Danger zone — last section, no closing hairline. */}
      <section className="settings-block settings-block-danger">
        <header className="settings-block-head">
          <h2 className="settings-block-h">Danger zone</h2>
          <p className="settings-block-intro">
            <em className="serif-i">
              the only undoable action in the room.
            </em>
          </p>
        </header>
        <DangerZone />
      </section>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Subscription row loader.
//
// The `cancel_at_period_end` column lands in a separate migration. If
// the deploy order slips (code first, schema later) the wide select
// throws PostgREST 42703 and the whole row disappears — which would
// silently flip active subscribers back to "not subscribed." Detect
// that one error and refetch the legacy columns, defaulting the new
// flag to false. Real read failures still surface as a null row.
// ────────────────────────────────────────────────────────────────────

async function loadSubscriptionRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionRow | null> {
  const wide = await supabase
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();
  if (!wide.error) return wide.data;
  if (wide.error.code !== "42703") return null;

  const legacy = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<Omit<SubscriptionRow, "cancel_at_period_end">>();
  if (legacy.error || !legacy.data) return null;
  return { ...legacy.data, cancel_at_period_end: false };
}

// ────────────────────────────────────────────────────────────────────
// Build the four sub-blocks shown in the Reading Depth 2×2 grid.
// Caption + CTA label are derived from the inputs the depth math
// already loads, so we never re-query.
// ────────────────────────────────────────────────────────────────────

function buildDepthSubBlocks(
  inputs: DepthInputs,
  breakdown: DepthBreakdown[],
): DepthSubBlock[] {
  const byLabel = new Map(breakdown.map((b) => [b.label, b] as const));
  const ratioFor = (label: DepthBreakdown["label"]) => {
    const row = byLabel.get(label);
    if (!row || row.max <= 0) return 0;
    return Math.max(0, Math.min(1, row.value / row.max));
  };

  // Intake — count of open + closed answered against rough totals.
  const intakeAnswered =
    inputs.onboardingClosedAnswered + inputs.onboardingOpenAnswered;
  const intakeTotal =
    inputs.onboardingClosedTotal + inputs.onboardingOpenTotal;
  const intakeRatio = ratioFor("intake");
  const intakeCta = (() => {
    if (intakeAnswered === 0) return "Complete your intake";
    if (intakeRatio < 0.66) return "Add more detail";
    return "Review your intake";
  })();

  // Catchups — recent count + recency.
  const catchupsRatio = ratioFor("catchups");
  const catchupsCta = (() => {
    if (inputs.recentCatchupCount === 0) return "Add a catchup";
    if (
      inputs.daysSinceLastCatchup === null ||
      inputs.daysSinceLastCatchup >= 7
    ) {
      return "Complete this week's catchup";
    }
    return "Review past catchups";
  })();

  // Sessions — count of closed sessions.
  const sessionsRatio = ratioFor("sessions");
  const sessionsCta = (() => {
    if (inputs.completedSessionCount === 0) return "Start a consultation";
    if (sessionsRatio < 0.66) return "Continue a consultation";
    return "Review past sessions";
  })();

  // Connections — count of active connections.
  const connectionsRatio = ratioFor("connections");
  const connectionsCta = (() => {
    if (inputs.activeConnectionCount === 0) return "Add a connection";
    if (inputs.activeConnectionCount === 1) return "Add another connection";
    return "Review your connections";
  })();

  return [
    {
      source: "intake",
      title: "Your intake",
      ratio: intakeRatio,
      status: depthStatusFor(intakeRatio),
      caption: `${intakeAnswered} / ${intakeTotal} answered`,
      cta: { label: intakeCta, href: "/intake" },
    },
    {
      source: "catchups",
      title: "Catchups",
      ratio: catchupsRatio,
      status: depthStatusFor(catchupsRatio),
      caption: `${inputs.recentCatchupCount} in last 8 wks`,
      cta: { label: catchupsCta, href: "/catchup" },
    },
    {
      source: "sessions",
      title: "Sessions",
      ratio: sessionsRatio,
      status: depthStatusFor(sessionsRatio),
      caption: `${inputs.completedSessionCount} completed`,
      cta: { label: sessionsCta, href: "/consulting" },
    },
    {
      source: "connections",
      title: "Connections",
      ratio: connectionsRatio,
      status: depthStatusFor(connectionsRatio),
      caption: `${inputs.activeConnectionCount} active`,
      cta: { label: connectionsCta, href: "/connections" },
    },
  ];
}


import { getTranslations } from "next-intl/server";
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
import AccountFields from "@/components/room/settings/AccountFields";
import { loadSubscriptionRow } from "@/lib/subscription";
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

const DEFAULT_EMAIL_PREFS: EmailPreferences = {
  weekly_catchup: true,
  consulting_session_reminder: true,
  connection_requests: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "08:00",
};

export default async function SettingsPage() {
  const t = await getTranslations("settings");
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

  const subBlocks = buildDepthSubBlocks(inputs, breakdown, t);

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
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="settings-h">
          {t.rich("heading", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
        </h1>
        <p className="lede settings-lede">{t("lede")}</p>
      </Reveal>

      {/* Account */}
      <SettingsBlock title={t("blocks.account")} wideBody>
        <AccountFields
          fullName={profile.full_name ?? ""}
          email={profile.email ?? user.email ?? ""}
          birthYear={profile.birth_year}
          locale={locale}
        />
      </SettingsBlock>

      {/* Reading depth — consolidates the old per-source breakdown and
          the old standalone Connections section. */}
      <SettingsBlock title={t("blocks.readingDepth")} id="depth" wideBody>
        <DepthMeter
          variant="settings"
          depth={depth}
          subBlocks={subBlocks}
        />
      </SettingsBlock>

      {/* Notifications + Subscription — two-column pair (stacks below 980px). */}
      <div className="settings-pair">
        <SettingsBlock title={t("blocks.notifications")} id="notifications">
          <EmailToggles initial={emailPrefs} />
        </SettingsBlock>

        <SettingsBlock title={t("blocks.subscription")} id="subscription">
          <SubscriptionCard subscription={subscription} />
        </SettingsBlock>
      </div>

      {/* Danger zone — last section, no closing hairline. */}
      <section className="settings-block settings-block-danger">
        <header className="settings-block-head">
          <h2 className="settings-block-h">{t("blocks.dangerZone")}</h2>
          <p className="settings-block-intro">
            <em className="serif-i">{t("dangerZoneIntro")}</em>
          </p>
        </header>
        <DangerZone />
      </section>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Build the four sub-blocks shown in the Reading Depth 2×2 grid.
// Caption + CTA label are derived from the inputs the depth math
// already loads, so we never re-query.
// ────────────────────────────────────────────────────────────────────

function buildDepthSubBlocks(
  inputs: DepthInputs,
  breakdown: DepthBreakdown[],
  t: Awaited<ReturnType<typeof getTranslations<"settings">>>,
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
    if (intakeAnswered === 0) return t("depthSub.intake.ctaEmpty");
    if (intakeRatio < 0.66) return t("depthSub.intake.ctaPartial");
    return t("depthSub.intake.ctaFull");
  })();

  // Catchups — recent count + recency.
  const catchupsRatio = ratioFor("catchups");
  const catchupsCta = (() => {
    if (inputs.recentCatchupCount === 0) return t("depthSub.catchups.ctaEmpty");
    if (
      inputs.daysSinceLastCatchup === null ||
      inputs.daysSinceLastCatchup >= 7
    ) {
      return t("depthSub.catchups.ctaDue");
    }
    return t("depthSub.catchups.ctaFull");
  })();

  // Sessions — count of closed sessions.
  const sessionsRatio = ratioFor("sessions");
  const sessionsCta = (() => {
    if (inputs.completedSessionCount === 0) return t("depthSub.sessions.ctaEmpty");
    if (sessionsRatio < 0.66) return t("depthSub.sessions.ctaPartial");
    return t("depthSub.sessions.ctaFull");
  })();

  // Connections — count of active connections.
  const connectionsRatio = ratioFor("connections");
  const connectionsCta = (() => {
    if (inputs.activeConnectionCount === 0)
      return t("depthSub.connections.ctaEmpty");
    if (inputs.activeConnectionCount === 1)
      return t("depthSub.connections.ctaSingle");
    return t("depthSub.connections.ctaFull");
  })();

  return [
    {
      source: "intake",
      title: t("depthSub.intake.title"),
      ratio: intakeRatio,
      status: depthStatusFor(intakeRatio),
      caption: t("depthSub.intake.caption", {
        answered: intakeAnswered,
        total: intakeTotal,
      }),
      cta: { label: intakeCta, href: "/intake" },
    },
    {
      source: "catchups",
      title: t("depthSub.catchups.title"),
      ratio: catchupsRatio,
      status: depthStatusFor(catchupsRatio),
      caption: t("depthSub.catchups.caption", {
        count: inputs.recentCatchupCount,
      }),
      cta: { label: catchupsCta, href: "/catchup" },
    },
    {
      source: "sessions",
      title: t("depthSub.sessions.title"),
      ratio: sessionsRatio,
      status: depthStatusFor(sessionsRatio),
      caption: t("depthSub.sessions.caption", {
        count: inputs.completedSessionCount,
      }),
      cta: { label: sessionsCta, href: "/consulting" },
    },
    {
      source: "connections",
      title: t("depthSub.connections.title"),
      ratio: connectionsRatio,
      status: depthStatusFor(connectionsRatio),
      caption: t("depthSub.connections.caption", {
        count: inputs.activeConnectionCount,
      }),
      cta: { label: connectionsCta, href: "/connections" },
    },
  ];
}


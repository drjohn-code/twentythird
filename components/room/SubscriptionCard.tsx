// SubscriptionCard — three-state subscription panel on /settings.
//
// The shell padding / heading / border come from <SettingsBlock>; this
// component only renders the body. Three terminal UIs:
//
//   not subscribed   → member badge, tagline, feature grid, price + CTA
//   active           → STATUS row + "Cancel subscription" link-button
//   cancelled (paid) → STATUS row + "Resubscribe" primary button
//
// State (cancelled but still in paid period) is detected from the
// subscriptions row's `cancel_at_period_end` flag — which the Stripe
// webhook persists alongside `status` and `current_period_end`.
//
// The connection-bonus number on the NoneBody feature grid reads from
// SUBSCRIBER_BONUS_CONNECTIONS so changing the constant updates the
// member-benefit line everywhere automatically.

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SUBSCRIBER_BONUS_CONNECTIONS } from "@/lib/connections";
import type { Entitlement } from "@/lib/entitlements";

type SettingsT = Awaited<ReturnType<typeof getTranslations<"settings">>>;

export type SubscriptionCardRow = {
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

type Props = {
  subscription: SubscriptionCardRow | null;
  entitlement: Entitlement;
};

type ResolvedState =
  | { kind: "none" }
  | { kind: "active"; renewsInDays: number }
  | { kind: "cancelled_in_period"; accessUntil: string }
  | { kind: "trial"; daysRemaining: number };

function resolveState(
  row: SubscriptionCardRow | null,
  entitlement: Entitlement,
): ResolvedState {
  if (row) {
    const status = row.status ?? null;
    const periodEnd = row.current_period_end
      ? new Date(row.current_period_end)
      : null;
    const periodEndValid = periodEnd && !Number.isNaN(periodEnd.getTime());
    const inFuture = periodEndValid ? periodEnd.getTime() > Date.now() : false;

    if (status === "active" && row.cancel_at_period_end && inFuture) {
      return { kind: "cancelled_in_period", accessUntil: formatDate(periodEnd!) };
    }
    if (status === "active" || status === "trialing") {
      const days = periodEndValid ? daysUntil(periodEnd!) : 0;
      return { kind: "active", renewsInDays: Math.max(0, days) };
    }
  }
  // Not subscribed (or no row at all) — trialing takes over the card
  // until the trial closes, then falls through to the free-tier body.
  if (entitlement.reason === "trial" && entitlement.trialDaysRemaining !== null) {
    return { kind: "trial", daysRemaining: entitlement.trialDaysRemaining };
  }
  return { kind: "none" };
}

export default async function SubscriptionCard({
  subscription,
  entitlement,
}: Props) {
  const t = await getTranslations("settings");
  const state = resolveState(subscription, entitlement);

  if (state.kind === "active")
    return <ActiveBody days={state.renewsInDays} t={t} />;
  if (state.kind === "cancelled_in_period")
    return <CancelledBody accessUntil={state.accessUntil} t={t} />;
  if (state.kind === "trial")
    return <TrialBody daysRemaining={state.daysRemaining} t={t} />;
  return <NoneBody t={t} />;
}

function StatusRow({ value, t }: { value: string; t: SettingsT }) {
  return (
    <div className="subscription-status">
      <span className="subscription-status-label">
        {t("subscription.statusLabel")}
      </span>
      <span className="subscription-status-value">{value}</span>
    </div>
  );
}

function NoneBody({ t }: { t: SettingsT }) {
  return (
    <div className="subscription-body subscription-body-none">
      <p className="subscription-badge">{t("subscription.badge")}</p>

      <p className="subscription-tagline">
        {t.rich("subscription.tagline", {
          em: (chunks) => <em>{chunks}</em>,
        })}
      </p>

      <ul className="subscription-feature-grid">
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              {t("subscription.features.room.title")}
            </span>
            <span className="subscription-feature-desc">
              {t("subscription.features.room.desc")}
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              {t("subscription.features.report.title")}
            </span>
            <span className="subscription-feature-desc">
              {t("subscription.features.report.desc")}
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              {t("subscription.features.connections.title", {
                count: SUBSCRIBER_BONUS_CONNECTIONS,
              })}
            </span>
            <span className="subscription-feature-desc">
              {t("subscription.features.connections.desc")}
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              {t("subscription.features.depth.title")}
            </span>
            <span className="subscription-feature-desc">
              {t("subscription.features.depth.desc")}
            </span>
          </div>
        </li>
      </ul>

      <form
        action="/api/stripe/checkout"
        method="post"
        className="subscription-cta-stack"
      >
        <input type="hidden" name="kind" value="subscription" />

        <div className="subscription-price">
          <span className="subscription-price-amount">€23.23</span>
          <span className="subscription-price-period">
            {t("subscription.perMonth")}
          </span>
        </div>

        <button
          type="submit"
          className="subscription-primary subscription-primary-wide"
        >
          {t("subscription.subscribe")}
        </button>

        <p className="subscription-reassurance">
          {t.rich("subscription.reassurance", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </p>
      </form>
    </div>
  );
}

function ActiveBody({ days, t }: { days: number; t: SettingsT }) {
  const value =
    days <= 0
      ? t("subscription.activeToday")
      : t("subscription.activeRenews", { days });
  return (
    <div className="subscription-body">
      <StatusRow value={value} t={t} />
      <form action="/api/stripe/portal" method="post" className="subscription-actions">
        <button type="submit" className="subscription-secondary">
          {t("subscription.cancel")}
        </button>
      </form>
    </div>
  );
}

function TrialBody({
  daysRemaining,
  t,
}: {
  daysRemaining: number;
  t: SettingsT;
}) {
  return (
    <div className="subscription-body">
      <StatusRow value={t("subscription.trial.status", { days: daysRemaining })} t={t} />
      <p className="subscription-tagline">{t("subscription.trial.lede", { days: daysRemaining })}</p>
      <div className="subscription-actions">
        <Link href="/subscribe/confirm" className="subscription-secondary">
          {t("subscription.trial.subscribe")}
        </Link>
      </div>
    </div>
  );
}

function CancelledBody({
  accessUntil,
  t,
}: {
  accessUntil: string;
  t: SettingsT;
}) {
  return (
    <div className="subscription-body">
      <StatusRow value={t("subscription.cancelled", { date: accessUntil })} t={t} />
      <form action="/api/stripe/portal" method="post" className="subscription-actions">
        <button type="submit" className="subscription-primary">
          {t("subscription.resubscribe")}
        </button>
      </form>
    </div>
  );
}

function daysUntil(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

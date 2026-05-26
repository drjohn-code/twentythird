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

import { SUBSCRIBER_BONUS_CONNECTIONS } from "@/lib/connections";

export type SubscriptionCardRow = {
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

type Props = {
  subscription: SubscriptionCardRow | null;
};

type ResolvedState =
  | { kind: "none" }
  | { kind: "active"; renewsInDays: number }
  | { kind: "cancelled_in_period"; accessUntil: string };

function resolveState(row: SubscriptionCardRow | null): ResolvedState {
  if (!row) return { kind: "none" };
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
  return { kind: "none" };
}

export default function SubscriptionCard({ subscription }: Props) {
  const state = resolveState(subscription);

  if (state.kind === "active") return <ActiveBody days={state.renewsInDays} />;
  if (state.kind === "cancelled_in_period")
    return <CancelledBody accessUntil={state.accessUntil} />;
  return <NoneBody />;
}

function StatusRow({ value }: { value: string }) {
  return (
    <div className="subscription-status">
      <span className="subscription-status-label">STATUS</span>
      <span className="subscription-status-value">{value}</span>
    </div>
  );
}

function NoneBody() {
  return (
    <div className="subscription-body subscription-body-none">
      <p className="subscription-badge">MEMBER ACCESS</p>

      <p className="subscription-tagline">
        The consulting room, opened. <em>A reading that keeps reading.</em>
      </p>

      <ul className="subscription-feature-grid">
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              Consulting room
            </span>
            <span className="subscription-feature-desc">
              long-form sessions with the analyst.
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              Monthly clinical report
            </span>
            <span className="subscription-feature-desc">
              one therapist-ready map each calendar month.
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              {SUBSCRIBER_BONUS_CONNECTIONS} more connections
            </span>
            <span className="subscription-feature-desc">
              add the people whose presence shapes the reading.
            </span>
          </div>
        </li>
        <li className="subscription-feature">
          <span className="subscription-feature-dot" aria-hidden="true" />
          <div className="subscription-feature-text">
            <span className="subscription-feature-title">
              Full reading depth
            </span>
            <span className="subscription-feature-desc">
              every chapter open, no ceiling on detail.
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
          <span className="subscription-price-period">per month</span>
        </div>

        <button
          type="submit"
          className="subscription-primary subscription-primary-wide"
        >
          subscribe
        </button>

        <p className="subscription-reassurance">
          <em>no commitment.</em> cancel anytime from settings.
        </p>
      </form>
    </div>
  );
}

function ActiveBody({ days }: { days: number }) {
  const value =
    days <= 0
      ? "active — renews today"
      : days === 1
        ? "active — renews in 1 day"
        : `active — renews in ${days} days`;
  return (
    <div className="subscription-body">
      <StatusRow value={value} />
      <form action="/api/stripe/portal" method="post" className="subscription-actions">
        <button type="submit" className="subscription-secondary">
          cancel subscription
        </button>
      </form>
    </div>
  );
}

function CancelledBody({ accessUntil }: { accessUntil: string }) {
  return (
    <div className="subscription-body">
      <StatusRow value={`cancelled — access until ${accessUntil}`} />
      <form action="/api/stripe/portal" method="post" className="subscription-actions">
        <button type="submit" className="subscription-primary">
          resubscribe
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

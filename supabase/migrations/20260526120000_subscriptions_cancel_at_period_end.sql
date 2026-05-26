-- Subscriptions: track `cancel_at_period_end`.
--
-- Stripe keeps a subscription's status as "active" between the moment
-- the user requests cancellation in the billing portal and the actual
-- period rollover; the distinction lives in a separate `cancel_at_period_end`
-- flag on the Subscription object. The Settings page needs to surface
-- three states (subscribed, cancelled-but-in-paid-period, not subscribed),
-- so we mirror the flag locally instead of round-tripping to Stripe on
-- every settings render.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

-- Email system — Phase 6 / transactional scheduling.
--
-- One table for every delayed or recurring transactional email. The
-- scheduler at /api/internal/run-scheduled-emails drains it 50 rows per
-- minute (Vercel Cron). A row is pending while sent_at is null and
-- failed_at is null; the scheduler picks the oldest send_after rows in
-- that state, attempts a send, and writes sent_at on success or
-- failed_at + failure_reason after the 6h retry window expires.
--
-- RLS is enabled with NO authenticated policy by design — every read
-- and write goes through the service role. There is no user-facing
-- query path.
--
-- Idempotency lives at the table layer, not via Resend headers — the
-- (sent_at is null) check is the only guard. A crash between Resend
-- accepting the message and us writing sent_at will retry on the next
-- tick, which is an acceptable double-send risk for this iteration.
-- TODO: Resend idempotency-key for true exactly-once delivery.

create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'room_ready',
    'weekly_catchup_reminder',
    'onboarding_resume'
  )),
  payload jsonb not null default '{}'::jsonb,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Scheduler drain index: cheap fetch of the next batch of pending rows
-- ordered by their send_after.
create index if not exists scheduled_emails_pending_idx
  on public.scheduled_emails (send_after)
  where sent_at is null and failed_at is null;

-- Per-user lookup used by the onboarding-resume upsert path
-- (pending row exists? bump send_after instead of inserting).
create index if not exists scheduled_emails_user_kind_pending_idx
  on public.scheduled_emails (user_id, kind)
  where sent_at is null and failed_at is null;

-- Weekly-catchup-reminder uniqueness: at most one *successfully sent*
-- reminder per (user, ISO-week-string). The payload carries an
-- 'iso_week' field like '2026-W21'. Failed attempts may coexist; a
-- successful send seals the (user, week) pair.
create unique index if not exists scheduled_emails_weekly_catchup_unique
  on public.scheduled_emails (user_id, (payload->>'iso_week'))
  where kind = 'weekly_catchup_reminder' and sent_at is not null;

alter table public.scheduled_emails enable row level security;

-- Intentionally no policies. Service-role-only — the scheduler route
-- uses adminClient() and never queries from the browser.

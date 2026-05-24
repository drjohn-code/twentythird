-- AI observability + safety.
--
-- Adds:
--   - ai_calls table: every router call logs token counts, duration,
--     status, cost. No prompt or completion text is ever stored.
--   - safety_flags table: surfaced when the safety classifier rates
--     intake / catchup / session input at medium or higher.
--   - reports.safety_summary: textual summary of clinical priorities
--     written at report generation time.
--   - connections.context_summary: per-connection paragraph used to
--     inject relational context into session / catchup / report.
--   - users_meta.initial_readings_status: state machine for the
--     post-intake reading generation (separate from intake_status,
--     which belongs to onboarding).
--   - block_readings.lede: cached long-form lede rendered on
--     /readings. Regenerated when readings shift materially.
--   - catchups.status / catchups.feedback: catchup is now processed
--     asynchronously after submit; the runner polls until ready and
--     feedback carries the consider / recommend block.
--   - case_file_entries view: extended to include high/critical
--     safety flags as their own entry kind.

------------------------------------------------------------
-- ai_calls
--
-- Reads are service-role only (no user-facing query needed). RLS is
-- enabled so the table is unreachable from the anon/auth context.
------------------------------------------------------------
create table if not exists public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  task text not null,
  model text not null,
  prompt_tokens int,
  completion_tokens int,
  cost_usd numeric(10,6),
  duration_ms int,
  status text not null
    check (status in ('ok','error','timeout','parse_error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_calls_user_created_idx
  on public.ai_calls (user_id, created_at desc);
create index if not exists ai_calls_task_created_idx
  on public.ai_calls (task, created_at desc);

alter table public.ai_calls enable row level security;
-- No policies — the table is service-role only. Authenticated users
-- cannot SELECT, INSERT, UPDATE, or DELETE.

------------------------------------------------------------
-- safety_flags
--
-- Written by the safety classifier when severity >= medium. Read by
-- the owning user (they can see their own flags) and surfaced in the
-- Case File for high/critical entries.
------------------------------------------------------------
create table if not exists public.safety_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('intake','catchup','session')),
  source_id uuid,
  severity text not null
    check (severity in ('low','medium','high','critical')),
  categories text[] not null default '{}'::text[],
  excerpt text,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists safety_flags_user_created_idx
  on public.safety_flags (user_id, created_at desc);
create index if not exists safety_flags_user_severity_idx
  on public.safety_flags (user_id, severity);

alter table public.safety_flags enable row level security;

drop policy if exists "safety_flags: select own" on public.safety_flags;
create policy "safety_flags: select own"
  on public.safety_flags for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts and updates flow through service-role route handlers; no
-- authenticated write policy by design.

------------------------------------------------------------
-- reports.safety_summary
------------------------------------------------------------
alter table public.reports
  add column if not exists safety_summary text;

------------------------------------------------------------
-- connections.context_summary
------------------------------------------------------------
alter table public.connections
  add column if not exists context_summary text;

------------------------------------------------------------
-- users_meta.initial_readings_status
------------------------------------------------------------
alter table public.users_meta
  add column if not exists initial_readings_status text
    not null default 'pending'
    check (initial_readings_status in ('pending','generating','ready','failed'));

------------------------------------------------------------
-- block_readings.lede
------------------------------------------------------------
alter table public.block_readings
  add column if not exists lede text;

------------------------------------------------------------
-- catchups.status, catchups.feedback
------------------------------------------------------------
alter table public.catchups
  add column if not exists status text
    not null default 'ready'
    check (status in ('processing','ready','failed'));

alter table public.catchups
  add column if not exists feedback jsonb;

------------------------------------------------------------
-- case_file_entries view — extended with safety_flag entries (high
-- and critical only). Low/medium flags stay out of the view.
------------------------------------------------------------
create or replace view public.case_file_entries
with (security_invoker = true)
as
  select
    c.user_id,
    c.id as entry_id,
    'catchup'::text as entry_kind,
    'Catchup · week ' || lpad(c.week_number::text, 2, '0') as entry_title,
    coalesce(c.summary, '') as entry_summary,
    c.created_at as occurred_at
  from public.catchups c
  union all
  select
    s.user_id,
    s.id as entry_id,
    'session'::text as entry_kind,
    coalesce(s.topic, 'Consultation') as entry_title,
    coalesce(s.held_question, '') as entry_summary,
    coalesce(s.closed_at, s.created_at) as occurred_at
  from public.sessions s
  union all
  select
    r.user_id,
    r.id as entry_id,
    'report'::text as entry_kind,
    'Clinical report' as entry_title,
    'Status · ' || r.status as entry_summary,
    r.created_at as occurred_at
  from public.reports r
  union all
  select
    b.user_id,
    b.id as entry_id,
    'reading'::text as entry_kind,
    'Intake reading · ' || b.block_slug as entry_title,
    b.reading as entry_summary,
    b.created_at as occurred_at
  from public.block_readings b
  where b.version = 1
  union all
  select
    c.inviter_user_id as user_id,
    c.id as entry_id,
    'connection'::text as entry_kind,
    'Connection · ' || c.role as entry_title,
    coalesce(c.connection_first_name, c.connection_email) as entry_summary,
    coalesce(c.accepted_at, c.created_at) as occurred_at
  from public.connections c
  where c.status in ('active','ended')
  union all
  select
    f.user_id,
    f.id as entry_id,
    'safety_flag'::text as entry_kind,
    'Clinical priority · ' || f.severity as entry_title,
    coalesce(f.excerpt, array_to_string(f.categories, ', ')) as entry_summary,
    f.created_at as occurred_at
  from public.safety_flags f
  where f.severity in ('high','critical');

-- Existing users predate this migration. Mark them as 'ready' since
-- their v1 readings exist and we have no intake to re-process. Pending
-- only applies to users created on or after this migration who have
-- not yet had the initial generation run.
update public.users_meta
  set initial_readings_status = 'ready'
  where initial_readings_status = 'pending';

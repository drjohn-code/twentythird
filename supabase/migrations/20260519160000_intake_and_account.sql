-- Extends the profile + onboarding model added in
-- 20260519100000_profiles_and_onboarding.sql.
--
-- Adds the account-setup columns (name was already there as full_name;
-- birth year, gender, terms acceptance and the account-initiated
-- timestamp are new), the intake completion fields, and two new tables
-- that hold the long-form intake responses and the queued analysis
-- jobs.
--
-- The legacy onboarding_responses table from the previous migration is
-- left in place but unused by the new flow. Nothing reads or writes it
-- after this migration ships; it can be dropped in a future migration
-- once we are sure no rows of value were ever written.

------------------------------------------------------------
-- profiles: account + intake state
------------------------------------------------------------

alter table public.profiles
  add column if not exists birth_year int
    check (birth_year between 1900 and extract(year from now())::int - 13);

alter table public.profiles
  add column if not exists gender text
    check (gender in ('male','female','non_binary','prefer_not_to_say'));

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

alter table public.profiles
  add column if not exists account_initiated_at timestamptz;

alter table public.profiles
  add column if not exists intake_submitted_at timestamptz;

alter table public.profiles
  add column if not exists intake_status text
    not null default 'not_started'
    check (intake_status in ('not_started','in_progress','processing','ready','failed'));

------------------------------------------------------------
-- intake_responses: one row per (user, step)
------------------------------------------------------------

create table if not exists public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  step_number smallint not null check (step_number between 1 and 10),
  step_slug text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, step_number)
);

create index if not exists intake_responses_user_id_idx
  on public.intake_responses (user_id);

alter table public.intake_responses enable row level security;

drop policy if exists "intake_responses: select own" on public.intake_responses;
create policy "intake_responses: select own"
  on public.intake_responses for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "intake_responses: insert own" on public.intake_responses;
create policy "intake_responses: insert own"
  on public.intake_responses for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "intake_responses: update own" on public.intake_responses;
create policy "intake_responses: update own"
  on public.intake_responses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists intake_responses_set_updated_at on public.intake_responses;
create trigger intake_responses_set_updated_at
  before update on public.intake_responses
  for each row execute function public.set_updated_at();

------------------------------------------------------------
-- analysis_jobs: queued jobs for the (out-of-scope) worker
-- Inserts happen via the service-role client inside submitIntake,
-- so there is no insert policy for authenticated users.
------------------------------------------------------------

create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued','running','done','failed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists analysis_jobs_user_id_idx
  on public.analysis_jobs (user_id);

alter table public.analysis_jobs enable row level security;

drop policy if exists "analysis_jobs: select own" on public.analysis_jobs;
create policy "analysis_jobs: select own"
  on public.analysis_jobs for select
  to authenticated
  using (auth.uid() = user_id);

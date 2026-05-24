-- Room: dashboard schema.
--
-- Adds every table, index, and RLS policy that backs the authenticated
-- /room experience (six analytic readings, weekly catchups, consulting
-- sessions, clinical reports, subscriptions, and connections).
--
-- Also creates the case_file_entries view (union across catchups,
-- sessions, reports, intake-version readings, and connection events)
-- and patches handle_new_user() to seed a users_meta row and twelve
-- v1 block_readings rows for every auth.users row — both for new
-- signups (trigger) and for users that pre-date this migration
-- (backfill at the bottom).

------------------------------------------------------------
-- users_meta
------------------------------------------------------------
create table if not exists public.users_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'en',
  reading_depth numeric not null default 0
    check (reading_depth >= 0 and reading_depth <= 1),
  reading_depth_computed_at timestamptz,
  is_connection_only boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users_meta enable row level security;

drop policy if exists "users_meta: select own" on public.users_meta;
create policy "users_meta: select own"
  on public.users_meta for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users_meta: insert own" on public.users_meta;
create policy "users_meta: insert own"
  on public.users_meta for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users_meta: update own" on public.users_meta;
create policy "users_meta: update own"
  on public.users_meta for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- intake_answers
--
-- Edits supersede via new (user_id, question_key, version+1) rows;
-- prior versions stay for the case file. Current value at any time is
-- the row with max(version) per (user_id, question_key).
------------------------------------------------------------
create table if not exists public.intake_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists intake_answers_uqv_idx
  on public.intake_answers (user_id, question_key, version desc);

alter table public.intake_answers enable row level security;

drop policy if exists "intake_answers: select own" on public.intake_answers;
create policy "intake_answers: select own"
  on public.intake_answers for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "intake_answers: insert own" on public.intake_answers;
create policy "intake_answers: insert own"
  on public.intake_answers for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "intake_answers: update own" on public.intake_answers;
create policy "intake_answers: update own"
  on public.intake_answers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- block_readings
--
-- One row per (user, slug, version). Current reading where
-- superseded_at is null. Twelve slugs per user (six dashboard, six
-- report-only) — seeded by handle_new_user() and the backfill at the
-- bottom.
------------------------------------------------------------
create table if not exists public.block_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  block_slug text not null,
  reading text not null,
  takeaway text not null,
  definition text not null,
  weight numeric not null default 0.5
    check (weight >= 0 and weight <= 1),
  version int not null default 1,
  last_refined_source text,
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists block_readings_usv_idx
  on public.block_readings (user_id, block_slug, version desc);

alter table public.block_readings enable row level security;

drop policy if exists "block_readings: select own" on public.block_readings;
create policy "block_readings: select own"
  on public.block_readings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "block_readings: insert own" on public.block_readings;
create policy "block_readings: insert own"
  on public.block_readings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "block_readings: update own" on public.block_readings;
create policy "block_readings: update own"
  on public.block_readings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- catchups
------------------------------------------------------------
create table if not exists public.catchups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number int not null,
  answers jsonb not null default '{}'::jsonb,
  summary text,
  created_at timestamptz not null default now()
);
create index if not exists catchups_user_created_idx
  on public.catchups (user_id, created_at desc);

alter table public.catchups enable row level security;

drop policy if exists "catchups: select own" on public.catchups;
create policy "catchups: select own"
  on public.catchups for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "catchups: insert own" on public.catchups;
create policy "catchups: insert own"
  on public.catchups for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "catchups: update own" on public.catchups;
create policy "catchups: update own"
  on public.catchups for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- sessions (consulting sessions, not auth sessions)
------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text,
  held_question text not null default '',
  transcript jsonb not null default '[]'::jsonb,
  closed_at timestamptz,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_created_idx
  on public.sessions (user_id, created_at desc);

alter table public.sessions enable row level security;

drop policy if exists "sessions: select own" on public.sessions;
create policy "sessions: select own"
  on public.sessions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sessions: insert own" on public.sessions;
create policy "sessions: insert own"
  on public.sessions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "sessions: update own" on public.sessions;
create policy "sessions: update own"
  on public.sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- reports
------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'clinical',
  status text not null default 'queued'
    check (status in ('queued','generating','ready','failed')),
  pdf_url text,
  depth_at_generation numeric,
  created_at timestamptz not null default now()
);
create index if not exists reports_user_created_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports: select own" on public.reports;
create policy "reports: select own"
  on public.reports for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reports: insert own" on public.reports;
create policy "reports: insert own"
  on public.reports for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reports: update own" on public.reports;
create policy "reports: update own"
  on public.reports for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

------------------------------------------------------------
-- subscriptions
--
-- Reads are user-scoped. All writes happen through the Stripe webhook
-- using the service role — no authenticated insert/update policy is
-- needed (or wanted).
------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: select own" on public.subscriptions;
create policy "subscriptions: select own"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

------------------------------------------------------------
-- connections
--
-- A row is visible to both parties (inviter and connection). All
-- mutations (invite, accept, decline, end, resend) flow through route
-- handlers using the service role — no authenticated write policy.
------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  connection_user_id uuid references auth.users(id) on delete set null,
  connection_email text not null,
  connection_first_name text,
  role text not null check (role in
    ('partner','closest_friend','parent','sibling','co_parent')),
  note text,
  invite_token text not null unique,
  status text not null default 'pending'
    check (status in ('pending','active','declined','expired','ended')),
  accepted_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists connections_inviter_status_idx
  on public.connections (inviter_user_id, status);
create index if not exists connections_connection_status_idx
  on public.connections (connection_user_id, status);

alter table public.connections enable row level security;

drop policy if exists "connections: select own party" on public.connections;
create policy "connections: select own party"
  on public.connections for select
  to authenticated
  using (auth.uid() = inviter_user_id or auth.uid() = connection_user_id);

------------------------------------------------------------
-- relationship_intake_answers
--
-- access is mediated by the connection — inviter never queries raw rows directly
--
-- The invitee writes their answers. Only the invitee may read or write
-- these rows directly. The inviter has no API endpoint that returns
-- them — only the derived effect on their own readings.
------------------------------------------------------------
create table if not exists public.relationship_intake_answers (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  question_key text not null,
  answer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists relationship_intake_answers_conn_idx
  on public.relationship_intake_answers (connection_id);

alter table public.relationship_intake_answers enable row level security;

drop policy if exists "relationship_intake_answers: invitee select"
  on public.relationship_intake_answers;
create policy "relationship_intake_answers: invitee select"
  on public.relationship_intake_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = relationship_intake_answers.connection_id
        and c.connection_user_id = auth.uid()
    )
  );

drop policy if exists "relationship_intake_answers: invitee insert"
  on public.relationship_intake_answers;
create policy "relationship_intake_answers: invitee insert"
  on public.relationship_intake_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.connections c
      where c.id = relationship_intake_answers.connection_id
        and c.connection_user_id = auth.uid()
    )
  );

drop policy if exists "relationship_intake_answers: invitee update"
  on public.relationship_intake_answers;
create policy "relationship_intake_answers: invitee update"
  on public.relationship_intake_answers for update
  to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = relationship_intake_answers.connection_id
        and c.connection_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.connections c
      where c.id = relationship_intake_answers.connection_id
        and c.connection_user_id = auth.uid()
    )
  );

------------------------------------------------------------
-- case_file_entries
--
-- A read-time union across the four entry sources plus connection
-- events. Silent weeks are NOT in this view — they are computed at
-- render time in components/room/CaseFileList.tsx so the view stays
-- a pure roll-up.
--
-- security_invoker = true so the underlying RLS policies are enforced
-- against the calling user instead of the view owner.
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
  where c.status in ('active','ended');

------------------------------------------------------------
-- _room_seed_block_readings(user_id)
--
-- Used by both handle_new_user() (new signup) and the backfill below
-- (pre-existing users). Idempotent: only inserts where no v1 row
-- exists for that (user, slug). Single source of seed copy.
------------------------------------------------------------
create or replace function public._room_seed_block_readings(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  seeds jsonb := $seeds$[
    {"slug":"subconscious-loops","reading":"too early to say with confidence — the shape is forming.","takeaway":"the loop will surface as data accumulates.","definition":"Repeating sequences of feeling, action, and outcome that occur outside conscious choice. Naming the loop is the first interruption of it."},
    {"slug":"linguistic-unconscious","reading":"too early to say with confidence — the shape is forming.","takeaway":"word choice will reveal what feeling has not yet named.","definition":"The way unconscious material surfaces in word choice, repetition, slips, and the structure of speech — Lacan's claim that the unconscious is structured like a language."},
    {"slug":"father-imago","reading":"too early to say with confidence — the shape is forming.","takeaway":"authority and judgment will trace back to a single seat.","definition":"The internalized image of the father, formed early and partly mythic. It shapes how authority, ambition, and judgment are met later in life."},
    {"slug":"intimacy-threshold","reading":"too early to say with confidence — the shape is forming.","takeaway":"the edge of closeness is a measurable thing.","definition":"The point at which closeness begins to feel like a risk, and a defensive move follows. Different for each person; surprisingly stable across relationships."},
    {"slug":"desire-structure","reading":"too early to say with confidence — the shape is forming.","takeaway":"what is refused points more clearly than what is chased.","definition":"What the user actually wants, distinguished from what they have been told to want. Often discovered by negation — by noticing what they refuse."},
    {"slug":"professional-block","reading":"too early to say with confidence — the shape is forming.","takeaway":"work catches at a specific location, not everywhere.","definition":"Where work catches: the start, the middle, the finish, or the visibility. Each location has its own unconscious source."},
    {"slug":"mother-imago","reading":"too early to say with confidence — the shape is forming.","takeaway":"early attunement leaves a long signature.","definition":"The internalized image of the mother — the first attunement, the first separation. It informs the texture of dependence and refuge."},
    {"slug":"dream-logic","reading":"too early to say with confidence — the shape is forming.","takeaway":"dream content has its own grammar.","definition":"The condensation and displacement at work in dream material. Read for the grammar, not the symbols."},
    {"slug":"relational-pattern","reading":"too early to say with confidence — the shape is forming.","takeaway":"the same shape appears across different rooms.","definition":"The recurring posture taken in relationships — pursuer, withdrawer, parent, child, equal. Stable across partners more than the partners are stable across the user."},
    {"slug":"defenses","reading":"too early to say with confidence — the shape is forming.","takeaway":"the defense names what was once unbearable.","definition":"The characteristic moves used to keep difficult material out of awareness — intellectualization, displacement, reaction formation, splitting. Defenses are not failures; they are old solutions."},
    {"slug":"shadow","reading":"too early to say with confidence — the shape is forming.","takeaway":"what is disowned still acts.","definition":"What has been disowned and assigned to others — the qualities the user is most certain they are not. Often the route to vitality."},
    {"slug":"transference","reading":"too early to say with confidence — the shape is forming.","takeaway":"old figures arrive in present rooms.","definition":"The way old relational figures are projected onto present ones — the analyst, the partner, the boss. The pattern reveals the imago."}
  ]$seeds$::jsonb;
  seed jsonb;
begin
  for seed in select * from jsonb_array_elements(seeds) loop
    insert into public.block_readings (
      user_id, block_slug, reading, takeaway, definition,
      weight, version, last_refined_source
    )
    select
      _user_id,
      seed->>'slug',
      seed->>'reading',
      seed->>'takeaway',
      seed->>'definition',
      0.10,
      1,
      'intake:seed'
    where not exists (
      select 1 from public.block_readings br
      where br.user_id = _user_id
        and br.block_slug = seed->>'slug'
        and br.version = 1
    );
  end loop;
end;
$$;

revoke all on function public._room_seed_block_readings(uuid) from public;

------------------------------------------------------------
-- handle_new_user — patched, not chained.
--
-- Replaces the function from 20260519100000_profiles_and_onboarding.sql
-- to additionally seed a users_meta row and twelve v1 block_readings.
-- The on_auth_user_created trigger on auth.users from that migration
-- still calls handle_new_user, so replacing the function is enough.
------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.onboarding_responses (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.users_meta (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (user_id) do nothing;

  perform public._room_seed_block_readings(new.id);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

------------------------------------------------------------
-- Backfill for users that pre-date this migration.
------------------------------------------------------------
insert into public.users_meta (user_id, display_name)
select id, raw_user_meta_data->>'full_name'
from auth.users
on conflict (user_id) do nothing;

do $backfill$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public._room_seed_block_readings(u.id);
  end loop;
end;
$backfill$;

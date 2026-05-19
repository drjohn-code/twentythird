-- profiles: one row per auth user. Created automatically by the
-- handle_new_user trigger; backfilled at the end of this migration for
-- any auth.users rows that pre-date it.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  full_name text,
  avatar_url text,
  onboarding_completed_at timestamptz,
  onboarding_step smallint not null default 0 check (onboarding_step between 0 and 10)
);

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- onboarding_responses: one row per user. Partial state is always
-- coherent because every step writes under its own stable key
-- (step_1, step_2, ...) inside a single jsonb document.
create table if not exists public.onboarding_responses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.onboarding_responses enable row level security;

create policy "onboarding_responses: select own"
  on public.onboarding_responses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "onboarding_responses: insert own"
  on public.onboarding_responses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "onboarding_responses: update own"
  on public.onboarding_responses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists onboarding_responses_set_updated_at on public.onboarding_responses;
create trigger onboarding_responses_set_updated_at
  before update on public.onboarding_responses
  for each row execute function public.set_updated_at();

-- handle_new_user: after a row lands in auth.users, mint a matching
-- profile and an empty onboarding_responses row. security definer so
-- it can write to public tables on behalf of the signing-up user.
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

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- one-shot backfill for users that pre-date this migration
insert into public.profiles (id, created_at, email, full_name, avatar_url)
select
  u.id,
  u.created_at,
  u.email,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
on conflict (id) do nothing;

insert into public.onboarding_responses (user_id)
select id from auth.users
on conflict (user_id) do nothing;

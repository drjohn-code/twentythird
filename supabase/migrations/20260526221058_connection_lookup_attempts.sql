-- Connection lookup rate limiting.
--
-- Backs the 10-attempts-per-60-seconds cap on POST /api/connections/lookup.
-- An authenticated member can probe whether an arbitrary email belongs
-- to another member; without the cap the endpoint would double as a
-- user-enumeration oracle. Vercel serverless invocations don't share
-- memory, so the limiter has to live in Postgres.
--
-- Writes are service-role-only (the route uses the admin client). No
-- read policy — clients have no business querying this table.

create table if not exists public.connection_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists connection_lookup_attempts_user_time_idx
  on public.connection_lookup_attempts (user_id, attempted_at desc);

alter table public.connection_lookup_attempts enable row level security;

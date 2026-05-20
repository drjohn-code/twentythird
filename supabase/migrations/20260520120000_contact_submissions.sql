create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  message text not null,
  user_agent text,
  ip text
);

alter table public.contact_submissions enable row level security;

-- Service role bypasses RLS by default, so we only need to block anon/authenticated.
-- No policies = no access for anon or authenticated roles. That's what we want.

-- Optional: explicit deny policies for clarity (not strictly required)
drop policy if exists "no anon select" on public.contact_submissions;
create policy "no anon select" on public.contact_submissions
  for select to anon using (false);

drop policy if exists "no authenticated select" on public.contact_submissions;
create policy "no authenticated select" on public.contact_submissions
  for select to authenticated using (false);

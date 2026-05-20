create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  message text not null,
  user_agent text,
  ip text
);

alter table public.contact_submissions enable row level security;

create policy "service role inserts only"
  on public.contact_submissions
  for insert
  to service_role
  with check (true);

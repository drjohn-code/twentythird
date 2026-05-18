create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  inquiry_type text not null check (inquiry_type in ('general','clinical','press','partnership','research')),
  message text not null,
  user_agent text,
  ip_hash text
);

alter table public.contact_messages enable row level security;

create policy "service role inserts only"
  on public.contact_messages
  for insert
  to service_role
  with check (true);

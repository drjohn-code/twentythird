-- 3-day free trial, no payment required.
--
-- Adds users_meta.trial_ends_at, backfills existing users from
-- auth.users.created_at (so pre-existing accounts land in the past and
-- fall straight through to the normal subscription gate), and patches
-- handle_new_user() so every new signup gets a 3-day trial starting at
-- signup. Entitlement logic that reads this column lives in
-- lib/entitlements.ts — nowhere else re-derives access from this column
-- or from subscriptions directly.

alter table public.users_meta
  add column if not exists trial_ends_at timestamptz;

update public.users_meta
set trial_ends_at = u.created_at + interval '3 days'
from auth.users u
where u.id = users_meta.user_id
  and users_meta.trial_ends_at is null;

-- handle_new_user() — full replace (not a chained trigger), same body
-- as 20260525170000_handle_new_user_drop_onboarding_responses.sql plus
-- trial_ends_at on the users_meta insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- handle_new_user: profiles + users_meta (with a 3-day trial) +
  -- block_readings seed.

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.users_meta (user_id, display_name, trial_ends_at)
  values (new.id, new.raw_user_meta_data->>'full_name', now() + interval '3 days')
  on conflict (user_id) do nothing;

  perform public._room_seed_block_readings(new.id);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

-- Urgent production-unblocker: handle_new_user() referenced
-- public.onboarding_responses, a table that was dropped in an
-- earlier cleanup. Every auth.users INSERT (any provider) was
-- failing with `relation "public.onboarding_responses" does not
-- exist`, surfacing in the UI as "Database error saving new user".
--
-- The follow-up migration 20260519160000_intake_and_account.sql had
-- declared the table dead in a comment ("…left in place but unused
-- by the new flow…can be dropped in a future migration") but never
-- updated the trigger to match. Someone later acted on that comment,
-- dropped the table, and the latent bug surfaced the next time
-- anyone tried to sign up.
--
-- This migration replaces handle_new_user() with the same body minus
-- the onboarding_responses insert. The on_auth_user_created trigger
-- on auth.users calls the function by name, so a CREATE OR REPLACE
-- is enough — no trigger DDL needed. Same pattern as
-- 20260522131758_room.sql when it last patched this function.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- handle_new_user: profiles + users_meta + block_readings seed.
  -- The legacy onboarding_responses insert was removed in this
  -- migration after the table was dropped in an earlier cleanup;
  -- the new flow uses intake_responses instead.

  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.users_meta (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (user_id) do nothing;

  perform public._room_seed_block_readings(new.id);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

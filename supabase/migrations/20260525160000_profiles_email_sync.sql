-- Keep profiles.email in sync with auth.users.email.
--
-- Context: the handle_new_user() trigger (defined in
-- 20260519100000_profiles_and_onboarding.sql, patched in
-- 20260522131758_room.sql) fires AFTER INSERT on auth.users and
-- copies NEW.email into profiles. That covers the normal signup
-- path. It does NOT cover:
--   (a) Profiles row created by app/onboarding/account/actions.ts
--       when the trigger row was already deleted (e.g. dev wipe of
--       public.profiles while auth.users survived). Fixed at the
--       call site by including `email: user.email` in the upsert.
--   (b) auth.users.email changing AFTER the initial INSERT — e.g.
--       two-phase OAuth flows where the provider populates email
--       on a follow-up UPDATE rather than at INSERT time.
--
-- This migration adds an AFTER UPDATE OF email trigger as
-- defense-in-depth for case (b). It also backfills the single
-- known affected user (id starting 799a0548…) and any other
-- profiles rows where email drifted from auth.users.email.
--
-- TODO: consolidate to a single source of truth (auth.users.email)
-- in a future pass — drop profiles.email entirely and update the
-- 11 consuming sites to read from auth.users via service-role
-- auth.admin.getUserById, mirroring the scheduled-emails drainer.

-- ────────────────────────────────────────────────────────────────
-- AFTER UPDATE OF email trigger
--
-- Defense-in-depth for two-phase OAuth scenarios (Apple, Facebook,
-- certain SAML configs). Not the fix for the original null-email
-- bug (which was initiateAccount failing to write email on its
-- upsert INSERT branch — see app/onboarding/account/actions.ts).
-- Kept here as a safety net for the failure mode that can occur
-- with other providers.
-- ────────────────────────────────────────────────────────────────

create or replace function public.sync_profile_email_on_auth_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
       set email = new.email
     where id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_profile_email_on_auth_update() from public;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email_on_auth_update();

-- ────────────────────────────────────────────────────────────────
-- One-shot backfill
--
-- Fixes the known case where profiles.email is null but
-- auth.users.email is populated. Idempotent — running again is a
-- no-op once every row is in sync.
-- ────────────────────────────────────────────────────────────────

update public.profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id
   and p.email is null
   and u.email is not null;

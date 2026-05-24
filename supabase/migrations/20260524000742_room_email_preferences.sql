-- Room — Phase 5 (Settings).
--
-- Adds an email_preferences jsonb to users_meta. One column instead of
-- five so the Settings → Email toggle PATCH can write whatever subset
-- the form sent without growing the schema each time a preference is
-- added. Default mirrors the spec: all four toggles on, quiet hours
-- 21:00–08:00 (stored as "HH:MM" strings to keep them locale-agnostic
-- at the DB layer; locale-aware rendering is the UI's job).

alter table public.users_meta
  add column if not exists email_preferences jsonb
  not null
  default jsonb_build_object(
    'weekly_catchup',     true,
    'session_summaries',  true,
    'report_ready',       true,
    'connection_requests', true,
    'quiet_hours_start', '21:00',
    'quiet_hours_end',   '08:00'
  );

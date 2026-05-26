-- Retire three email preference keys (session_summaries, report_ready,
-- connection_requests) by flipping the column default to false. Existing
-- rows are untouched so users who already opted out stay opted out, and
-- those who never visited Settings now default to "not sent" instead of
-- the previous "sent." All matching senders have been removed from the
-- code path; this default flip is belt-and-braces against any future
-- handler that reads the key.

alter table public.users_meta
  alter column email_preferences
  set default jsonb_build_object(
    'weekly_catchup',              true,
    'consulting_session_reminder', true,
    'session_summaries',           false,
    'report_ready',                false,
    'connection_requests',         false,
    'quiet_hours_start',           '21:00',
    'quiet_hours_end',             '08:00'
  );

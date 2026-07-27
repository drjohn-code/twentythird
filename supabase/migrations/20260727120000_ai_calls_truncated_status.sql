-- Allow 'truncated' as an ai_calls.status.
--
-- The router now inspects finish_reason and distinguishes a response
-- cut off at the max_tokens ceiling from a genuine JSON parse failure.
-- Without this constraint change the new status would fail the insert,
-- and logCall swallows its own errors — so the diagnostic row would
-- silently never appear, which is the exact failure shape it exists to
-- surface.

alter table public.ai_calls
  drop constraint if exists ai_calls_status_check;

alter table public.ai_calls
  add constraint ai_calls_status_check
  check (status = any (array['ok', 'error', 'timeout', 'parse_error', 'truncated']));

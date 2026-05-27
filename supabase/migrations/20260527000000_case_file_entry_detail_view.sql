-- Case-file entry detail view — cached AI-generated short summary.
--
-- The /case-file/[id] page renders a two-section detail view for
-- catchups and sessions:
--
--   1. detail_summary        — ≤ 40 words. A genuine summary of the
--                              entry's closed + open answers, with an
--                              honest note when open answers were not
--                              meaningful (junk, empty, keyboard mash).
--   2. detail_recommendation — ≤ 40 words. Actionable recommendations
--                              built from intake + meaningful answers.
--
-- These are distinct from `catchups.summary` (the existing three-
-- paragraph weekly reflection) and from the session transcript. The
-- cache lets us avoid regenerating on every visit; word limits are
-- enforced server-side in the route, not in the prompt.
--
-- Sessions get the same pair of columns. The schema is identical so
-- the same prompt + route handles both kinds.

alter table public.catchups
  add column if not exists detail_summary text;
alter table public.catchups
  add column if not exists detail_recommendation text;

alter table public.sessions
  add column if not exists detail_summary text;
alter table public.sessions
  add column if not exists detail_recommendation text;

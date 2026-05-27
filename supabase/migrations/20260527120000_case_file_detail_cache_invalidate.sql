-- Case-file detail view — invalidate cached output after prompt rev.
--
-- The /api/case-file/detail prompt now produces:
--   · "SUMMARY · YOUR ANSWERS" — up to 60 words (was 40).
--   · "OUR CATCHUP"            — 50–100 words, plain everyday
--                                language (was capped at 40, in the
--                                analyst's clinical voice).
--
-- Existing detail_summary / detail_recommendation rows were written
-- under the old prompt and would otherwise stick. We chose the simpler
-- invalidation path — null both columns so the next page open
-- regenerates — over adding a prompt_version column and a stored-vs-
-- current check. One SQL statement per table, no schema change, no
-- conditional code paths to maintain.

update public.catchups
   set detail_summary = null,
       detail_recommendation = null
 where detail_summary is not null
    or detail_recommendation is not null;

update public.sessions
   set detail_summary = null,
       detail_recommendation = null
 where detail_summary is not null
    or detail_recommendation is not null;

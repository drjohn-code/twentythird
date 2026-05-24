# ROOM.md

The authenticated dashboard for TwentyThird — *the analyst's study after the patient has gone home.* This document summarizes the eight-phase build of Room (`app/(room)/*`), the stubs still in place, the env vars required, and the non-obvious decisions made along the way.

The full specification lives in `~/Downloads/Room-Build-Prompt.md` and the phased plan in `ROOM-PLAN.md`. Visual grammar is in `CLAUDE.md` + `Design-System.md`.

---

## What was built

**Phase 0 — Foundation.** Single Supabase migration `supabase/migrations/20260522131758_room.sql` (plus the follow-up `20260524000742_room_email_preferences.sql`) creates `users_meta`, `intake_answers`, `block_readings`, `catchups`, `sessions`, `reports`, `subscriptions`, `connections`, `relationship_intake_answers`, the `case_file_entries` view, all indexes, and RLS policies. `handle_new_user()` is patched (not chained) to seed `users_meta` + 12 v1 `block_readings` rows. Library skeletons: `lib/copy.ts`, `lib/depth.ts`, `lib/today.ts`, `lib/stripe.ts`, `lib/blocks.ts`. `/dashboard` is now a server redirect to `/room`. `DASHBOARD_PATH` in `lib/onboarding/routing.ts` was updated accordingly.

**Phase 1 — Shell + landing.** `app/(room)/layout.tsx` owns auth gate, intake gate, `PendingStatus` passthrough, server-computed Today line, and `RoomFooter`. `components/room/` ships `RoomNav`, `TodayLine`, `Hairline`, `RoomFooter`, `DepthMeter` (landing + settings variants), and `BlockCard` with the `"what this is →"` expansion. `app/(room)/room/page.tsx` renders the seven landing sections in order.

**Phase 2 — Readings.** `app/(room)/readings/page.tsx` renders six `<BlockSection>`s in catalogue order, each mapped to the appropriate figure pattern (`PatternList`, `DreamText`+`DreamKey`, three `ReportMock` variants, `ScriptRevision`). `ClinicalReportCTA` sits at the bottom with state-dependent copy. `POST /api/reports` inserts a `reports` row, in dev autoflips to `ready` after 3s. `app/(room)/reports/queued/page.tsx` and `app/(room)/reports/[id]/page.tsx` are quiet placeholders.

**Phase 3 — Catchup.** `lib/catchup-questions.ts` holds the 8-question seed set. `CatchupRunner` + `CatchupQuestion` (client) drive the one-question-per-screen flow with the hairline progress strip. `POST /api/catchup` writes the row, applies rule-based deltas to all twelve `block_readings` slugs, and calls `recomputeDepthFor`. One-per-ISO-week guard renders the read-back summary on revisit.

**Phase 4 — Consulting Room.** `app/(room)/consulting/page.tsx` shows the offer for unsubscribed users and `SessionView` for subscribers. `SessionView` (client) renders the hairline timer, held-question line, topic selector, two-voice transcript, and `say it →` input. `POST /api/session` handles `start`/`turn`/`close` with canned analyst replies. Closing recomputes depth and produces a Case File entry via the view.

**Phase 5 — Case File + Settings.** `CaseFileList` (server) reads the `case_file_entries` view and computes *— silent week —* dividers at render time. Filter toggles use URL search params. `app/(room)/settings/page.tsx` renders nine `<SettingsBlock>`s — Account, Your intake (with `IntakeAnswersList` edit-in-place), Reading depth, Connections, Subscription, Reports, Data, Email (`EmailToggles`), Danger zone (`DangerZone` with typed confirmation). `SettingsSaveStrip` flashes the quiet hairline on writes. Endpoints: `/api/settings/email`, `/api/settings/intake`, `/api/settings/delete`.

**Phase 6 — Connections + invite landing.** `InviteForm`, `ConnectionList`, `DisconnectConfirm`, `RelationshipIntake`, `AcceptInviteActions` ship in `components/room/`. Public route `app/invite/[token]/page.tsx` renders outside the Room shell (no nav, atmosphere visible). `POST /api/connections` handles `invite`/`accept`/`accept-account`/`decline`/`disconnect`/`resend`/`cancel` with a 2-active-connections limit and subscription gate on invite. Emails in `lib/emails/` use Resend. Today line picks up the connection-accepted state via `lib/today.ts`.

**Phase 7 — Stripe.** `/api/stripe/checkout` opens subscription or one-off-report checkout sessions; `/api/stripe/portal` opens the billing portal; `/api/stripe/webhook` handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Prices live entirely in Stripe (referenced by env IDs `STRIPE_PRICE_SUBSCRIPTION`, `STRIPE_PRICE_REPORT`). The literal strings `23.23` and `11.11` appear in exactly two files each — `.env.local` (informational comment) and the respective confirm page.

**Phase 8 — Polish.** All grep audits clean (no `bg-white`/`bg-black`/hex literals, no capital-D `Dashboard` in Room scope, pricing literals confined to the two allowed files). `npm run typecheck` and `npm run build` both pass. Fixed a leak in `components/layout/MarketingChrome.tsx` where marketing Nav/Footer were appearing on every Room URL except `/room` itself; the `HIDE_PREFIXES` list now mirrors every `(room)` prefix.

---

## What is stubbed

Search for these markers any time with `rg -n "TODO:" "app/(room)/" "components/room/" "app/api/" "lib/"`. Current inventory:

- `lib/depth.ts` — open-question richness is the simple word-count heuristic specified in the build prompt (`TODO: replace with embedding-based richness`). Onboarding-completion tally compares against intake step definitions loosely (`TODO: tally precisely against lib/onboarding/steps.ts`).
- `app/api/connections/route.ts` — accept-with-account flow stubs the magic-link OTP (`TODO: wire magic-link OTP`).
- `app/api/settings/delete/route.ts` — connection-ended notification on account deletion is not wired to Resend (`TODO: Phase 6 — Resend the connection-ended email`).
- `lib/emails/sender.ts`, `app/api/contact/route.ts` — sender domain assumes `day-23.com` is verified in Resend (`TODO: confirm day-23.com is verified in Resend`).

Real AI inference, safety detection, and report generation are no longer stubbed — see "AI architecture" below.

Out of scope, by spec: real cron for pending-invite expiry, embedding-based richness, i18n, mobile-specific layouts beyond the existing 980px breakpoint.

---

## AI architecture

Every AI call passes through `lib/ai/router.ts`. No other file imports the OpenRouter URL, the API key, or a model name. Swapping the model for a task is an env var change in `.env.local` — never a code change.

**Router (`lib/ai/router.ts`).** `import "server-only"` at the top. Exports `callAI(task, opts)` (non-streaming) and `streamAI(task, opts)` (SSE-style async iterator used by session replies). Both wrap a `fetch` against `https://openrouter.ai/api/v1/chat/completions` with the `HTTP-Referer`/`X-Title` headers, a 60s default timeout (sessions extend to 120s), and a `try/finally` that logs to `ai_calls`. When `jsonMode: true`, sets `response_format: { type: "json_object" }` and retries once on a parse failure.

**Task models (`TASK_MODELS`).** Per-task default model, each overridable by `AI_MODEL_<TASK_UPPER>`:

```
safety_classify    → anthropic/claude-haiku-4.5
initial_readings   → anthropic/claude-sonnet-4.5
catchup_summary    → anthropic/claude-haiku-4.5
catchup_feedback   → anthropic/claude-sonnet-4.5
catchup_refinement → anthropic/claude-sonnet-4.5
session_reply      → anthropic/claude-sonnet-4.5
session_close      → anthropic/claude-haiku-4.5
reading_lede       → anthropic/claude-sonnet-4.5
connection_summary → anthropic/claude-haiku-4.5
report_generation  → anthropic/claude-opus-4.7
```

**Prompts (`lib/ai/prompts/*.ts`).** One file per task, each exporting a `build<Name>Prompt(input): { system, messages }` pure function. The analyst voice is encoded once in `lib/ai/prompts/analyst-voice.ts` as `ANALYST_VOICE` and imported by every analyst-facing prompt. Voice rules live there, not in the routes.

**Pipelines:**

- *Initial readings* (post-intake). `app/onboarding/intake/[step]/actions.ts:submitIntake` flips `users_meta.initial_readings_status = 'pending'` and POSTs to `/api/internal/initial-readings` (service-role-only, gated by `AI_INTERNAL_TOKEN`). The internal route runs safety classification across every free-text intake answer, then calls `initial_readings` once to produce v2 reading copy for all twelve slugs. New `block_readings` rows are inserted, the v1 seeds are superseded, depth is recomputed, status flips to `'ready'`. The `(room)` layout renders `PendingStatus` while status is `'pending'` or `'generating'`.
- *Reading lede* (long-form on `/readings`). `block_readings.lede` is the cache. When missing on render, `lib/ai/reading-lede-jobs.ts` queues a background `reading_lede` call. The page renders a seed-tail fallback this visit; the cached prose appears next visit.
- *Catchup* (`app/api/catchup/route.ts`). POST writes a `catchups` row with `status = 'processing'` and returns the id. The background job runs safety classification on every open answer, then `catchup_summary`, then `catchup_refinement` (JSON, all twelve slugs), then `catchup_feedback` (JSON: `consider` + `recommend`). On `status = 'ready'` the runner shows the summary, the feedback "something to hold" block, and an optional row-link recommendation. `feedback.recommend === 'professional_care'` renders `SafetyResponse` in place of the regular recommendation.
- *Consulting Room* (`app/api/session/route.ts`). The `'turn'` action is now a Server-Sent Events response. Each turn runs `classifySafety` first; on `high`/`critical` we synthesize the safety response and never call the analyst model. On `medium`, an additional instruction is appended to the analyst prompt. Otherwise `streamAI("session_reply", …)` pipes deltas to the SSE channel, accumulated, and persisted as the analyst turn. `'close'` runs `session_close` for the ritual paragraph and a final safety pass on the full transcript.
- *Connection summary* (`app/api/connections/relationship-intake/route.ts`). When the invitee submits the 12 relationship questions, `connection_summary` produces a single paragraph stored on `connections.context_summary`. The summary is injected into session, catchup refinement, and report prompts when the connection is active.
- *Report generation* (`app/api/reports/route.ts` → `app/api/internal/report-generate/route.ts`). The public route inserts a `reports` row, enforces the entitlement window and the one-in-flight rule, and POSTs to the internal generator. The generator loads intake, current readings, catchup summaries (not full answers), session closings, connection summaries, and `safety_flags` of severity ≥ `medium`. It calls `report_generation` (Opus, JSON-mode) for the structured document, acknowledges any flags it surfaced, renders the document on `/internal/report-pdf/[id]` (signed by the same internal token), and captures the page through `lib/ai/report-store.ts:captureReportArtifact`. The artifact is uploaded to the `reports` Supabase Storage bucket; the row stores the path, not a URL. The Room report page mints a 24h signed URL on demand.

**Streaming contract.** SSE messages from `/api/session?action=turn` look like:

```
event: delta
data: {"text":"..."}

event: done
data: {"analyst": {...}, "duration_seconds": 42}
```

`event: error` carries a friendly message string. `SessionView` consumes the stream with a small parser; text appears as it arrives (no decorative animation — per the design system).

**PDF capture.** `captureReportArtifact` calls a hosted browser service when `PDF_RENDER_SERVICE_URL` is set (Browserless or equivalent — POST `{ url, options: { format: "A4" } }` and consume the binary body). When not set, it falls back to storing the rendered HTML directly under a `.html` extension; the report page serves whichever artifact exists. Production should set the env vars.

**Storage bucket.** Reports live in a Supabase Storage bucket named `reports`. Path: `<user_id>/<report_id>.<pdf|html>`. RLS for the bucket: `SELECT` allowed when `(storage.foldername(name))[1] = auth.uid()::text`. Configure this once in the Supabase dashboard, or via SQL on `storage.objects`. The router uses the service role to upload; user-side reads go through the page, which mints a signed URL with the user's session client.

---

## Safety model

Four severity levels — `low`, `medium`, `high`, `critical` — plus `none`. Defined in the `safety_classify` prompt and enforced by `lib/ai/safety.ts`.

- `none`: ordinary distress.
- `low`: significant pain without acute risk. No row written.
- `medium`: passive ideation, recent harm experiences, escalating distress. Writes a `safety_flags` row. Adds a single instruction to the next analyst reply.
- `high`: active ideation without a plan, ongoing abuse, recent severe symptoms. Writes a row. The analyst reply is replaced by the safety response.
- `critical`: active plan, imminent risk. Same handling as `high`.

`safety_flags` row shape: `user_id`, `source` (`intake|catchup|session`), `source_id`, `severity`, `categories[]`, short `excerpt` (≤ 240 chars), `acknowledged_at`. Excerpts are retained because the receiving clinician needs source language; the `ai_calls` table never holds prompt or completion text.

A failed classifier never silently drops a turn — `lib/ai/safety.ts` catches every classifier error and writes a `low`-severity flag tagged with `classifier_failed` so the miss is visible in the data.

The `(room)` layout renders `SafetyResponse` above the page content whenever an unacknowledged high/critical flag exists; the Today line switches to `safetyFollowup`. Acknowledgement happens automatically when a generated report includes the flag in its clinical_priorities.

---

## Running OpenRouter locally

```
# .env.local — set the key and (optionally) override models
OPENROUTER_API_KEY=sk-or-...

# Override any task's model without redeploying
AI_MODEL_SESSION_REPLY=anthropic/claude-opus-4.7

# Generator throttle — friendly degrade above this hourly count
AI_CALLS_HOURLY_LIMIT=5000

# Required for internal-only routes (initial-readings, report-generate)
AI_INTERNAL_TOKEN=<random>

# Optional — hosted browser for PDF rendering
PDF_RENDER_SERVICE_URL=https://browserless.example.com/pdf
PDF_RENDER_SERVICE_TOKEN=...
```

**Inspecting calls.** The `ai_calls` table is service-role-only. From the Supabase SQL editor:

```sql
select task, model, status, duration_ms, prompt_tokens, completion_tokens, cost_usd, created_at
from public.ai_calls
order by created_at desc
limit 50;
```

There is no prompt text, no completion text, no user-identifiable content in this table — only metadata.

**Swapping a model.** Change `AI_MODEL_SESSION_REPLY` in `.env.local`, restart `npm run dev`, and the next session reply uses the new model. No code change.

---

## Required env vars

In `.env.local` (gitignored). Production deploys must supply equivalents.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only — never imported into a client component
NEXT_PUBLIC_SITE_URL=               # used for magic-link redirects + invite emails

# Resend (transactional email)
RESEND_API_KEY=

# Stripe (test mode in dev)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SUBSCRIPTION=          # price id, not the amount
STRIPE_PRICE_REPORT=                # price id, not the amount

# OpenRouter — the only model gateway
OPENROUTER_API_KEY=

# Per-task model overrides (optional — defaults live in lib/ai/router.ts)
AI_MODEL_SAFETY_CLASSIFY=
AI_MODEL_INITIAL_READINGS=
AI_MODEL_CATCHUP_SUMMARY=
AI_MODEL_CATCHUP_FEEDBACK=
AI_MODEL_CATCHUP_REFINEMENT=
AI_MODEL_SESSION_REPLY=
AI_MODEL_SESSION_CLOSE=
AI_MODEL_READING_LEDE=
AI_MODEL_CONNECTION_SUMMARY=
AI_MODEL_REPORT_GENERATION=

# Friendly degrade threshold
AI_CALLS_HOURLY_LIMIT=5000

# Internal-only routes (initial-readings, report-generate, report PDF render)
AI_INTERNAL_TOKEN=

# Hosted browser for PDF capture (optional — HTML fallback if unset)
PDF_RENDER_SERVICE_URL=
PDF_RENDER_SERVICE_TOKEN=
```

The pricing *amounts* (`23.23`, `11.11`) live in Stripe itself, plus the informational comment in `.env.local` and the user-facing confirm pages. They do not appear in code that ships to the client elsewhere.

---

## Non-obvious decisions

1. **Marketing chrome is hidden by a client wrapper, not a route group.** Phase 1 recommended moving marketing pages into `app/(marketing)/` to share a root layout cleanly. We instead kept the marketing pages at the top level and added `components/layout/MarketingChrome.tsx` (`MarketingNav` + `MarketingFooter`) that uses `usePathname` to return `null` on any `HIDE_PREFIXES` match (`/room`, `/readings`, `/catchup`, `/consulting`, `/case-file`, `/settings`, `/subscribe`, `/reports`, `/invite`). The list must stay in sync with `app/(room)/*` URLs — any new Room route needs its prefix added. The Phase 8 fix to extend that list from `["/room","/invite"]` to the full set is the canonical example.

2. **Room nav is its own component, not a Tailwind config switch.** `RoomNav` lives at `components/room/RoomNav.tsx` and is rendered only from `app/(room)/layout.tsx`. The marketing `Nav` continues to render on every non-Room route.

3. **`handle_new_user()` is replaced, not chained.** The Phase 0 migration drops the previous trigger function and recreates it with the `users_meta` + 12-row `block_readings` seeding inline. `security definer set search_path = public` is preserved. This is easier to reason about than stacking triggers.

4. **`relationship_intake_answers` has no `user_id` column.** Access is mediated by joining `connections` and matching `auth.uid()` to either party. The inviter has no API endpoint that returns these rows — only the derived effect on their readings via `recomputeDepthFor`. The SQL comment in the migration is the canonical record of this constraint.

5. **`connections` is the only table where one row is visible to two users.** RLS policy is `auth.uid() = inviter_user_id OR auth.uid() = connection_user_id`. All writes (`invite`, `accept`, `disconnect`, `resend`, `cancel`) go through `app/api/connections/route.ts`, never direct from the client.

6. **Today line is computed per request, no cache.** `lib/today.ts` `computeTodayLine(ctx)` is pure; `app/(room)/layout.tsx` gathers the inputs in parallel and resolves the sentence via `lib/copy.ts` `resolveTodayLine`. There is no cache by design — the line is part of the page render, not a fetched fragment.

7. **Reading Depth is `0..1` server-side, a CSS width client-side.** No percentage number renders anywhere. `DepthMeter` accepts `variant: 'landing' | 'settings'`; the per-source breakdown lives in the settings variant.

8. **Pricing strings are tightly scoped.** Only `app/(room)/subscribe/confirm/page.tsx` (`23.23`) and `app/(room)/reports/confirm/page.tsx` (`11.11`) contain the user-facing amount. `.env.local` carries them in a comment for human reference only. Stripe price IDs are read from env at runtime.

9. **One Stripe SDK singleton.** `lib/stripe.ts` is `import "server-only"` and lazily constructs the Stripe client. No `STRIPE_SECRET_KEY` import path reaches a client component (verified by grep).

10. **Reduced motion is one global rule.** `app/globals.css` has `@media (prefers-reduced-motion: reduce){ *{animation:none !important;transition:none !important} html{scroll-behavior:auto} }`. Every Room animation (depth-meter fill, catchup progress strip, settings save strip, session timer) inherits this — no per-component opt-in needed.

11. **The crisis safety footer is in the layout, not per-page.** `RoomFooter` renders the safety line for every `app/(room)/*` route by construction. `/invite/[token]` deliberately renders without it: the spec instructs *"no nav, atmosphere visible"* — the invitee landing is not a Room page.

---

## Running Stripe webhooks locally

```
# 1. install the stripe CLI: https://stripe.com/docs/stripe-cli
# 2. log in to your test account
stripe login

# 3. forward webhooks to the local app (in one terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. copy the printed "whsec_..." into STRIPE_WEBHOOK_SECRET in .env.local
# 5. start the dev server (in another terminal)
npm run dev

# 6. trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

Subscription flow: hit `/subscribe/confirm` while signed in, click through to Checkout (test card `4242 4242 4242 4242`). On success the webhook upserts `subscriptions` for the user; `/consulting` and `/settings#connections` become unlocked.

One-off report flow: hit `/reports/confirm` while signed in (as a free user), complete checkout, the webhook inserts a paid `reports` row + the dev autoflip marks it `ready` after 3s.

---

## Known gaps before launch

- Analyst inference is canned. The `TODO: wire to model` markers in `app/api/session/route.ts` and `app/api/catchup/route.ts` are the integration points.
- Clinical-report PDF generation is a stub. The dev autoflip simulates a worker; production needs a real queue and a real generator. The `reports` row carries `depth_at_generation` so the report can be reconstructed exactly later.
- Pending invites do not expire automatically. A daily cron (or a Postgres `pg_cron` job) should move `connections.status = 'pending'` rows past `expires_at` to `expired`. The handler in `app/api/connections/route.ts` accepts a `cancel` action that performs this transition for manual use.
- Embedding-based richness for Reading Depth — current word-count heuristic is intentionally simple per spec.
- Connection-aware prompt engineering — the analyst may reference connections by first name and role; the prompt-construction site for that is marked in `app/api/session/route.ts`.
- Magic-link OTP for the accept-with-account branch of `app/api/connections/route.ts` is stubbed.
- *Intake → room transition is manual today.* `app/api/dev/open-room/route.ts` flips `profiles.intake_status` from `processing` to `ready` and fires the room-ready email (`lib/emails/room-ready.ts`); production needs the same transition to happen automatically two hours after `intake_submitted_at`. Cleanest wiring: a Supabase `pg_cron` job running every five minutes that updates `profiles set intake_status = 'ready' where intake_status = 'processing' and intake_submitted_at < now() - interval '2 hours'`. Pair it with an `after update on profiles` trigger that, when the new status is `ready` and the old was `processing`, calls a Supabase Edge Function which loads the user's email and posts to Resend using the same `lib/emails/room-ready.ts` payload (or duplicates the template inline — the Edge Function is server-only). The cron's `where` clause must match the manual route's `where` clause exactly (`intake_status = 'processing'`) so the two paths can't double-fire the email if cron and a manual call race. The dev route should stay in place behind the `NODE_ENV` guard so engineers can still force the transition during local testing.

---

*If Room is doing its job, the page should feel less like software and more like a journal that listens back.*

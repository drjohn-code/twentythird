# Room Build Plan

Phased implementation plan for the TwentyThird **Room** dashboard. Each phase is designed to be executed in its own chat session — phases are self-contained and reference only what they need from prior phases via the file system, not conversational memory.

**Before starting any phase**, read in order:
1. `CLAUDE.md` — stack, tokens, voice, conventions.
2. `Design-System.md` — typography, motion, components.
3. `~/Downloads/Room-Build-Prompt.md` — the canonical Room spec.
4. This file (`ROOM-PLAN.md`) — phase-specific tasks.

---

## Confirmed architectural decisions

These were agreed before Phase 0 and apply to every phase:

1. **`/dashboard` is replaced by `/room`.** `lib/onboarding/routing.ts` updated to `DASHBOARD_PATH = "/room"`. `app/dashboard/page.tsx` becomes a server redirect to `/room`. The intake-incomplete and intake-processing branches move into `app/(room)/layout.tsx` (or `/room/page.tsx`) so unsubmitted users are bounced back to `/onboarding/intake`. The existing `PendingStatus` UI is preserved verbatim for the `intake_status = 'processing'` case.
2. **Auth path is `/auth/sign-in?next=/room`.** The Room shell uses `redirect("/auth/sign-in?next=/room")` when there is no session. Sign-out goes through the existing `/auth/sign-out`.
3. **Tailwind v4, no config file.** Easing curves and the `lg-edit: 980px` breakpoint go in `app/globals.css` via `@theme`. Do not introduce `tailwind.config.ts`.
4. **Room nav is its own component.** `components/room/RoomNav.tsx`. The (room) layout suppresses the marketing `<Nav>` from `app/layout.tsx` and renders `RoomNav` in its place. The root `<Nav>` continues to render on marketing routes.
5. **Today line is computed server-side per request.** `lib/today.ts` exports `computeTodayLine(ctx)` returning a key + args resolved through `lib/copy.ts`. No cache.
6. **One Stripe SDK, prices via env.** Add `stripe` to dependencies. Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SUBSCRIPTION`, `STRIPE_PRICE_REPORT`. Webhook at `/api/stripe/webhook`.
7. **Reading Depth is computed in `lib/depth.ts`.** Pure `computeDepth(inputs)` + effectful `recomputeDepthFor(userId, supabase)`. Recomputed lazily on read (>1h stale) and eagerly after any catchup/session/onboarding-edit/connection write.
8. **AI inference and PDF generation are stubbed.** Analyst replies are canned serif italic strings with `TODO: wire to model`. Report generation inserts a row, sets `status = 'ready'` after 3s in dev with a placeholder `pdf_url`. Both are marked `TODO`.
9. **One big migration.** All Room tables (`users_meta`, `intake_answers`, `block_readings`, `catchups`, `sessions`, `reports`, `subscriptions`, `connections`, `relationship_intake_answers`) + the `case_file_entries` view + RLS + indexes + `handle_new_user` patch live in a single migration file in Phase 0.
10. **`handle_new_user` is patched, not chained.** Replace the existing function to additionally seed `users_meta` and 12 v1 `block_readings` (all dashboard + report-only slugs) for each new user.

---

## Naming reminders

These show up in every phase. Get them right or the file will be rewritten.

- The dashboard is **Room**, never "Dashboard."
- Therapy is **Consulting Room**; the voice is **the analyst** (singular); turns are **sessions** or **consultations**.
- The dossier is the **Case File**.
- The six analytic units are **readings**. In code they are `blocks`.
- Weekly Catchup is **Catchup** (one word, capitalized as a noun).
- Data completeness is **Reading Depth**, never "score" / "progress" / "completion."
- Connected people are **connections** (inviter / connection). Never "friend" / "partner profile."

---

## Cross-phase conventions

- **No new typefaces, colors, radii, motion durations.** Reuse what `CLAUDE.md` and `Design-System.md` declare.
- **No `bg-white` / `bg-black` / hex literals.** Token classes only (`bg-bg`, `text-fg`, `border-hair`, etc.).
- **Pricing strings (`23.23`, `11.11`) appear in exactly two files:** the Stripe price config (env-driven, no string literal) and the confirmation screen copy. Buttons never include a price.
- **Crisis safety footer** is required on every Room page. Lives in `RoomFooter.tsx`, rendered from `app/(room)/layout.tsx`.
- **Server components by default.** Mark `"use client"` only when interactivity demands it (theme toggle, reveal observer, forms, session input).
- **`prefers-reduced-motion: reduce`** must disable every new animation. The existing global rule in `globals.css` handles this — verify any new keyframes you add are covered.
- **TypeScript strict.** No `any` without a comment justifying it.

---

# Phase 0 — Foundation

**Goal:** Database schema, copy library, depth/today/stripe library skeletons, redirect from `/dashboard` to `/room`. No UI yet.

**Pre-read for this phase:**
- `supabase/migrations/20260519100000_profiles_and_onboarding.sql` (the existing `handle_new_user` trigger)
- `supabase/migrations/20260519160000_intake_and_account.sql` (existing intake schema)
- `lib/onboarding/routing.ts`
- `app/dashboard/page.tsx`

**Files to create:**

- [ ] `supabase/migrations/<timestamp>_room.sql` — single migration file. Replace `<timestamp>` with `date -u +%Y%m%d%H%M%S`.
  - Tables (all with `id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`, RLS enabled, `auth.uid() = user_id` policies unless noted):
    - `users_meta` (`user_id` unique fk → `auth.users`, `display_name`, `locale`, `reading_depth numeric default 0`, `reading_depth_computed_at timestamptz`, `is_connection_only boolean default false`)
    - `intake_answers` (`user_id`, `question_key text`, `answer jsonb`, `version int`, `updated_at timestamptz`)
    - `block_readings` (`user_id`, `block_slug text`, `reading text`, `takeaway text`, `definition text`, `weight numeric`, `version int`, `last_refined_source text`, `superseded_at timestamptz nullable`)
    - `catchups` (`user_id`, `week_number int`, `answers jsonb`, `summary text`)
    - `sessions` (`user_id`, `topic text nullable`, `held_question text`, `transcript jsonb`, `closed_at timestamptz nullable`, `duration_seconds int default 0`)
    - `reports` (`user_id`, `kind text default 'clinical'`, `status text` check in `queued|generating|ready|failed`, `pdf_url text nullable`, `depth_at_generation numeric`)
    - `subscriptions` (`user_id` unique, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end timestamptz`)
    - `connections` (`inviter_user_id` fk, `connection_user_id` fk nullable, `connection_email`, `connection_first_name nullable`, `role` check `partner|closest_friend|parent|sibling|co_parent`, `note text nullable`, `invite_token text unique`, `status` check `pending|active|declined|expired|ended`, `accepted_at`, `ended_at`, `ended_by uuid nullable`, `expires_at timestamptz`)
      - **RLS:** `auth.uid() = inviter_user_id OR auth.uid() = connection_user_id`. Writes go through route handlers, not direct from client.
    - `relationship_intake_answers` (`connection_id` fk, `question_key text`, `answer jsonb`). **No user_id column.** RLS allows select for both inviter and connection user via join on `connections`. Add SQL comment: `-- access is mediated by the connection — inviter never queries raw rows directly`.
  - Indexes:
    - `(user_id, created_at desc)` on `catchups`, `sessions`, `reports`
    - `(user_id, block_slug, version desc)` on `block_readings`
    - `(user_id, question_key, version desc)` on `intake_answers`
    - `(inviter_user_id, status)`, `(connection_user_id, status)` on `connections`
    - unique on `connections.invite_token` (also enforced by column constraint)
  - View `case_file_entries`: `union all` across `catchups`, `sessions`, `reports`, `block_readings` (intake reading v1 rows) and connection events. Computed at read time. Columns: `user_id`, `entry_id`, `entry_kind`, `entry_title`, `entry_summary`, `occurred_at`. **Silent weeks are NOT in the view** — compute them at render time in `CaseFileList.tsx` (Phase 5).
  - **Patch `handle_new_user()`** (drop + recreate): in addition to its current `profiles` + `onboarding_responses` insert, also insert a `users_meta` row and 12 `block_readings` rows (v1, with the thin/seed copy listed in `lib/copy.ts` — Phase 0 seeds with placeholder strings, real reading copy lives in the migration as inline literals or read from a static array). Trigger is `security definer set search_path = public`.
- [ ] `lib/copy.ts` — full copy library from the Room build prompt section "Copy library". Include `todayLines`, `depthLines`, `depthExplainer`, `connectionExplainer`, `inviteEmail`, `sessionClose`, `sayItAffordance`, and the per-block reading/takeaway/definition seeds (six dashboard slugs).
- [ ] `lib/depth.ts` — exports:
  - `type DepthInputs` with the seven contribution sources from the prompt.
  - `computeDepth(inputs: DepthInputs): number` returning `[0, 1]`.
  - `richnessScore(answer: string): number` — `min(words/60, 1) * 0.6 + min(uniqueWords/words, 0.7) / 0.7 * 0.4`. Add `// TODO: replace with embedding-based richness`.
  - `recomputeDepthFor(userId: string, supabase: SupabaseClient): Promise<number>` — queries all inputs, writes `users_meta.reading_depth` + `reading_depth_computed_at`.
  - `depthBand(depth: number): 'thin'|'partial'|'steady'|'deep'` for the italic line mapping.
- [ ] `lib/today.ts` — exports:
  - `type TodayContext` with the inputs needed (profile, latest catchup, open session, recent connection events, depth band).
  - `computeTodayLine(ctx: TodayContext): { key: keyof typeof todayLines; args?: unknown[] }`.
- [ ] `lib/stripe.ts` — exports:
  - `getStripe()` lazy server-only singleton using `STRIPE_SECRET_KEY`.
  - `PRICE_SUBSCRIPTION = process.env.STRIPE_PRICE_SUBSCRIPTION!`
  - `PRICE_REPORT = process.env.STRIPE_PRICE_REPORT!`
  - Marked `import "server-only"`.
- [ ] `lib/blocks.ts` — exports the catalogue of 12 block slugs (six dashboard + six report-only) with subtitles and order. Single source of truth used by Phase 1 BlockCard grid, Phase 2 Readings, Phase 3 Catchup deltas, and the migration seeds.

**Files to edit:**

- [ ] `lib/onboarding/routing.ts` — change `DASHBOARD_PATH = "/dashboard"` to `DASHBOARD_PATH = "/room"`. Search the codebase for other references to `/dashboard` and decide each one (most should also move).
- [ ] `app/dashboard/page.tsx` — replace contents with `import { redirect } from "next/navigation"; export default function() { redirect("/room"); }`. Keep the file as a redirect so any stale links still work.
- [ ] `package.json` — add `"stripe": "^17.0.0"` (or whatever current version) to dependencies. Run `npm install`.
- [ ] `.env.local` — add placeholders (do not commit values):
  ```
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  STRIPE_PRICE_SUBSCRIPTION=
  STRIPE_PRICE_REPORT=
  ```

**Acceptance:**
- [ ] Migration applies cleanly against a fresh Supabase DB. RLS is enabled on every new table.
- [ ] A newly-signed-up user has a `users_meta` row and 12 `block_readings` rows automatically.
- [ ] Hitting `/dashboard` 302s to `/room` (which 404s — that's expected until Phase 1).
- [ ] `npm run typecheck` passes.
- [ ] No UI changes are visible to a signed-out user.

---

# Phase 1 — Room shell + landing

**Goal:** A signed-in user with a submitted intake can visit `/room` and see the full landing page in both themes.

**Depends on:** Phase 0 (migration, copy lib, depth lib, today lib, `lib/blocks.ts`).

**Pre-read:**
- `app/layout.tsx` (root layout — fonts, atmosphere, marketing nav)
- `components/layout/Nav.tsx` (marketing nav — for visual parity)
- `components/ui/Glass.tsx`, `Eyebrow.tsx`, `Pill.tsx`, `CTA.tsx`, `RowLink.tsx`
- `components/figures/FigureCard.tsx`, `ReportMock.tsx`, `InsightTimeline.tsx`
- `components/layout/Reveal.tsx`
- `lib/onboarding/routing.ts` (intake gate)

**Files to create:**

- [ ] `app/(room)/layout.tsx` — server component.
  - Auth check → redirect to `/auth/sign-in?next=/room` if no session.
  - Intake gate: if `!gate.account_initiated_at` → `/onboarding/account`; if `!gate.intake_submitted_at` → `/onboarding/intake`; if `intake_status === 'processing'` → render `<PendingStatus>` (reuse from `components/dashboard/PendingStatus.tsx`).
  - Compose Today line via `computeTodayLine`; resolve sentence via `lib/copy.ts`; render `<TodayLine>` below `<RoomNav>`.
  - Render `<RoomFooter>` at the bottom (crisis safety note + standard footer link).
  - Suppress marketing `<Nav>` — either by adding a route-segment-aware check in `app/layout.tsx` or by overriding via CSS class on `<body>` set by this layout. Recommended: render marketing `<Nav>` conditionally in `app/layout.tsx` based on `headers()` pathname check, or split into a `(marketing)` route group containing the current pages. **Choose one approach and document it in `ROOM.md` in Phase 8.**
- [ ] `components/room/RoomNav.tsx` — fixed glass pill, items in order: `Room · Readings · Catchup · Consulting · Case File`. Right side: `<ThemeToggle>` (reuse existing trigger pattern from marketing nav), serif italic first name 13px `text-fg-dim`, ghost `sign out` link → `/auth/sign-out`. Active item is serif italic. No avatar, no bell. Hardcode nav structure; current path comes from `usePathname` (this is a client component).
- [ ] `components/room/TodayLine.tsx` — server component. Takes the resolved sentence as a prop. Serif italic, `text-[18px]`, `text-fg-dim`, `max-w-[720px]`, `pt-[140px] pb-[80px]`, lowercase. Period or em-dash only.
- [ ] `components/room/Hairline.tsx` — `<hr>` utility. Optional `strong` prop switches to `border-hair-strong`. Default `border-hair`.
- [ ] `components/room/RoomFooter.tsx` — hairline-separated single-line safety note (`text-[12px] text-fg-mute`, serif non-italic): *"TwentyThird is not a substitute for clinical care. In crisis, contact your local emergency line."* Plus the standard footer link area (sparse — just a single © line in mono).
- [ ] `components/room/DepthMeter.tsx` — `variant: 'landing' | 'settings'`.
  - Landing variant: eyebrow `READING DEPTH`, the `h-px bg-hair-strong` track with `bg-fg` fill at `width: {depth*100}%` (CSS variable, animated `1400ms var(--ease)` on section enter), the italic serif line from `depthLines[depthBand(depth)]`, optional row-link to the largest missing source (priority order per the prompt).
  - Settings variant: same meter + italic line, plus a breakdown of per-source contributions (each row label + thinner hairline meter), and the `depthExplainer` paragraph.
  - **No percentage number renders anywhere.**
- [ ] `components/room/BlockCard.tsx` — described in detail in the Room build prompt section "BlockCard".
  - Compact glass figure, `aspect-square` at column width on desktop, natural height under `981px`.
  - Header row: mono `Reading 0N` left · serif italic subtitle right.
  - Body: serif italic reading, `text-[20px] leading-[1.35]`, max 18 words.
  - Hairline divider.
  - Footer: serif takeaway, `text-[15px] text-fg-dim leading-[1.4]`, max 14 words.
  - Mono metadata row: `weight · 0.72` left, `refined after catchup · week 04` right.
  - `"what this is →"` row-link at bottom — expands an inline `<div>` (animated `max-height` transition, 600ms `var(--ease)`) containing the `definition` (plain serif, `text-[15px] text-fg-dim`). Collapse on click-away or second click. Client component (`useState`).
- [ ] `app/(room)/room/page.tsx` — server component.
  - Section 2: `<DepthMeter variant="landing">` at the very top of page content.
  - Section 3: split-row "latest reading preview" with eyebrow `LATEST READING`, h2, lede, `<FigureCard><ReportMock /></FigureCard>` on the right.
  - Section 4: 2-column grid of `<BlockCard>` (always 6, catalogue order from `lib/blocks.ts`). Click → `/readings#<slug>`.
  - Section 5: Catchup card. If completed this week, show ghost line; otherwise CTA.
  - Section 6: Consulting Room card. Subscription-gated UI variants. No price string anywhere.
  - Section 7: Case File preview — last 3 entries (query `case_file_entries` view) + row-link `Open the case file →`.
  - Reuse the `.reveal` mechanism.

**Files to edit:**

- [ ] `app/layout.tsx` — conditionally render marketing `<Nav>` (skip on `/room/*`, `/invite/*`). Use `headers().get('x-pathname')` via middleware, OR move marketing pages into a `(marketing)` route group. Pick one. **Recommendation:** route group, lower-risk and idiomatic.
- [ ] If you use the `(marketing)` route group: move `app/page.tsx`, `app/about/`, `app/method/`, `app/contact/`, `app/legal/`, etc. into `app/(marketing)/`. Their URLs do not change. The (room) and (invite) groups are siblings.

**Acceptance:**
- [ ] `/room` renders for a signed-in user with submitted intake.
- [ ] Unauthenticated → redirect to `/auth/sign-in?next=/room`.
- [ ] Unsubmitted intake → redirect to `/onboarding/intake` (or account page if account not initiated).
- [ ] `intake_status === 'processing'` → renders `PendingStatus`.
- [ ] Today line renders sensible sentences for at least: quiet day, catchup ready, thin reading.
- [ ] Depth meter renders with no percentage number visible.
- [ ] Six BlockCards render in catalogue order. The `what this is →` expansion works.
- [ ] Safety footer present.
- [ ] Both themes pass visual check.
- [ ] `npm run typecheck` passes.

---

# Phase 2 — Readings page

**Goal:** Long-form `/readings` with all six block sections + clinical report CTA at the bottom.

**Depends on:** Phase 0, Phase 1 (`RoomNav`, `Hairline`, `DepthMeter`, `lib/blocks.ts`).

**Pre-read:**
- `components/figures/PatternList.tsx`, `DreamText.tsx`, `DreamKey.tsx`, `ReportMock.tsx`, `ScriptRevision.tsx` — these are the figures mapped to specific readings.

**Files to create:**

- [ ] `components/room/BlockSection.tsx` — wrapper used per reading. Props: `index`, `slug`, `subtitle`, `definition`, `readingLede` (3–4 sentence array), `figure` (ReactNode).
  - Split-row, alternates reverse based on `index % 2`.
  - Eyebrow `READING 0X · <SUBTITLE>`, h2 with italic subtitle phrase, definition paragraph, reading lede, optional `see in case file →` row-link.
  - Hairline divider above, `py-[120px]`. Anchor id is the slug.
- [ ] `components/room/ClinicalReportCTA.tsx` — centered block.
  - Eyebrow `CLINICAL REPORT`, serif h2 *"For your analyst."*, lede (12–18 page dossier copy from the prompt).
  - CTA copy depends on subscription state. **No price on the button.**
  - If `depth < 0.5`, insert the italic line between lede and CTA.
  - Mono line below CTA: `subscribers · one report included each month`.
- [ ] `app/(room)/readings/page.tsx` — server component.
  - Top strip: `<Glass>` with `Last refined: <mono date>` left, `Reading depth · <mini-meter>` right.
  - Six `<BlockSection>`s, in catalogue order, each mapped to its figure:
    - `subconscious-loops` → `<PatternList>`
    - `linguistic-unconscious` → `<DreamText> + <DreamKey>` (linguistic markers as annotation chips)
    - `father-imago` → `<ReportMock>` variant
    - `intimacy-threshold` → `<ReportMock>` variant
    - `desire-structure` → `<ReportMock>` variant
    - `professional-block` → `<ScriptRevision>`
  - `<ClinicalReportCTA>` at the bottom.
- [ ] `app/api/reports/route.ts` — POST.
  - Verify auth.
  - Verify entitlement: subscribed (`subscriptions.status === 'active'`) OR a one-off charge succeeded (`reports.kind === 'clinical'` row with paid status — phase 7 wires this). For Phase 2, accept subscribed users and free users equally and mark a `TODO: enforce entitlement` for free users.
  - Insert `reports` row, `status: 'queued'`, `depth_at_generation: <current depth>`.
  - In dev, set `status: 'ready'` after 3s via `setTimeout`. Mark `TODO: queue worker`.
  - Returns `{ report_id }`.
- [ ] `app/(room)/reports/[id]/page.tsx` — minimal "your report is being prepared" page. One serif italic line, no spinner. (Optional this phase; can be stubbed at `/reports/queued` first.)

**Acceptance:**
- [ ] `/readings` renders six sections in fixed order; each anchor scrolls.
- [ ] Each section shows definition + reading lede + figure.
- [ ] Clinical report CTA renders with state-dependent copy and no price string.
- [ ] POST `/api/reports` creates a row; dev autoflip to `ready` works.
- [ ] `npm run typecheck` passes.

---

# Phase 3 — Catchup

**Goal:** A user can complete a Catchup end-to-end, see the summary, find it in the Case File.

**Depends on:** Phase 0, Phase 1.

**Pre-read:**
- `components/ui/Textarea.tsx`, `Radio.tsx`, `RadioGroup.tsx`, `Scale.tsx` — reuse for question types
- `components/figures/ReportMock.tsx` — for the closing summary meters
- `lib/depth.ts` — `recomputeDepthFor`

**Files to create:**

- [ ] `lib/catchup-questions.ts` — exports the 8-question seed set with types (`open`, `closed`, `scale`), prompts, options. Single source of truth.
- [ ] `components/room/CatchupQuestion.tsx` — client component. Renders one question of any of the three types. Styling per the prompt:
  - Closed: 2–5 full-width hairline-bordered rows, `rounded-[3px]`, padding `14px 18px`. Selected: hairline becomes `--fg`, no fill or check.
  - Open: `<Textarea>` with serif italic prompt above, `text-[22px]` question in serif (non-italic), mono hint `longer answers deepen the reading` when answer < 25 words.
  - Scale: 7 hairline ticks, current value as serif italic numeral.
- [ ] `components/room/CatchupRunner.tsx` — client component. Manages question-by-question state. Hairline progress strip at top (1px, `bg-fg` fill, 1200ms transition, no numeric label). Cover screen → 8 questions → closing summary. Submits via POST to `/api/catchup`. Renders the closing summary returned by the server.
- [ ] `app/(room)/catchup/page.tsx` — server component. If the user already has a catchup for the current ISO week, render the read-back-summary state. Otherwise render `<CatchupRunner>`.
- [ ] `app/api/catchup/route.ts` — POST.
  - Verify auth.
  - Write a `catchups` row: `user_id`, `week_number` (ISO week of submission), `answers` (jsonb of `{ question_key: value }`), `summary` (computed by a stub function, 3 short serif paragraphs — `TODO: wire to model`).
  - Write deltas to `block_readings` for all 12 slugs (six dashboard + six report-only). v(n+1) row per slug with `last_refined_source: 'catchup:week_NN'`, supersede previous via `superseded_at`. Reading copy is rule-based stub: for open answers above a length threshold, swap in a `"refined after the latest catchup"` placeholder. Mark `TODO: model-driven reading refinement`.
  - Call `recomputeDepthFor(userId, supabase)`.
  - Return `{ summary, shifted: [{ slug, deltaWeight }] }`.

**Acceptance:**
- [ ] A user can begin a Catchup, complete all 8 questions, and land on the summary.
- [ ] The summary renders 3 serif paragraphs + a `<ReportMock>` showing shifted readings.
- [ ] After completion, returning to `/catchup` shows the read-back summary (one-per-week guard).
- [ ] After completion, `/room` Today line reflects the new state (latest catchup is now within 14 days).
- [ ] Reading Depth has increased.
- [ ] `npm run typecheck` passes.

---

# Phase 4 — Consulting Room

**Goal:** A subscribed user can start, type into, and close a session. Closing recomputes depth and writes a case file entry.

**Depends on:** Phase 0, Phase 1.

**Pre-read:**
- `components/ui/Textarea.tsx`, `RowLink.tsx`

**Files to create:**

- [ ] `components/room/SessionView.tsx` — client component.
  - Single column, `max-w-[680px]`, centered.
  - Hairline timer strip at top — `h-px bg-hair` with `bg-fg` fill growing as session time elapses. JS-driven progress, capped at 2h soft.
  - Centered serif italic "held question" line, computed server-side from last session or most recent Catchup.
  - Four hairline-bordered selectable rows for topic (Dreaming future / Night dream / Relations in my life / Professional growth).
  - Two-voice transcript: user input (sans, `text-[17px]`, no bubble), analyst (serif, `text-[19px] leading-[1.5]`, italics for terms of art, no bubble). 28px between turns. No timestamps.
  - Input: `<Textarea>` at bottom, growing, with serif italic *"say it →"* affordance to the right. Enter submits. No button.
  - Top-right: `<RowLink>` *"close the session →"* — triggers POST `/api/session?action=close`.
- [ ] `app/(room)/consulting/page.tsx` — server component.
  - Unsubscribed: single section, serif h1 *"The consulting room."*, lede, CTA *"Enter the consulting room →"* → triggers Stripe subscription confirmation flow (Phase 7 wires the actual Stripe call). For Phase 4, show a placeholder confirmation page or `TODO` button.
  - Subscribed: render `<SessionView>` initialized with the held question + topic chips.
- [ ] `app/api/session/route.ts` — POST with `action`.
  - `start` — create a `sessions` row with `topic` + `held_question`. Return `session_id`.
  - `turn` — append to `transcript`; generate analyst reply with stub function returning one of ~6 canned serif italic strings, varied by topic. `TODO: wire to model`. `TODO: connection-aware prompt engineering`. Return reply.
  - `close` — set `closed_at`, `duration_seconds`. Append closing-ritual paragraph (analyst voice) to `transcript`. Call `recomputeDepthFor`. Insert a placeholder case file entry (via the `sessions` row appearing in `case_file_entries` view automatically). Return ok.

**Acceptance:**
- [ ] Subscribed user can start a session, type a turn, and receive an analyst reply.
- [ ] Closing the session writes `closed_at` and increases depth.
- [ ] Closed session appears in `/case-file`.
- [ ] Unsubscribed user sees the offer state.
- [ ] `npm run typecheck` passes.

---

# Phase 5 — Case File + Settings

**Goal:** Case File and Settings pages render with all sections. Settings writes are immediate (no save button), depth recomputes after intake edits.

**Depends on:** Phase 0, Phase 1.

**Pre-read:**
- `components/onboarding/*` (existing intake question UI to reuse for the edit flow)
- `lib/onboarding/steps.ts`

**Files to create:**

- [ ] `components/room/CaseFileList.tsx` — server component. Takes entries as props. Renders each entry per the prompt's layout:
  ```
  [mono date] [serif italic kind] [serif title]
  one-line summary, max-width 640px
  row-link "open →"
  ```
  - Computes silent weeks at render time: iterate through entries, detect 7-day gaps, insert *"— silent week —"* dividers (centered, hairline above and below at `40px` margin, `text-fg-mute`, unhoverable).
- [ ] `app/(room)/case-file/page.tsx` — server component.
  - Section head: eyebrow `CASE FILE`, h2 *"A record, kept quietly."*, lede.
  - Hairline-bordered text toggles (no chips): `all · readings · catchups · sessions · reports`. Default all. Implement as URL search params, e.g. `?filter=catchups`.
  - Query `case_file_entries` view filtered by user + filter.
  - `<CaseFileList entries={...}>`.
- [ ] `app/(room)/case-file/[id]/page.tsx` — placeholder per-entry page (Phase 5 stub, can render a single serif italic *"this entry's detail view is coming."*).
- [ ] `components/room/SettingsBlock.tsx` — section wrapper. Renders eyebrow + heading + children, hairline divider below.
- [ ] `app/(room)/settings/page.tsx` — server component. 9 `<SettingsBlock>` sections in order:
  1. **Account** — name, email (read-only with edit link to `/auth/...` or a magic-link change flow stub), language (locale dropdown — only English in this build, but list the field).
  2. **Your intake** — list of intake answers from `intake_responses`. Each pair: serif italic question + sans answer + `edit →` row-link → opens that question in a modal/inline form. On save, write to `intake_answers` (versioned) and call `recomputeDepthFor`. Italic line above: *"the intake is not a one-time form. answers can deepen."*
  3. **Reading depth** — `<DepthMeter variant="settings">`.
  4. **Connections** — placeholder for Phase 6.
  5. **Subscription** — current plan, next renewal date in mono, `manage subscription →` (Stripe portal link, Phase 7). Unsubscribed: single CTA *"Enter the consulting room →"*.
  6. **Reports** — list of past reports as case-file-style rows + `Request a new report →`.
  7. **Data** — `Export everything →` (stub). Italic line: *"every reading, catchup, session, and report — yours, always."*
  8. **Email** — toggles (defaults all on): weekly catchup reminder, session summaries, report ready, connection requests. Quiet hours (hairline-tick range picker, default 21:00–08:00).
  9. **Danger zone** — serif italic *"Delete account and erase the case file"* row, `text-fg-dim`. Typed-confirmation modal (type `delete the case file` to enable).
- [ ] `components/room/SettingsSaveStrip.tsx` — quiet hairline strip at top of Settings, fills left-to-right for 600ms on any write. Client component, listens for a custom event dispatched by section forms.
- [ ] `app/api/settings/email/route.ts` — PATCH endpoint for email toggle writes.
- [ ] `app/api/settings/intake/route.ts` — POST endpoint for intake answer edits. Writes versioned row to `intake_answers`. Calls `recomputeDepthFor`.
- [ ] `app/api/settings/delete/route.ts` — DELETE endpoint. Verifies typed confirmation. Deletes the user (cascades via fk). Sends connection-end emails (Phase 6 wires email; Phase 5 stubs).

**Acceptance:**
- [ ] `/case-file` renders with the four filter toggles and silent weeks.
- [ ] `/settings` renders all 9 sections.
- [ ] Editing an intake answer recomputes depth (verify in DB).
- [ ] Email toggle saves on change with the save-strip animation.
- [ ] Delete account flow requires typed confirmation.
- [ ] `npm run typecheck` passes.

---

# Phase 6 — Connections + invite landing

**Goal:** A subscribed user can invite up to 2 connections. Invitees can accept (with or without an account) or decline. Acceptance recomputes inviter's depth and produces a Today line.

**Depends on:** Phase 0, Phase 1, Phase 5 (connections section in Settings).

**Pre-read:**
- Existing email/Resend setup if any (`resend` is in `package.json`)
- `components/ui/Field.tsx`, `Input.tsx`, `Select.tsx`, `Textarea.tsx`

**Files to create:**

- [ ] `components/room/InviteForm.tsx` — client component. Email (required), role (required `partner | closest_friend | parent | sibling | co_parent`), optional one-line serif italic note. Submits to `/api/connections?action=invite`.
- [ ] `components/room/ConnectionList.tsx` — server component. Lists active connections + pending invites.
  - Active row: `[serif italic first name] [mono · role] [mono · since YYYY-MM-DD] [row-link: disconnect →]`.
  - Pending row: `[serif italic email] [mono · invited YYYY-MM-DD] [mono · expires in N days] [row-link: resend →] [row-link: cancel →]`.
  - Empty/limit/unsubscribed states per the prompt.
- [ ] `components/room/DisconnectConfirm.tsx` — typed-confirmation modal. User types the connection's first name to enable. On confirm, POST `/api/connections?action=disconnect`.
- [ ] `components/room/RelationshipIntake.tsx` — client component for the 12-question invitee intake. Mostly closed questions about the relationship. Single source of question list in `lib/relationship-intake-questions.ts`. Roughly 5 minutes to complete.
- [ ] `app/(room)/invite/[token]/page.tsx` — **public route, no auth required to view, no nav, atmosphere visible.** Server component.
  - Looks up `connections` by `invite_token`, joins inviter name.
  - If expired or already accepted/declined: render appropriate quiet message.
  - Otherwise render the eyebrow + h1 + two explanatory paragraphs + serif italic note (if present) + 3 hairline-bordered action rows: *Yes — begin the relationship intake*, *Yes — connect without an account*, *No, thank you*.
  - Each action posts to `/api/connections?action=accept|accept-account|decline` and routes onward.
- [ ] `lib/relationship-intake-questions.ts` — seed list of 12 questions.
- [ ] `lib/emails/invite.ts` — Resend email template. Subject: *"<first name> would like you in the reading."* Body: short paragraph in analyst voice + optional note + CTA link. Pure function returning the Resend payload.
- [ ] `lib/emails/connection-ended.ts` — Resend email template.
- [ ] `lib/emails/connection-accepted.ts` — Resend email template (the other party gets a quiet email on accept).
- [ ] `app/api/connections/route.ts` — POST with `action` discriminator.
  - `invite` — verify auth + subscription + < 2 active. Generate signed `invite_token` (use `crypto.randomBytes(24).toString('base64url')`). Insert `connections` row with `status: 'pending'`, `expires_at: now() + 14 days`. Send email via Resend. Return ok.
  - `accept` — public (token-authenticated). Update `status: 'active'`, `accepted_at`, `connection_first_name`. Send email to inviter. Recompute inviter's depth. Redirect to a relationship intake landing.
  - `accept-account` — creates a magic-link signup for the invitee, then performs `accept`, then routes to standard intake after relationship intake.
  - `decline` — `status: 'declined'`.
  - `disconnect` — verify auth, verify caller is one of the two parties. `status: 'ended'`, `ended_at`, `ended_by`. Send email to the other party. Recompute their depth.
  - `resend` — regenerate token, reset expiry, send email again.
  - `cancel` — `status: 'expired'` for pending invites cancelled by the inviter.
- [ ] `app/api/connections/relationship-intake/route.ts` — POST endpoint to write `relationship_intake_answers` rows. Verifies the caller is the `connection_user_id` for that connection.

**Files to edit:**

- [ ] `app/(room)/settings/page.tsx` — wire the Connections section with `<ConnectionList>` and `<InviteForm>`.
- [ ] `lib/today.ts` — add the connection-accepted Today line case.
- [ ] `lib/depth.ts` — connection contribution is already in the schema; verify the recompute pulls it.

**Acceptance:**
- [ ] A subscribed user can invite a connection by email.
- [ ] Invitee receives the email, lands at `/invite/<token>`.
- [ ] Invitee can accept (with or without account) or decline.
- [ ] Acceptance with-account flows into standard intake afterward.
- [ ] After acceptance, inviter's depth increases and Today line on next visit says *"<name> has accepted the connection..."*.
- [ ] Disconnect requires typed first-name confirmation.
- [ ] Limit of 2 active connections enforced (UI + server).
- [ ] Non-subscribed users cannot send invites.
- [ ] **RLS test:** an inviter cannot SELECT `relationship_intake_answers` rows via the client — confirm via a Supabase studio query as the inviter user.
- [ ] `npm run typecheck` passes.

---

# Phase 7 — Stripe

**Goal:** Subscriptions and one-off report purchases work in Stripe test mode. The two price strings `23.23` and `11.11` appear in exactly two files.

**Depends on:** Phase 0 (stripe lib skeleton, env vars), Phase 4 (consulting page CTA), Phase 5 (subscription section), Phase 2 (report CTA).

**Pre-read:** Stripe Next.js App Router patterns: https://stripe.com/docs/payments/checkout/how-checkout-works

**Files to create:**

- [ ] `app/api/stripe/checkout/route.ts` — POST. Accepts `{ kind: 'subscription' | 'report' }`. Creates a Stripe Checkout Session with `mode: 'subscription'` or `'payment'` and the price from env. Returns the session URL.
- [ ] `app/api/stripe/portal/route.ts` — POST. Creates a Stripe billing portal session for the user's customer ID. Returns URL.
- [ ] `app/api/stripe/webhook/route.ts` — POST. Verifies signature with `STRIPE_WEBHOOK_SECRET`. Handles four events:
  - `checkout.session.completed` — for subscription, upsert `subscriptions` row. For report, mark a `reports` row paid (if a placeholder row exists) or insert a new paid `reports` row + queue.
  - `customer.subscription.updated` — update `subscriptions.status`, `current_period_end`.
  - `customer.subscription.deleted` — set `status: 'canceled'`.
  - `invoice.payment_failed` — set `status: 'past_due'`.
- [ ] `app/(room)/subscribe/confirm/page.tsx` — the **one** non-checkout-page that contains the `23.23` literal. Serif h1, the price line in clinical voice, CTA → POST to `/api/stripe/checkout?kind=subscription`.
- [ ] `app/(room)/reports/confirm/page.tsx` — the **one** non-checkout-page that contains the `11.11` literal. Same grammar.

**Files to edit:**

- [ ] `app/(room)/consulting/page.tsx` — unsubscribed CTA routes to `/subscribe/confirm`.
- [ ] `app/(room)/readings/page.tsx` — free-user clinical-report CTA routes to `/reports/confirm`. Subscribed → `/api/reports` directly (one included per calendar month).
- [ ] `app/(room)/settings/page.tsx` — `manage subscription →` triggers `/api/stripe/portal`.
- [ ] `app/api/reports/route.ts` — Phase 2's `TODO: enforce entitlement` is closed now. Free users must have a `reports` row with `paid_at` (or equivalent flag) before generation can proceed.

**Acceptance:**
- [ ] In Stripe test mode (using `stripe listen`):
  - [ ] Subscribing creates a `subscriptions` row with `status: 'active'`.
  - [ ] Subscribing unlocks the Consulting Room, invites, and one free report per month.
  - [ ] Buying a one-off report creates a `reports` row marked paid and triggers generation.
- [ ] `23.23` appears in exactly one file under `app/(room)/` (the subscribe confirm).
- [ ] `11.11` appears in exactly one file under `app/(room)/` (the report confirm).
- [ ] No buttons elsewhere display a price.
- [ ] Webhook signature verification works.
- [ ] `STRIPE_SECRET_KEY` is never imported into a client component (verify by grep).
- [ ] `npm run typecheck` passes.

---

# Phase 8 — Polish + ROOM.md

**Goal:** Repo is shippable. Documentation written. Acceptance criteria from the build prompt's Definition of Done are all green.

**Depends on:** all prior phases.

**Tasks:**

- [ ] Search-and-fix:
  - [ ] `rg -n "bg-white|bg-black|text-white|text-black"` under `app/(room)/` and `components/room/` — must be empty.
  - [ ] `rg -n "#[0-9a-fA-F]{3,6}"` under `app/(room)/` and `components/room/` — must be empty (only `globals.css` may contain hex).
  - [ ] `rg -n "23\\.23"` — exactly two matches: env (`.env.local`) and `app/(room)/subscribe/confirm/page.tsx`. Stripe price config is env-only.
  - [ ] `rg -n "11\\.11"` — exactly two matches: `.env.local` and `app/(room)/reports/confirm/page.tsx`.
  - [ ] `rg -n "Dashboard"` — no occurrences in `app/(room)/` or `components/room/`.
- [ ] Verify `prefers-reduced-motion: reduce` disables every new animation. Grep new keyframes; ensure the global rule in `globals.css` covers them.
- [ ] Verify the crisis safety footer appears on every Room page (it's in the layout, so this is by construction — verify the layout actually wraps every page).
- [ ] Verify RLS — for each new table, run a SELECT as user A and assert user B's rows are invisible. The connections table is the only place where one row is visible to two users.
- [ ] Run `npm run build` and `npm run typecheck`. Both must pass.
- [ ] Smoke-test in dev: sign up a new user, complete intake, hit `/room`, complete a catchup, start and close a session, invite a connection, accept as a different user, confirm depth changed on both sides.
- [ ] Write `ROOM.md` at the repo root. Single page summarizing:
  - What was built (one bullet per phase outcome).
  - What was stubbed and where the `TODO: ...` markers live (`rg -n "TODO:"` output filtered to `app/(room)/`, `components/room/`, `lib/`).
  - Required env vars (Stripe + existing Supabase).
  - Non-obvious decisions made during implementation (route-group split, the connection RLS approach, etc.).
  - How to run Stripe webhooks locally.
  - Known gaps before launch (real AI inference, real PDF generation, real cron for invite expiry).

**Acceptance (the build prompt's Definition of Done, re-listed):**
- [ ] All five routes render without console errors in both themes.
- [ ] Today line renders for at least: quiet, catchup ready, thin reading, connection accepted.
- [ ] Reading Depth meter renders on the Room landing and Settings, nowhere else. No percentage visible.
- [ ] Six BlockCards on landing, catalogue order, each with a working `what this is →` expansion.
- [ ] Catchup completion end-to-end works and recomputes depth.
- [ ] Session start/turn/close works and recomputes depth.
- [ ] Intake answer edit recomputes depth.
- [ ] Invite → accept → active connection → depth update → Today line.
- [ ] Connection list shows active + pending, disconnect with typed confirmation works.
- [ ] RLS verified across all tables.
- [ ] Stripe checkout works for both products in test mode.
- [ ] `prefers-reduced-motion: reduce` disables everything.
- [ ] No `bg-white`, `bg-black`, no hex literals in Room.
- [ ] `23.23` and `11.11` in exactly the two allowed files.
- [ ] Crisis safety footer on every Room page.

---

## Notes for future-you (in a new chat)

- The Room build prompt lives at `~/Downloads/Room-Build-Prompt.md`. Read it before starting any phase.
- Always read `CLAUDE.md` + `Design-System.md` first.
- The seed copy for each block reading lives in `lib/copy.ts` and `lib/blocks.ts` after Phase 0.
- All Today line variants live in `lib/copy.ts` after Phase 0.
- Depth band → italic line mapping lives in `lib/copy.ts` after Phase 0.
- When a phase fails or you need to skip ahead, write the deferred work as a `TODO: ...` and capture it in `ROOM.md` (or the in-flight scratchpad) so Phase 8 picks it up.
- Trigger patches are easier to write as full `create or replace function`; do not chain triggers.
- Tailwind v4: extend tokens via `@theme` in `globals.css`. There is no `tailwind.config.ts`.
- Existing nav lives at `components/layout/Nav.tsx`; Room nav is a sibling at `components/room/RoomNav.tsx`. The `(marketing)` route group recommendation in Phase 1 keeps these cleanly separated.

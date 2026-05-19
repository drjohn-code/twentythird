# Onboarding build — notes

A short, honest summary of what was added in this branch.

## What was built

Three new surfaces, plus the supporting data and component layer:

1. **`/onboarding/account`** — Account setup. Name (Google-prefill aware), year of birth (descending select), gender radio group, terms checkbox. Server-action `initiateAccount` validates with `zod`, writes the new `profiles` columns, then redirects to the intake intro.
2. **`/onboarding/intake`** — The "No-Wrong-Answer Architecture" intro panel. Routes mid-intake users straight to their next unsaved step.
3. **`/onboarding/intake/[step]`** — Single dynamic route serving all ten sections from `lib/onboarding/steps.ts`. Two-column page chrome (sticky progress rail + question form); below `980px` it collapses to a horizontal progress bar over a stacked form. Autosave fires 800ms after the last change and on every navigation. Skip per-question is a first-class state, not a missing answer.
4. **`/dashboard`** — Pending state with three meter rows (responses received / pattern extraction / profile synthesis). Also handles "intake incomplete" with a resume CTA, and a stub for `intake_status='ready'`.
5. **`/onboarding`** — Reworked into a router-only page that resolves the user's state and redirects to the right destination via `lib/onboarding/routing.ts`.

### New files

```
app/dashboard/page.tsx
app/onboarding/page.tsx                                   (rewritten as router)
app/onboarding/account/page.tsx
app/onboarding/account/actions.ts
app/onboarding/intake/page.tsx
app/onboarding/intake/[step]/page.tsx
app/onboarding/intake/[step]/actions.ts                   saveStep + submitIntake

components/ui/Glass.tsx, Pill.tsx, CTA.tsx, CTAGhost.tsx, RowLink.tsx,
  Eyebrow.tsx, Field.tsx, Input.tsx, Textarea.tsx, Select.tsx,
  Radio.tsx, RadioGroup.tsx, Checkbox.tsx, MultiSelect.tsx,
  Scale.tsx, QuestionRow.tsx

components/onboarding/AccountForm.tsx, IntroPanel.tsx,
  StepShell.tsx, StepForm.tsx, StepProgress.tsx, SaveIndicator.tsx
components/dashboard/PendingStatus.tsx

lib/types/intake.ts                                       discriminated-union question + answer types
lib/onboarding/steps.ts                                   (rewritten) — 10 sections × ~6 questions each
lib/onboarding/schema.ts                                  zod for account + per-step payload
lib/onboarding/routing.ts                                 single source of truth for "where do they go?"
lib/supabase/admin.ts                                     service-role client (server-only)

supabase/migrations/20260519160000_intake_and_account.sql
```

### Files modified

- `lib/auth/post-auth.ts` — completed users now resolve to `/dashboard` instead of `/`.
- `lib/supabase/middleware.ts` — gates `/dashboard` alongside `/onboarding`.
- `app/onboarding/intake/[step]/actions.ts` mirrors `intake_submitted_at` into the legacy `onboarding_completed_at` so the existing post-auth gate keeps working without a rewrite.
- `app/globals.css` — appended the onboarding/dashboard CSS layer (~400 lines), token-only.

### Files deleted

- `app/onboarding/OnboardingClient.tsx` — old single-page state machine.
- `app/api/onboarding/route.ts` — old REST shim, replaced by server actions.

---

## What was stubbed

- **Analysis worker.** `submitIntake` enqueues a row in `analysis_jobs` via the service-role client and stops there. No edge function. No email. The pending dashboard shows fixed meter values (`100% / 10% / 0%`) — visual state, not live progress.
- **`intake_status = 'ready'` dashboard view.** Out of scope per brief. The `/dashboard` route surfaces a placeholder string when it hits that state.
- **Section editing post-submit.** Spec mentions "edit any section after you finish it." Not built. There's a `// TODO: section editing` comment near the `intake_responses` upsert in `app/onboarding/intake/[step]/actions.ts`.
- **Email notifications.**
- **Resume tokens / magic links.** Auth + the routing helper is enough — a signed-in user always lands on their last unfinished step.
- **Service-role key gracefully missing.** `submitIntake` proceeds with the user-side write even if `SUPABASE_SERVICE_ROLE_KEY` is unset; it just skips the `analysis_jobs` insert. The pending dashboard still renders.

---

## Where the brief contradicted reality, and what I did

Five places the brief diverged from the actual codebase or the design system. I flagged these before starting (and you OK'd the resolution); recording them here for the record:

1. **"Tailwind only · token-mapped Tailwind classes (`bg-bg`, `text-fg`)".** There is no `tailwind.config.ts` in this project; the codebase uses Tailwind v4 with a CSS-first config and styles everything through hand-written CSS classes in `app/globals.css` (e.g. `.glass`, `.pill`, `.eyebrow`). I followed the existing convention. **The spirit of the rule is preserved** — no hex anywhere in JSX/TSX, every color reaches through `var(--*)` tokens, and the components compose semantic classes only. Switching to utility classes would have been a project-wide refactor, not a build.
2. **`/signin` vs `/auth/sign-in`.** Existing auth lives at `/auth/sign-in`. All new redirects use that path. The brief's `/signin` was a naming slip.
3. **Existing `/onboarding` flow.** A previous client-side 10-step form was already shipped (`OnboardingClient.tsx`, `app/api/onboarding/route.ts`). Both are deleted and replaced per your "Replace it entirely" call. The legacy `onboarding_responses` table from the prior migration is left in place but unused; a future migration can drop it.
4. **Existing `profiles` schema.** The brief's schema used a separate `user_id` column; the actual table keys on `id = auth.uid()`. I additive-altered the existing columns rather than rebuilding. The `handle_new_user` trigger continues to mint a profile on signup.
5. **Schema column overlap.** Existing `onboarding_step` and `onboarding_completed_at` were already there. I'm keeping both and writing to them on submit (alongside the new `intake_submitted_at` / `intake_status`) so `lib/auth/post-auth.ts` and the rest of the auth surface don't need a rewrite.

---

## Definition of done — status

- ✅ `next build` passes. All routes register, no TS errors.
- ✅ `tsc --noEmit` clean.
- ✅ Both themes — every new component reaches through CSS vars only; light/dark swap is handled by the existing `[data-theme]` cascade.
- ✅ Forbidden words audit (`we believe`, `imagine`, `unlock`, `journey`) — no occurrences in any new file.
- ✅ Every new headline has exactly one italic phrase; a dev-mode warn in `lib/onboarding/steps.ts` enforces this on the question copy.
- ✅ RLS enabled on `intake_responses` and `analysis_jobs`. `analysis_jobs` has *no* insert policy for authenticated users — writes only via service role.
- ⚠️ **Not verified end-to-end in the browser.** The flow is auth-gated and I had no real Supabase session in the preview environment. The dev server compiles every route cleanly and the middleware behaves correctly (`/onboarding/account` 200-redirects to `/auth/sign-in?next=/onboarding/account` as expected). Sign in with a real user to walk it through.

---

## What I'd build next

1. **A test seed** — a Supabase migration or seed script that creates a confirmed user with `account_initiated_at` set, so the intake flow is one click away in dev without going through email confirmation.
2. **`intake_responses` editing.** The brief asks for it; not built. Server action and a section editor would extend `StepForm.tsx`.
3. **The analysis worker.** Edge function reading from `analysis_jobs.status='queued'`, writing back to `profiles.intake_status`.
4. **Live progress on the pending dashboard.** Replace the hard-coded meter values with a row read from `analysis_jobs` or a derived view.
5. **The "ready" dashboard view** — the actual surface the user comes back for.
6. **Drop `onboarding_responses`.** Once we're certain no rows of value live there.

# CLAUDE.md — TwentyThird

> *Psychodynamic AI for the inner life. A quiet room for serious thinking.*

This file gives Claude the context needed to work on the TwentyThird codebase. Read it before writing any TSX, Tailwind, copy, or components. The canonical visual reference is `Design-System.md`.

---

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript — strict mode, no `any` without justification
- **Styling:** Tailwind CSS — design tokens defined in `tailwind.config.ts` and `globals.css`, never raw hex
- **Backend / DB:** Supabase (Postgres + Auth + Storage)
- **Fonts:** `next/font` — Instrument Serif, Inter, JetBrains Mono only

---

## What This Product Is

**TwentyThird** is an advanced psychodynamic AI platform for self-discovery. It fuses Freudian psychoanalysis with Lacanian theory on linguistics, desire, and identity to perform root-cause analysis of the subconscious — not surface-level personality profiling.

The name comes from the Day-23 inflection metaphor — the moment curiosity becomes awareness. The 23-day cycle originates in Wilhelm Fliess's correspondence with Freud; contemporary science does not support it as a fixed biorhythm. TwentyThird keeps the number as metaphor, not biology.

**Core capabilities:**
- Subconscious Loop & Pattern Mapping
- Deep-Core Psychodynamic Profiling
- Linguistic Unconscious Exploration (Lacanian analysis of word choice and speech patterns)
- Relational dynamics and attachment style analysis
- Dream interpretation and goal alignment
- Professional block dissolution (imposter syndrome, procrastination, self-sabotage)
- Therapist-ready psychological maps and shadow work plans

**Origin:** Built inside the CognitiveLab at WelloWork AB. The team — physicians with clinical and research backgrounds — began receiving personal questions from people struggling with anxiety and recurring patterns. TwentyThird was the answer.

---

## Brand

**Name:** TwentyThird — always one word, capital T capital T. Never "23rd," "Twenty-Third," "Project 23," or "23." The numeric mark `23` appears only inside the logo's circular ring.

**Tagline:** *Psychodynamic AI for the inner life.*

**Hero headline:** Advanced Psychodynamic AI *for Self-Discovery*

**Aesthetic:** Editorial-clinical. A 1920s monograph reissued by a contemporary research lab.

---

## Voice & Copy Rules

- Short, certain sentences. Speaks with clinical authority.
- One literary flourish per paragraph — never two.
- Italics signal the half-said: *desire*, *lack*, *already allowed*.
- Names things precisely: "primal scene," "father-imago," "intimacy threshold." Jargon is welcome when accurate.
- **Forbidden words:** "we believe," "imagine," "unlock," "journey," "Project 23," and all wellness clichés.
- Numerals in clinical contexts: always figures (`37×`, `n = 2,418`), never words.

**Copy rhythm:**
- Headlines: one strong noun, then an italic qualifier. *"Decode **dream logic**, align goals."*
- Lede: one sentence stating the claim, one sentence describing the mechanism.
- Captions: italic, lowercase, never punctuated at the end.

---

## Design Principles (summary)

Six principles govern every decision. When in doubt, **remove**.

1. **Quiet over loud.** Whitespace, hairlines, and atmospheric fog do the work that color does elsewhere.
2. **Literary over technical.** Serif headlines with real italics. Italics are a *voice*, not decoration.
3. **Clinical, not cold.** Data and figures appear next to italic captions.
4. **Slow motion.** Animations breathe. Durations: 400ms–1600ms. Nothing bounces.
5. **One frame per idea.** Each section earns the screen.
6. **Atmosphere as substrate.** Fog and grain are the page itself — surfaces sit *inside* the atmosphere.

The page should feel less like software and more like a journal that listens back.

---

## Color System

Two themes: **dark** (default) and **light**. Tokens live as CSS custom properties on `:root[data-theme="..."]` in `app/globals.css`, then exposed to Tailwind via `tailwind.config.ts` under `theme.extend.colors` (e.g. `bg: "var(--bg)"`, `fg: "var(--fg)"`, `fgDim: "var(--fg-dim)"`, `hair: "var(--hair)"`). Always reach through tokens — never hardcode hex in className.

### Dark theme
| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0a0b` | Page background |
| `--bg-soft` | `#101012` | Elevated surface |
| `--fg` | `#ededee` | Primary text, stroke |
| `--fg-dim` | `#a0a0a6` | Secondary text, italic captions |
| `--fg-mute` | `#6a6a72` | Tertiary text, mono labels |
| `--hair` | `rgba(255,255,255,0.09)` | Divider |
| `--hair-strong` | `rgba(255,255,255,0.16)` | Emphasis divider, hover borders |
| `--glass-bg` | `rgba(255,255,255,0.035)` | Glass surface fill |
| `--glass-bg-strong` | `rgba(255,255,255,0.06)` | Glass CTA fill |
| `--glass-hi` | `rgba(255,255,255,0.10)` | Glass top highlight |

### Light theme
| Token | Value | Role |
|---|---|---|
| `--bg` | `#f5f5f3` | Page background |
| `--fg` | `#121214` | Primary text |
| `--fg-dim` | `#5a5a60` | Secondary text |
| `--glass-bg` | `rgba(255,255,255,0.55)` | Glass fill |

**Color rules:**
- No saturated color anywhere. The brand is monochrome.
- No gradients across hue — only alpha fades of `--fg`, `--fog-*`, or `--bg`.
- No `bg-white`, `bg-black`, `text-white`, `text-black`. Always token-mapped Tailwind classes (`bg-bg`, `text-fg`, etc.).
- Theme toggle persists via `localStorage.theme`. Use a `ThemeProvider` client component that sets `data-theme` on `<html>` before first paint to prevent flash.
- Theme transitions: 500ms on `background` and `color`, defined once in `globals.css` on `body`.

---

## Typography

Four families, two of them serif. No others — ever. Loaded via `next/font` in `app/layout.tsx` and exposed as CSS variables (`--font-serif-display`, `--font-serif-text`, `--font-sans`, `--font-mono`). Inside `globals.css` they are mapped to `--serif-display`, `--serif-text`, with `--serif` aliased to `--serif-text` so every existing `font-family:var(--serif)` resolves to the text serif by default. The Tailwind v4 `@theme inline` block in `globals.css` also exposes them as utility classes (`font-serif` → text serif, `font-serif-display` → display serif).

| Family | CSS token / Tailwind class | Use |
|---|---|---|
| **Instrument Serif** (400, 400 italic) | `var(--serif-display)` · `font-serif-display` | **Display only — sizes ≥ 32px.** Hero `h1`, every section `h2`, philosophy `h2`, row `h3`s with min ≥ 32px, the large italic clinical numerals in figures (the 68px `.big` in insight-timeline, the 56px day-23 `.big`, the 40px `.scale-value`), the `TwentyThird` wordmark next to the logo (20–22px logotype exception). |
| **Source Serif 4** (400 / 600, both italic) | `var(--serif)` / `var(--serif-text)` · `font-serif` *(default)* | **Text serif — everything else that was serif.** Italic captions, dream-text paragraphs, figure subtitles (`.vh em`), pattern-list outcome labels (e.g. *withdrew*), italic clinical terms (*intimacy threshold*, *obsessional · with hysterical traces*), state `h3`s in the 26–38px band, onboarding question titles, the italic *or* in `<CTAGhost>`, the row-link arrow, any serif body or summary text. |
| **Inter** (300/400/500/600) | `font-sans` (default) | Body copy, navigation, buttons |
| **JetBrains Mono** (400/500) | `font-mono` | Eyebrows, figure labels, timestamps, ratios |

**Key rules:**
- The serif rule is **size-based, not semantic**: ≥ 32px → display serif; everything below → text serif. There is no need to pick by element. The boundary case is the state `h3` in the 26–38px band — keep it on text serif unless a future variant clears 38px cleanly and reads well in Instrument Serif.
- Headlines always serif. Sans-serif headlines are forbidden.
- Eyebrows always sans (or mono for figure metadata).
- Italics appear only in: (1) headlines — one italic phrase per headline, (2) captions and clinical names, (3) interpretive numerals (`~14 wks`, `obsessional`). Source Serif 4 has a true italic — the semantic use does not change, italics now simply read at small sizes.
- Never use italics inside body paragraphs for emphasis.
- `text-wrap: pretty` on multi-line headlines (Tailwind: `text-pretty`).
- Body: `text-[17px] leading-[1.55]`, antialiased, `font-feature-settings: "ss01","cv11"` (set globally in `globals.css`).
- When adding a new serif rule, reach for `var(--serif)` by default. Only switch to `var(--serif-display)` if the rendered size sits cleanly at or above 32px.

---

## Layout

- Container max width: `1240px`, padding `36px` desktop. Use a shared `<Shell>` component or `mx-auto max-w-[1240px] px-9` pattern.
- **One breakpoint:** Tailwind's `md` is remapped to `981px` in config, or use a custom `lg-edit: 980px` screen. All multi-column grids collapse to single column below it.
- Section rhythm uses generous vertical padding (hero `pt-[110px] min-h-screen`; split sections `py-[160px_120px]` — use arbitrary values where the scale doesn't have it).
- `split-row` grid: `grid-cols-[0.88fr_1.22fr] gap-20`. Reversed variant: `grid-cols-[1.22fr_0.88fr]` with content order swapped.
- Section heads: eyebrow → `h2` (serif, italic phrase) → optional lede (`text-[17px] text-fg-dim max-w-[480px]`).

---

## Surfaces

**Glass:** The signature surface. Implement as a `<Glass>` component or shared className utility:
```
bg-glass-bg border border-hair backdrop-blur-[28px] backdrop-saturate-[140%] relative
before:absolute before:inset-x-0 before:top-0 before:h-px before:pointer-events-none
before:bg-[linear-gradient(90deg,transparent,var(--glass-hi),transparent)]
```

**Atmosphere:** Two fixed decorative layers as client components (`aria-hidden`, `pointer-events-none`):
1. `<Atmosphere />` — four `.fog` orbs, 40–70vw circles, `blur-[110px]`, drifting on 32–50s loops via keyframes defined in `globals.css`.
2. `<Grain />` — SVG `feTurbulence` filter at `--noise-opacity`, `mix-blend-overlay`.

Both render once in `app/layout.tsx`, behind a `<main className="relative z-[2]">` shell.

**Radii:** Pill `rounded-full` · Card `rounded-[24px]` · Small `rounded-[3px]` · Nothing in between.

**Shadows:** Avoided. Only allowed: inner highlight on CTAs (`shadow-[inset_0_1px_0_var(--glass-hi)]`), `drop-shadow` on the brain image.

---

## Motion

Easing curves declared in `tailwind.config.ts` under `theme.extend.transitionTimingFunction`:
```
ease:        cubic-bezier(0.22, 1, 0.36, 1)
ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
```

| Type | Duration | Tailwind |
|---|---|---|
| Microhover | `300ms` | `duration-300` |
| CTAs, transforms | `400ms` | `duration-[400ms]` |
| Theme swap | `500ms` | `duration-500` |
| State change, reveal | `700–900ms` | `duration-[900ms]` |
| Data reveal (bars filling) | `1200–1600ms` | `duration-[1400ms]` |

- Reveals triggered by `IntersectionObserver` in a `<Reveal>` client component at `threshold: 0.18`.
- Bars animate from `width: 0` on section enter, never on load. Use a `useEffect` hook with the observer or `framer-motion`'s `whileInView` if installed — pick one approach and stick with it.
- `@media (prefers-reduced-motion: reduce)` disables everything globally in `globals.css` — never override it.

---

## Components

Built as TSX components under `components/`. Naming: PascalCase, single component per file.

**Nav:** `<Nav />` — Fixed glass pill, `z-50`, `grid-cols-[1fr_auto_1fr]`, `rounded-full`. Includes `<ThemeToggle />`, sign-in ghost link, primary `<Pill>` CTA.

**Buttons:**
- `<Pill>` — inverted (`bg-fg text-bg`), primary nav action.
- `<CTA>` — glass translucent pill, mid-page primary. Serif italic `→` shifts `+4px` on hover.
- `<CTAGhost>` — text-only with italic *"or"* prefix.
- `<RowLink>` — `text-[13px]`, bottom-bordered, `+4px` arrow on hover.
- `<ThemeToggle>` — `34px` circle, sun/moon SVG `14px`, persists to `localStorage`.

**Eyebrow + headline cluster:**
```tsx
<div className="eyebrow">SECTION NAME</div>
<h2>Headline with an <span className="italic">italic</span> phrase.</h2>
<p className="lede">Optional supporting sentence.</p>
```

Define `.eyebrow` and `.lede` as `@layer components` utilities in `globals.css` rather than repeating long className strings inline.

**Figure card skeleton (`<FigureCard>`):**
```tsx
<FigureCard label="Label" subtitle="italic subtitle" fig="Fig. NN">
  {/* figure body */}
</FigureCard>
```

Five canonical figure patterns — implemented as separate components, not interchangeable:

| Component | Content type |
|---|---|
| `<PatternList>` | Longitudinal recurrence — year + animated bar + outcome |
| `<DreamText>` + `<DreamKey>` | Annotated narrative with inline `.ann` footnote chips |
| `<ScriptRevision>` | Before/after rewrites — crossed-out old, bold new |
| `<InsightTimeline>` | Time-to-X comparisons — long axis bars, large italic number |
| `<ReportMock>` | Multi-metric profile — `k / meter / pct` rows |
| `<PromptCard>` | Daily ritual — italic prompt, stream rows, streak pips |

---

## Forms

Form inputs are the one new component grammar permitted beyond what landed in the original spec. Build a `<Field>` component with `<FieldLabel>` and the appropriate input (`<Input>`, `<Textarea>`, `<Select>`).

**Input styling — strict:**
- `bg-glass-bg border border-hair rounded-[3px]`
- `px-4 py-[14px] text-[17px] font-sans text-fg`
- Focus: `focus:border-hair-strong focus:outline-none` — no glow, no ring.
- Labels: eyebrow style (`11px` sans 500 uppercase, `0.22em` tracking, `text-fg-mute`, `mb-[10px]`).
- Field group gap: `28px`.
- No placeholder text — labels do the work.
- Select indicator: serif italic `↓` as a sibling span absolutely positioned, not an SVG icon.

Form state via `react-hook-form` if installed, otherwise plain `useState`. Validation is minimal — `required` on email and message only. Server-side validation in the route handler.

---

## Data Visualisation

- One value channel per figure. Length carries the signal; color and shape are not differentiators.
- Hairline tracks (`bg-hair-strong`), solid `bg-fg` fills, small circular cap at fill end.
- Interpretive numbers: **serif italic** (`37×`, `~14 wks`). Raw numbers: **mono** (`.72`, `n = 2,418`).
- Animate bars from zero on section enter. Stagger `~100ms` per row.
- Every figure gets a `Fig. NN` header with italic subtitle and a summary footer.

---

## Portraits & Imagery

Portraits used: **Freud** (hero), **Lacan** (philosophy section), **anatomical brain** (work section).

Always use `next/image` with `priority` for above-the-fold portraits and explicit `width`/`height` to prevent layout shift.

Treatment rules:
1. Grayscale only. No tint, sepia, or duotone.
2. Radial-gradient mask — figure dissolves into atmosphere, asymmetric toward the side the portrait faces.
3. Dark theme: `mix-blend-mode: screen`, `filter: grayscale(1) contrast(1.05) brightness(1.02)`. Light: `multiply`, `brightness(0.98)`. Exception: transparent-PNG portraits (Lacan) use `normal`. Drive these via CSS custom properties `--portrait-blend` and `--portrait-filter` set per theme.
4. Caption: mono `PORTRAIT — YEAR` over serif italic `Name`, anchored to a far corner.

If a portrait is missing: use a subtly striped SVG placeholder. **Do not draw a face.**

---

## File & Folder Conventions

```
app/
  layout.tsx              ← fonts, ThemeProvider, Atmosphere, Grain, Nav, Footer
  globals.css             ← tokens, resets, atmosphere keyframes, typography utilities, reveal
  page.tsx                ← landing
  about/page.tsx
  contact/page.tsx
  method/page.tsx
  api/
    contact/route.ts      ← Supabase insert + email handoff
components/
  layout/                 ← Nav, Footer, Shell, Atmosphere, Grain, ThemeToggle, Reveal
  ui/                     ← Pill, CTA, CTAGhost, RowLink, Glass, Eyebrow, Field, Input, Textarea, Select
  figures/                ← PatternList, DreamText, ScriptRevision, InsightTimeline, ReportMock, PromptCard
  brand/                  ← Logo, Wordmark
lib/
  supabase/
    client.ts             ← browser client
    server.ts             ← server client (route handlers, server components)
  utils.ts                ← cn() className merger
public/
  images/                 ← Freud.png, Lacan.png, Brain.png
tailwind.config.ts
```

**Naming:**
- Route folders lowercase (`about/`, `contact/`).
- Component files PascalCase (`Nav.tsx`, `FigureCard.tsx`).
- Section IDs: lowercase, hyphenless single words where possible (`philosophy`, `brain`, `transform`, `outcomes`).

**`globals.css` order:**
1. `@tailwind base/components/utilities`
2. `:root` shared tokens
3. `:root[data-theme="dark"]`
4. `:root[data-theme="light"]`
5. Body resets + selection
6. Atmosphere keyframes (fog drift, ring pulse, brain breath, scroll hint)
7. `@layer components`: `.eyebrow`, `.lede`, `.serif-italic`, `.mono-label`, `.reveal` / `.reveal.in`
8. `@media (prefers-reduced-motion: reduce)` — disable all transitions/animations globally

---

## Supabase

- Client created via `@supabase/ssr` — separate clients for server (`lib/supabase/server.ts` using `cookies()`) and browser (`lib/supabase/client.ts`).
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server-only: `SUPABASE_SERVICE_ROLE_KEY` — never expose to client, never log.
- **Row Level Security required on every public table.** No exceptions. Write a migration that enables RLS and a policy in the same file.
- Tables created via SQL migrations in `supabase/migrations/`, not the dashboard. Each table has `created_at timestamptz default now()`, `id uuid default gen_random_uuid() primary key`.
- Contact form writes go through a server route handler (`app/api/contact/route.ts`), not directly from the client. The route validates input, then inserts using the server client.

---

## Accessibility

- `--fg` on `--bg` exceeds 14:1 contrast in both themes.
- `--fg-mute` is reserved for non-essential metadata — never the sole carrier of information.
- Never suppress `outline` globally. Custom focus: `outline outline-1 outline-fg outline-offset-2`.
- Decorative layers (`<Atmosphere />`, `<Grain />`) get `aria-hidden="true"` and `pointer-events-none`.
- Portraits: `alt` with subject name. Pure decoration: `alt=""`.
- Tap targets minimum `44×44px` on mobile.
- Heading levels descend in order (`h1` → `h2` → `h3`). Never skip a level for styling.
- Form fields: `<label htmlFor>` linked to `id`. Error messages associated via `aria-describedby`. Required fields use `aria-required`.

---

## Writing Conventions in JSX

- Use the actual `→` glyph, never `&rarr;`.
- En-dash in ranges: `–` (`8–12 years`). Non-breaking hyphen `‑`. Separator: `·` (middot).
- `<em>` only inside italic serif headings or quoted prompts — for nested italic-on-italic shift to `text-fg-dim`.
- Server components by default. Mark client components with `"use client"` only when needed: theme toggle, reveal observer, form state, any `useEffect`/`useState`.
- Never use `<a href>` for internal links — always `next/link`.

---

## Do / Don't

**Do**
- Pair a serif italic phrase with a sans clinical label in every headline cluster.
- Let figure cards breathe — `min-h-[520px]`, generous internal padding.
- Animate data on section enter, never on hover.
- Use mono only for metadata, labels, and timestamps.
- Test both themes for every new component.
- Keep components small and server-rendered unless interactivity demands `"use client"`.

**Don't**
- Don't introduce a new typeface. Three is the ceiling.
- Don't add a saturated color. The brand is monochrome by design.
- Don't render an icon larger than `16px` or fill it.
- Don't use rounded corners between `4px` and `20px`. Only: small (`3px`), card (`24px`), pill (`999px`).
- Don't write a headline without an italic phrase.
- Don't break the hairline grammar with thicker borders.
- Don't draw imagery in SVG by hand. Use real photography or a placeholder.
- Don't bypass RLS. Don't ship a table without a policy.
- Don't import the service-role key into a client component. Ever.

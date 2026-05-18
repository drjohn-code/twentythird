# TwentyThird — Design System

> *Psychodynamic AI for the inner life. A quiet room for serious thinking.*

This document is the canonical reference for the TwentyThird visual & interaction system. It exists to keep new pages, components, and marketing surfaces consistent with the editorial, clinical, slightly literary tone established in `Landing.html`.

---

## 1. Design Principles

The aesthetic is **editorial-clinical**: a 1920s monograph reissued by a contemporary research lab. Every decision should pull in one of these directions:

1. **Quiet over loud.** Whitespace, hairlines, and atmospheric fog do the work that color and gradient would do elsewhere. If a surface needs an accent to feel alive, it is under-designed.
2. **Literary over technical.** Headlines use a serif with real italics. Italics are a *voice*, not decoration — they soften a clinical phrase or mark the unconscious half of a thought.
3. **Clinical, not cold.** Data, ratios, and figures appear next to italic captions. The clinician and the poet share the page.
4. **Slow motion.** Animations breathe rather than snap. Easing curves are long; durations sit between 400ms and 1600ms. Nothing bounces.
5. **One frame per idea.** Each section earns the screen. No stacking unrelated ideas in a single block.
6. **Atmosphere as substrate.** Fog, grain, and soft halos are not decoration — they are the page itself. Surfaces sit *inside* the atmosphere, never on a flat canvas.

When in doubt: **remove**. Then check that the page still reads as a serious clinical instrument rather than a product page.

---

## 2. Brand & Voice

### Name
**TwentyThird** — always one word, capital T capital T. Never "23rd," "Twenty-Third," or "23." The numeric mark `23` appears only inside the logo's circular ring.

### Tagline
*Psychodynamic AI for the inner life.*

### Voice
- Speaks in short, certain sentences.
- Allows one literary flourish per paragraph, never two.
- Uses italics for the half-said: *desire*, *lack*, *already allowed*.
- Names things precisely — "primal scene," "father-imago," "intimacy threshold." Jargon is welcomed when it is accurate.
- Avoids "we believe," "imagine," "unlock," "journey," and all wellness clichés.

### Copy rhythm
- Headlines: one strong noun, then an italic qualifier. *"Decode **dream logic**, align goals."*
- Lede: one sentence stating the claim, one sentence describing the mechanism.
- Captions: italic, lowercase, never punctuated at the end.
- Numerals: use figures (`37×`, `n = 2,418`), not words, in any clinical context.

---

## 3. Logo

The logo is a circular mark: a thin outer ring, an arc drawn from 12 o'clock around to roughly 8 o'clock, a seed dot at the arc's origin, and `23` in Inter Medium centered inside. The arc reads as a partial revolution — the unconscious not yet fully circled.

### Construction
- Viewbox: `44 × 44`.
- Ring: `r=20.5`, stroke `0.7`, `opacity 0.28`.
- Arc: starts at `(22, 3.5)`, sweeps `1 1` to `(4.5, 28.5)`, stroke `1.1`, round caps.
- Seed: `r=1.7`, filled, at `(22, 3.5)`.
- `23` text: Inter Medium, `font-size: 20`, `letter-spacing: -0.02em`, centered (`dominant-baseline: central`).

### Color
All strokes and fills inherit `currentColor` — the mark adopts `var(--fg)` automatically and inverts cleanly between dark and light themes. Never recolor the mark.

### Wordmark pairing
`<svg.logo-mark> + <span>TwentyThird</span>`. The wordmark is Instrument Serif `20px`, `letter-spacing: -0.018em`. Gap between mark and word: `10px`. In the footer, mark scales to `34px` and wordmark to `22px`.

### Clear space
Minimum `12px` of clear space around the mark on all sides. Never crop the ring.

---

## 4. Color

The system has **two themes**, dark (default) and light. Both share semantic token names — never hardcode colors, always reach through tokens.

### Dark theme (default)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0a0b` | Page background |
| `--bg-soft` | `#101012` | Slightly elevated surface |
| `--fg` | `#ededee` | Primary text, primary stroke |
| `--fg-dim` | `#a0a0a6` | Secondary text, italic captions |
| `--fg-mute` | `#6a6a72` | Tertiary text, mono labels |
| `--hair` | `rgba(255,255,255,0.09)` | Default divider |
| `--hair-strong` | `rgba(255,255,255,0.16)` | Emphasis divider, hover borders |
| `--glass-bg` | `rgba(255,255,255,0.035)` | Glass surface fill |
| `--glass-bg-strong` | `rgba(255,255,255,0.06)` | Glass CTA fill |
| `--glass-hi` | `rgba(255,255,255,0.10)` | Glass top highlight (1px line) |
| `--fog-a` | `rgba(255,255,255,0.07)` | Brightest fog |
| `--fog-b` | `rgba(255,255,255,0.04)` | Mid fog |
| `--fog-c` | `rgba(255,255,255,0.05)` | Secondary fog |
| `--noise-opacity` | `0.035` | Grain layer opacity |
| `--portrait-blend` | `screen` | Mix-blend for portrait imagery |
| `--portrait-filter` | `grayscale(1) contrast(1.05) brightness(1.02)` | Portrait treatment |

### Light theme
| Token | Value | Role |
|---|---|---|
| `--bg` | `#f5f5f3` | Page background (warm off-white) |
| `--bg-soft` | `#ececea` | Elevated surface |
| `--fg` | `#121214` | Primary text |
| `--fg-dim` | `#5a5a60` | Secondary text |
| `--fg-mute` | `#8a8a90` | Tertiary text |
| `--hair` | `rgba(0,0,0,0.08)` | Divider |
| `--hair-strong` | `rgba(0,0,0,0.16)` | Emphasis divider |
| `--glass-bg` | `rgba(255,255,255,0.55)` | Glass fill |
| `--glass-bg-strong` | `rgba(255,255,255,0.72)` | Glass CTA fill |
| `--glass-hi` | `rgba(255,255,255,0.9)` | Glass highlight |
| `--fog-a/b/c` | black at `0.05` / `0.035` / `0.04` | Fog |
| `--noise-opacity` | `0.025` | Grain |
| `--portrait-blend` | `multiply` | Portrait blend |
| `--portrait-filter` | `grayscale(1) contrast(1.02) brightness(0.98)` | Portrait treatment |

### Rules
- **No saturated color anywhere.** Brand is monochrome. The closest thing to an accent is `--fg` used as a fill on bars and dots.
- **No gradients across hue.** Allowed gradients: alpha fades of `--fg`, `--fog-*`, or `--bg` only.
- **No hardcoded `#fff` / `#000`.** Always token.
- **Selection** uses inverted contrast: `::selection { background: var(--fg); color: var(--bg) }`.
- Theme transitions: `transition: background 500ms var(--ease), color 500ms var(--ease)` on `body`.

---

## 5. Typography

### Type stack
| Family | Variable | Use |
|---|---|---|
| **Instrument Serif** (400, 400 italic) | `--serif` | All display, headlines, italic captions, numeric values in clinical contexts |
| **Inter** (300/400/500/600) | `--sans` | Body copy, navigation, buttons |
| **JetBrains Mono** (400/500) | `--mono` | Eyebrows, figure labels, timestamps, ratios with units |

Fallback chains:
```css
--serif: "Instrument Serif", "EB Garamond", Georgia, serif;
--sans:  "Inter", system-ui, -apple-system, sans-serif;
--mono:  "JetBrains Mono", ui-monospace, monospace;
```

Body defaults: `17px / 1.55`, antialiased, `font-feature-settings: "ss01","cv11"`.

### Scale
| Role | Family | Size | Line | Tracking | Notes |
|---|---|---|---|---|---|
| Hero `h1` | serif | `clamp(48px, 7.2vw, 104px)` | `1.02` | `-0.025em` | italic span for "AI" / "Self-Discovery" |
| Final `h2` | serif | `clamp(48px, 7vw, 108px)` | `1.02` | `-0.025em` | italic line breaks |
| Section `h2` (split) | serif | `clamp(40px, 5.2vw, 76px)` | `1.04` | `-0.022em` | |
| Pinned `h2` (brain) | serif | `clamp(40px, 5vw, 72px)` | `1.05` | `-0.02em` | |
| Philosophy `h2` | serif | `clamp(34px, 4.4vw, 60px)` | `1.10` | `-0.02em` | |
| Row `h3` | serif | `clamp(32px, 3.5vw, 50px)` | `1.06` | `-0.02em` | |
| State `h3` | serif | `clamp(26px, 2.6vw, 38px)` | `1.12` | `-0.015em` | |
| Italic numeric (`v`, `pc-day`, `tl big`) | serif italic | `18–68px` | — | varies | clinical numerals |
| Body | sans | `16–17px` | `1.55–1.65` | — | `--fg-dim` for description copy |
| Wordmark | serif | `20–22px` | — | `-0.018em` | |
| Nav link / signin | sans | `13px` | — | `-0.005em` | `--fg-dim` → `--fg` on hover |
| CTA pill | sans 500 | `13px` | — | `-0.005em` | |
| `.eyebrow` | sans 500 | `11px` | — | `0.22em` | UPPERCASE, `--fg-mute` |
| `.mono` | mono | `11px` | — | `0.04em` | figure labels |
| Caption `name` | serif italic | `18px` | — | — | `--fg-dim` |

### Italic conventions
Italics are **semantic**. They appear in three contexts only:
1. Headlines — a single italic phrase per headline marks the unconscious / qualifying half of the idea.
2. Captions and clinical names — italic, lowercase, never punctuated.
3. Numeric values in clinical contexts (`~14 wks`, `intimacy threshold`, `obsessional · with hysterical traces`) — these are *interpretations*, not raw data.

Never use italics inside body paragraphs for emphasis. Use them only for terms of art and quoted dream content.

### Rules
- Headlines always set in serif. Sans-serif headlines are forbidden.
- Eyebrows always sans, mono is the alternative for figure metadata.
- Line height shrinks as font size grows. Hero is `1.02`. Body is `1.55–1.65`.
- Letter-spacing tightens as size grows; loosens for uppercase mono and eyebrows.
- Never stack three serif weights — Instrument Serif is single-weight by design.
- Set `text-wrap: pretty` on multi-line headlines wherever supported.

---

## 6. Spacing & Layout

### Container
- Max width `1240px`.
- Horizontal padding `36px` desktop, drops to viewport edges at mobile.
- Centered via `margin: 0 auto`.

### Section rhythm
| Section | Vertical padding | Min height |
|---|---|---|
| Hero | `padding-top: 110px` | `100vh` |
| Philosophy | `140px 0 120px` | `100vh` |
| Brain (pinned) | n/a — `height: 340vh` outer, `100vh` sticky inner | — |
| Split sections | `160px 0 120px` | — |
| Final CTA | `120px 0` | `90vh` |
| Footer | `80px 0 40px`, `margin-top: 60px` | — |

### Section head
A section starts with a `.section-head` block of `max-width: 780px`:
- Eyebrow (`11px` mono-ish sans, uppercase, tracked)
- `h2` headline (serif, italic phrase inside)
- Optional `.lede` paragraph (`17px`, `--fg-dim`, `max-width: 480px`)
- Bottom margin `90px` before content begins.

### Split row grid
`split-row` is the workhorse layout for content + figure pairs:
- Default: `grid-template-columns: 0.88fr 1.22fr` (copy left, figure right).
- `.reverse`: `1.22fr 0.88fr` and order swapped so copy stays right-aligned.
- Gap `80px`.
- `split-stack` between rows: `gap: 80px`.

### Hero grid
`grid-template-columns: 1fr 1.05fr` — portrait left, copy right. Portrait gets `margin-left: -2vw` so it bleeds slightly off the container.

### Philosophy grid
`grid-template-columns: 1.1fr 1fr`, gap `60px`, with copy left and portrait right. Copy gets `padding-left: 36px`, max-width `640px`.

### Footer grid
`1.4fr 1fr 1fr 1fr 1fr` — brand block then four link columns. Drops to `1fr 1fr` under 980px.

### Breakpoint
There is **one** breakpoint: `max-width: 980px`. Below it:
- All multi-column grids collapse to a single column.
- Hero and Philosophy turn their portraits into full-bleed atmospheric backgrounds at `opacity: 0.42` and `mask-image` radial fade. Copy overlays on top at `z-index: 2`.
- `brain-pin` un-pins: `height: auto`, sticky becomes static.
- Section padding compresses to `90px 0 80px`, split-row gap to `14px`.
- Nav loses `.nav-links` and becomes a two-column grid.

### Spatial rules
- **Hairline first.** Dividers are 1px and use `--hair`. Solid borders > 1px are forbidden except where deliberately heavy (the 3px `--fg` bar in `tl-fill.short`).
- **Gap, not margin.** All sibling layout uses `display: flex|grid` with `gap`. Inline-flow + margin is only allowed inside paragraph runs.
- Vertical rhythm inside a card uses `18–22px` between siblings; cards themselves separated by `60–80px`.

---

## 7. Surfaces

### Glass surface (`.glass`)
The signature surface — a translucent panel that sits over the fogged atmosphere.

```css
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--hair);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  position: relative;
}
.glass::before {
  /* 1px top highlight — the meniscus */
  content: "";
  position: absolute; left: 0; right: 0; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-hi), transparent);
  pointer-events: none;
}
```

Used by: nav pill, split-section figures (`.split-visual.glass`), final CTA pill.

### Atmosphere
The page has two stacked decorative layers, both `pointer-events: none`:

1. **`.atmosphere`** — `position: fixed; inset: 0; z-index: 0;` holding four `.fog` orbs (`fog-1` through `fog-4`). Each is a 40–70vw circle, radial-gradient fill of `--fog-*`, `filter: blur(110px)`, and a 32–50 second drift animation on alternate-reverse.
2. **`.grain`** — `position: fixed; inset: -50%; z-index: 1;` with an inline SVG `feTurbulence` filter at `--noise-opacity` (`0.035` dark, `0.025` light). `mix-blend-mode: overlay` on dark, `multiply` on light.

Content sits on `.shell { z-index: 2 }`.

### Cards inside figures (`.split-visual`)
- `border-radius: 24px`
- Padding `30px 34px`
- `min-height: 520px`
- Each gets its own internal radial fog: a `::after` pseudo with `radial-gradient(ellipse 80% 60% at 50% 0%, var(--fog-a), transparent 65%)`.
- Internal structure: header `.vh` (mono, hairline below) → body `.vb` (flex column, gap `18px`).

### Radii
| Token (implicit) | Value | Use |
|---|---|---|
| Pill | `999px` | Nav, CTA, theme-toggle, social icons |
| Card | `24px` | Figure cards |
| Small | `3px` | Annotations (`.dream-text .ann`) |
| None | `0` | Most hairline dividers and bars |

### Shadows
The system avoids shadows. The only allowed shadow patterns are:
- **Inner highlight** on CTAs: `box-shadow: inset 0 1px 0 var(--glass-hi), 0 1px 30px rgba(255,255,255,0.02);`
- **Drop shadow on portraits** rendered with `filter: drop-shadow(0 30px 80px rgba(0,0,0,0.4))` — used on the brain image only.

Never use Material-style elevation.

---

## 8. Motion

### Easing
```css
--ease:        cubic-bezier(0.22, 1, 0.36, 1);   /* outgoing — long tail */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* breathing */
```

Use `--ease` for entrances, hover lifts, and reveals. Use `--ease-in-out` for looping ambient animation (fog drift, ring pulse, scroll hint, brain breath).

### Duration scale
- **Microhover** (links, color shifts): `300ms`
- **CTAs, transforms, glass swaps**: `400ms`
- **Theme swap**: `500ms` (background + color simultaneously)
- **State change** (brain states, reveal): `700–900ms`
- **Data reveal** (bars filling): `1200–1600ms`

### Patterns

**Reveal on enter**
```css
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 900ms var(--ease), transform 900ms var(--ease); }
.reveal.in { opacity: 1; transform: translateY(0); }
```
Triggered by IntersectionObserver at `threshold: 0.18`.

**Bar fill** — bars start `width: 0` and animate to their semantic width when the parent `.split-section.in` toggles. Transition `1400ms var(--ease)` for pattern bars, `1600ms var(--ease) 200ms` for timeline fills, `1200ms var(--ease)` for meter bars. Each successive bar adds `100ms` of `transition-delay`.

**Ambient loops**
- Fog drift: `32–50s` `ease-in-out infinite alternate`. Each fog has its own keyframe with a small translate + scale.
- Brain breathe: `9s ease-in-out infinite alternate`, scale `1 → 1.04`, rotate `-0.5° → 0.6°`.
- Ring pulse: `8s ease-in-out infinite`, scale `1 → 1.04`, opacity `0.4 → 0.85`, staggered 1.5s.
- Scroll hint line: `2.4s` `var(--ease-in-out) infinite`, `scaleY` and opacity.

**Pinned scroll → state cycle**
The brain section uses `height: 340vh` outer, `position: sticky; top: 0; height: 100vh` inner. Scroll progress (computed from `getBoundingClientRect`) maps to an index `0 | 1 | 2`. States and progress pips toggle `.active`/`.done`. Old state translates down 20px while fading.

**Hover lifts** — `transform: translateY(-1px)` on CTAs. Never more than `1–2px`.

### Accessibility
A `@media (prefers-reduced-motion: reduce)` block disables every animation and transition globally and switches scroll behavior to auto. Never override it.

---

## 9. Components

### Nav (`.nav.glass`)
- Fixed, top `18px`, horizontally centered.
- Width `min(1240px, calc(100vw - 36px))`.
- `grid-template-columns: 1fr auto 1fr` — logo left, links centered, actions right.
- Padding `11px 16px 11px 22px`, `border-radius: 999px`.
- Sits at `z-index: 50`.
- Includes theme-toggle, "Sign in" ghost link, and a primary `.pill` CTA.

### Buttons

**Primary pill (`.pill`)** — inverted background, dark text:
- `padding: 8px 16px`; `background: var(--fg)`; `color: var(--bg)`.
- Sans 500, `13px`, `-0.005em`.
- Hover: `translateY(-1px)`, `opacity: 0.92`.

**CTA glass (`.cta`)** — translucent surface, used as primary mid-page action:
- `padding: 16px 26px`, `border-radius: 999px`.
- `background: var(--glass-bg-strong)`, `border: 1px solid var(--hair-strong)`, `backdrop-filter: blur(20px)`.
- Inner glass-highlight box-shadow.
- Includes a serif italic arrow `→` that translates `+4px` on hover.

**Ghost link (`.cta-ghost`)** — text-only with a serif italic *"or"* prefix:
- `13px`, `--fg-dim` → `--fg` on hover.

**Row link (`.row-link`)** — bottom-bordered link inside split rows:
- `13px`, `padding-bottom: 4px`, `border-bottom: 1px solid var(--hair)`.
- Hover: color → `--fg`, border → `--hair-strong`, arrow `+4px`.

**Theme toggle (`.theme-toggle`)** — `34px` circle, `1px var(--hair)` border, sun/moon SVG `14px`. Persists choice to `localStorage` under key `theme`.

### Eyebrow + headline cluster
The standard top of any content block:
```html
<div class="eyebrow">SECTION NAME</div>
<h2>Headline with an <span class="it">italic</span> phrase.</h2>
<p class="lede">Optional supporting sentence.</p>
```

### Figure card (`.split-visual.glass`)
Every clinical figure follows this skeleton:
```html
<div class="split-visual glass">
  <div class="vh">
    <span class="lhs"><span>Label</span> <em>italic subtitle</em></span>
    <span>Fig. NN</span>
  </div>
  <div class="vb"><!-- figure body --></div>
</div>
```

Five canonical figure body patterns exist; they are not interchangeable — each one belongs to a specific kind of content:

| Pattern | Use for | Visual signature |
|---|---|---|
| `.pattern-list` | Longitudinal recurrence | Year + animated bar + outcome, dashed dividers, summary triple |
| `.dream-text` + `.dream-key` | Annotated narrative | Italic serif paragraphs with inline `.ann` chip footnotes, 2-col numbered key |
| `.script-revision` | Before / after rewrites | Crossed-out italic `.sr-old` above bold `.sr-new` per line |
| `.insight-timeline` | Time-to-X comparisons | Long thin axis bars, large italic `.tl-summary .big` number |
| `.report-mock` | Multi-metric profile | `k / meter / pct` rows, italic dominant-structure footer |
| `.prompt-card` | Daily ritual / streak | Day-name header, italic prompt with `<em>` inside quotes, time-stamped stream, streak bar grid |

### Pattern list (`.pattern-list`)
- Three-column grid: `64px 1fr 100px`.
- `padding: 18px 0`, dashed bottom divider.
- Bars (`.bar`) start `width: 0`, animate to a semantic width when the section enters view.
- Right column is italic serif outcome label.
- Closes with `.pattern-summary`: three labeled k/v pairs separated by hairline.

### Annotation chip (`.dream-text .ann`)
- Inline, mono `9.5px`, uppercase, `0.16em` tracking.
- `border: 1px solid var(--hair)`, `border-radius: 3px`, `padding: 1px 8px`.
- Contains a `<sup>` numeric superscript (serif italic) + the term.
- Aligned to body with `vertical-align: 2px`.

### Meter row (`.rep-row`)
- Three-column grid: `1.1fr 1.4fr 40px`.
- Key italic serif `16px`, meter bar with hairline track and animated `--fg` fill terminating in a dot, right-aligned mono `.pct`.

### Stream row (`.pc-stream-row`)
- Five inline items: `dot · time · label · dur`.
- Dot `7px` circle; `.dot.done` filled with `--fg`.
- All mono uppercase except `.dur` (serif italic, sentence case).

### Progress pips (`.brain-progress`)
- Vertical `1px × 38px` tracks with a fill that grows from top to bottom as the matching brain state activates.
- Each track is preceded by an A/B/C mono label.

### Caption (`.caption`)
- Used over portraits.
- Two stacked lines: mono `PORTRAIT — YEAR` over serif italic `Name`.
- Positioned bottom-left for hero, bottom-right for philosophy.

### Footer
- 5-column grid (brand + 4 link columns).
- Column header `.label` is the same eyebrow style.
- Links are sans `14px`, `--fg-dim` → `--fg` on hover.
- Bottom bar: copyright left, locale + socials right, hairline divider above.

---

## 10. Iconography & Imagery

### Icons
- Only line icons. `stroke-width: 1.2–1.4`, never filled.
- Sized at `13–14px` inside a `30–34px` round container with a `1px var(--hair)` border.
- Color: `currentColor` so they inherit `--fg-dim` and shift to `--fg` on hover.
- Allowed icon set is intentionally minimal: theme sun/moon, arrow `→` (serif character, not an SVG), socials.
- **Never** draw a complex SVG by hand. Glyphs, hairlines, and serif arrows do the work that decorative icons would do elsewhere.

### Portraits & photography
Portraits are central to the brand — Freud in the hero, Lacan in the philosophy section, the anatomical brain in the work section. They follow a strict treatment:

1. **Grayscale only.** No tinted, sepia, or duotone treatments.
2. **Mask the edges.** Apply a `radial-gradient` mask so the figure dissolves into the page atmosphere. The mask is asymmetric — slightly off-center toward the side that the portrait faces.
3. **Blend with theme.**
   - Dark: `mix-blend-mode: screen`, `filter: grayscale(1) contrast(1.05) brightness(1.02)`.
   - Light: `mix-blend-mode: multiply`, `filter: grayscale(1) contrast(1.02) brightness(0.98)`.
   - Exception: transparent-PNG portraits (e.g. Lacan) skip `mix-blend-mode` and use `normal`.
4. **Caption with mono + serif italic** anchored to a far corner.

### Placeholders
If a portrait or real image is missing, use a subtly striped SVG placeholder of the correct aspect ratio with a mono caption explaining what belongs there. Do not draw a face.

### Background imagery
There is no background imagery. The atmosphere (fog + grain) replaces it.

---

## 11. Data Visualisation

The figure-card patterns above are also the entire chart vocabulary. The system rejects standard chart UI (axes with ticks, gridlines, legends in boxes, colored series).

Rules:
- **One value channel per figure.** Length or position carries the signal; color and shape are not differentiators.
- **Hairline tracks, solid fills.** Tracks use `--hair-strong`. Fills use `--fg`. End each fill with a small circular cap.
- **Numbers are serif italic** when they are interpretive (`37×`, `~14 wks`, `obsessional`). Numbers are mono when they are raw (`.72`, `n = 2,418`, `04 / 26`).
- **Animate from zero.** Bars and meters reveal on section enter, never on load. Stagger by `~100ms` per row.
- **Annotate generously.** Every figure gets a header (`Fig. NN` + italic subtitle) and a summary footer.

---

## 12. Accessibility

- **Color contrast.** `--fg` on `--bg` exceeds 14:1 in both themes. `--fg-dim` clears AA at body sizes. `--fg-mute` is reserved for non-essential metadata (mono labels) and must never carry information that is not also conveyed structurally.
- **Focus.** Inherit browser default focus rings; do not suppress `outline` globally. Where a custom focus is needed, use a 1px `--fg` outline with a 2px offset.
- **Reduced motion.** Already handled — every animation and transition turns off under `prefers-reduced-motion: reduce`.
- **Decorative layers** (`.atmosphere`, `.grain`, ring decoration) get `aria-hidden="true"` and `pointer-events: none`.
- **Portraits** carry an `alt` attribute with the subject's name. Pure-decoration imagery uses `alt=""`.
- **Tap targets** must be at least 44×44px on mobile — the nav pill and CTA already clear this; the social icons (`30px`) need to be padded if used on mobile primary actions.
- **Headings** descend in order (`h1` → `h2` → `h3`). Never skip a level for styling — use the appropriate class instead.

---

## 13. Writing Conventions in Markup

- Double-quote every attribute.
- Use the actual `→` glyph, never `&rarr;` or an SVG arrow.
- Use `&#8211;` for an en-dash in ranges (`8–12 years`), `&#8209;` for non-breaking hyphens inside compound terms (`father‑imago`), `·` (middot) as a separator between mono labels.
- Use `<em>` only inside italic serif headings or quoted prompts where a nested italic-on-italic shift to `--fg-dim` reads as a second voice.
- Section IDs are lowercase, hyphenless single words where possible (`#philosophy`, `#brain`, `#transform`, `#outcomes`). Use these as anchor targets in nav links.

---

## 14. Do / Don't

**Do**
- Pair a serif italic phrase with a sans clinical label in every headline cluster.
- Let figure cards breathe — `min-height: 520px`, generous internal padding.
- Animate data on section enter; never animate it on hover.
- Use mono only for metadata, labels, and timestamps. Anything you would write in a footnote.
- Test both themes for every new component before shipping.

**Don't**
- Don't introduce a new typeface. Three is the ceiling.
- Don't add a saturated color anywhere. The brand is monochrome by design.
- Don't render an icon larger than `16px` or fill it.
- Don't use rounded corners between `4px` and `20px` — small (`3px`) or card (`24px`) or pill (`999px`), nothing in between.
- Don't write a headline that does not contain an italic phrase.
- Don't break the hairline grammar with thicker borders.
- Don't draw imagery in SVG by hand. Use real photography or a placeholder.

---

## 15. File & Asset Conventions

- HTML entry points are title-cased with spaces: `Landing.html`, `Method.html`.
- Images live in `images/` and are named by subject in title case: `Freud.png`, `Lacan.png`, `Brain.png`.
- User uploads go to `uploads/`. They are never linked directly from HTML — they are copied or processed into `images/` first.
- All inline `<style>` lives in a single block at the top of the document and follows the order:
  1. `:root` tokens (shared)
  2. `:root[data-theme="dark"]` tokens
  3. `:root[data-theme="light"]` tokens
  4. Global resets (`*`, `html`, `body`, `::selection`, `a`, `button`)
  5. Atmosphere (`.atmosphere`, `.fog`, `.grain`)
  6. Typography utilities (`.serif`, `.eyebrow`, `.mono`, `.dim`, `.mute`)
  7. Surfaces (`.glass`)
  8. Component blocks (nav, layout, hero, philosophy, brain, split, figure patterns, final, footer)
  9. Responsive (`@media (max-width: 980px)`)
  10. `@media (prefers-reduced-motion: reduce)`
  11. Reveal helpers
- Theme preference persists via `localStorage.theme` (`"dark" | "light"`).

---

*If the system is doing its job, the page should feel less like software and more like a journal that listens back.*

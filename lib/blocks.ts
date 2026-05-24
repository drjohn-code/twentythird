// The twelve analytic readings.
//
// Six are visible on the Room dashboard (catalogue order, fixed) and
// shown long-form on /readings. The other six exist only in the
// clinical report — they live in the data model and shape the
// analyst's voice, but the dashboard never lists them. This is the
// structural reason to buy the report: more readings, fully developed.
//
// This file is the single source of truth used by:
//   - the Phase 0 migration's seed copy (kept in sync — if you edit a
//     definition here, edit it there too)
//   - Phase 1 BlockCard grid (six dashboard slugs)
//   - Phase 2 Readings page (long-form per slug + figure map)
//   - Phase 3 Catchup deltas (writes against all twelve)
//   - the case file view (intake-version reading rows)

export type BlockSurface = "dashboard" | "report";

export type BlockSlug =
  | "subconscious-loops"
  | "linguistic-unconscious"
  | "father-imago"
  | "intimacy-threshold"
  | "desire-structure"
  | "professional-block"
  | "mother-imago"
  | "dream-logic"
  | "relational-pattern"
  | "defenses"
  | "shadow"
  | "transference";

export type Block = {
  slug: BlockSlug;
  /** 1..6 for dashboard slugs; report-only slugs are 7..12 in catalogue order. */
  index: number;
  /** Italic subtitle. Lowercase. No trailing punctuation. */
  subtitle: string;
  /** Plain serif definition (2–4 sentences) for the BlockCard expansion and Readings page. */
  definition: string;
  surface: BlockSurface;
};

export const BLOCKS: readonly Block[] = [
  {
    slug: "subconscious-loops",
    index: 1,
    subtitle: "subconscious loops",
    definition:
      "Repeating sequences of feeling, action, and outcome that occur outside conscious choice. Naming the loop is the first interruption of it.",
    surface: "dashboard",
  },
  {
    slug: "linguistic-unconscious",
    index: 2,
    subtitle: "linguistic unconscious",
    definition:
      "The way unconscious material surfaces in word choice, repetition, slips, and the structure of speech — Lacan's claim that the unconscious is structured like a language.",
    surface: "dashboard",
  },
  {
    slug: "father-imago",
    index: 3,
    subtitle: "father‑imago",
    definition:
      "The internalized image of the father, formed early and partly mythic. It shapes how authority, ambition, and judgment are met later in life.",
    surface: "dashboard",
  },
  {
    slug: "intimacy-threshold",
    index: 4,
    subtitle: "intimacy threshold",
    definition:
      "The point at which closeness begins to feel like a risk, and a defensive move follows. Different for each person; surprisingly stable across relationships.",
    surface: "dashboard",
  },
  {
    slug: "desire-structure",
    index: 5,
    subtitle: "desire structure",
    definition:
      "What the user actually wants, distinguished from what they have been told to want. Often discovered by negation — by noticing what they refuse.",
    surface: "dashboard",
  },
  {
    slug: "professional-block",
    index: 6,
    subtitle: "professional block",
    definition:
      "Where work catches: the start, the middle, the finish, or the visibility. Each location has its own unconscious source.",
    surface: "dashboard",
  },
  {
    slug: "mother-imago",
    index: 7,
    subtitle: "mother‑imago",
    definition:
      "The internalized image of the mother — the first attunement, the first separation. It informs the texture of dependence and refuge.",
    surface: "report",
  },
  {
    slug: "dream-logic",
    index: 8,
    subtitle: "dream logic",
    definition:
      "The condensation and displacement at work in dream material. Read for the grammar, not the symbols.",
    surface: "report",
  },
  {
    slug: "relational-pattern",
    index: 9,
    subtitle: "relational pattern",
    definition:
      "The recurring posture taken in relationships — pursuer, withdrawer, parent, child, equal. Stable across partners more than the partners are stable across the user.",
    surface: "report",
  },
  {
    slug: "defenses",
    index: 10,
    subtitle: "defenses",
    definition:
      "The characteristic moves used to keep difficult material out of awareness — intellectualization, displacement, reaction formation, splitting. Defenses are not failures; they are old solutions.",
    surface: "report",
  },
  {
    slug: "shadow",
    index: 11,
    subtitle: "shadow",
    definition:
      "What has been disowned and assigned to others — the qualities the user is most certain they are not. Often the route to vitality.",
    surface: "report",
  },
  {
    slug: "transference",
    index: 12,
    subtitle: "transference",
    definition:
      "The way old relational figures are projected onto present ones — the analyst, the partner, the boss. The pattern reveals the imago.",
    surface: "report",
  },
] as const;

export const DASHBOARD_BLOCKS: readonly Block[] = BLOCKS.filter(
  (b) => b.surface === "dashboard",
);

export const REPORT_BLOCKS: readonly Block[] = BLOCKS.filter(
  (b) => b.surface === "report",
);

const BY_SLUG = new Map<BlockSlug, Block>(BLOCKS.map((b) => [b.slug, b]));

export function getBlock(slug: BlockSlug): Block {
  const b = BY_SLUG.get(slug);
  if (!b) throw new Error(`Unknown block slug: ${slug}`);
  return b;
}

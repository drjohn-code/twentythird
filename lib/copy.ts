// The analyst's voice, centralized.
//
// Any copy that lands in Room JSX should live here first. Today line
// variants, depth band lines, connection explainer, email subjects,
// per-block seed reading/takeaway/definition strings — everything the
// analyst says in the product belongs in one file so the voice stays
// coherent and translatable later.
//
// Voice rules (from CLAUDE.md):
//   - Short, certain sentences.
//   - Lowercase for italic captions and the today line.
//   - Period or em-dash at the end of the today line. No other punctuation.
//   - Italics signal the half-said. Don't italicize for emphasis.
//   - Numerals in clinical context are figures, never words.

import type { BlockSlug } from "@/lib/blocks";

// ──────────────────────────────────────────────────────────────────
// Today line
// ──────────────────────────────────────────────────────────────────
//
// Each entry is either a literal string or a function returning a
// string. The keys are what computeTodayLine() returns; the args it
// also returns are spread into the function.

export const todayLines = {
  quiet: "a quiet day. nothing pending.",
  catchupCompleted: "the catchup is in. the reading has shifted.",
  catchupConsider:
    "something from the latest catchup is asking to be brought into the room.",
  openDream: (day: string) => `a dream from ${day.toLowerCase()} is still open.`,
  unfinished: "we left something unfinished last time.",
  thinReading:
    "the reading is still thin — fifteen minutes of catchup would deepen it.",
  connectionAccepted: (name: string) =>
    `${name.toLowerCase()} has accepted the connection. the reading has more to work with now.`,
  connectionEnded: (name: string) =>
    `${name.toLowerCase()} has ended the connection. the reading will adjust over the next session.`,
  reportReady: "the clinical report is ready.",
  welcomeBack: "welcome back to the room.",
  initialReadingsGenerating:
    "the room is being prepared — your readings are taking shape.",
  safetyFollowup:
    "what was named at the last entry asks for care beyond the room — please reach out today.",
} as const;

export type TodayLineKey = keyof typeof todayLines;

// ──────────────────────────────────────────────────────────────────
// Reading Depth — band lines and explainer
// ──────────────────────────────────────────────────────────────────

export const depthLines = {
  deep: "the reading is deep. small adjustments from here.",
  steady: "the reading holds. catchups will sharpen it.",
  partial: "the reading is partial. there is more to give.",
  thin: "the reading is thin. it will sketch a shape, not yet a structure.",
} as const;

export type DepthBand = keyof typeof depthLines;

export const depthExplainer = `Reading depth describes how much of you the reading has had access to — from intake, from weekly catchups, from consultations, and from the people whose presence shapes you. A deeper reading is not a better person; it is a more accurate one. You can deepen it at any time, or leave it where it is.`;

// Three-band status — coarser than DepthBand. Drives the colored
// status word and the per-source ring/bar tone in Settings.
export type DepthStatus = "low" | "moderate" | "deep";

export const depthStatusWord: Record<DepthStatus, string> = {
  low: "Low",
  moderate: "Moderate",
  deep: "Accurate",
};

// TODO: refine moderate / deep copy with the analyst voice.
export const depthStatusLine: Record<DepthStatus, string> = {
  low: "the reading is thin. it will sketch a shape, not yet a structure.",
  moderate: "the reading is taking shape. it can hold a working hypothesis.",
  deep: "the reading is full enough to ground the work.",
};

// One short subtitle per sub-source for the 2×2 grid.
export const depthSourceSubtitle = {
  intake: "the questions you answered to begin.",
  catchups: "weekly check-ins that keep the reading current.",
  sessions: "longer consultations with the analyst.",
  connections: "people whose presence shapes the reading.",
} as const;

// ──────────────────────────────────────────────────────────────────
// Connections
// ──────────────────────────────────────────────────────────────────

export const connectionExplainer = `Up to two people whose presence shapes the reading. They do not see your readings; you do not see theirs. What they say about the relationship feeds the model that produces your readings, and yours feeds theirs.`;

export const inviteEmail = {
  subject: (inviterName: string) =>
    `${inviterName} would like you in the reading.`,
  // The body template is composed in lib/emails/invite.ts in Phase 6.
} as const;

// ──────────────────────────────────────────────────────────────────
// Consulting Room — closing ritual + input affordance
// ──────────────────────────────────────────────────────────────────

export const sessionClose = "that's our hour.";
export const sayItAffordance = "say it →";

// ──────────────────────────────────────────────────────────────────
// Per-block seed copy
//
// These match the seeds in supabase/migrations/<timestamp>_room.sql.
// The migration is the source of truth at row-insert time; this map
// is here for any client-side fallbacks (and for the Phase 1 BlockCard
// when there are no rows yet for some reason — should not happen, but
// the product has no "this hasn't loaded" state by design).
//
// The reading/takeaway pairs below are the v1 seeds shown to a new
// user before any catchup or session has refined them. Once Phase 3
// ships, real refined copy comes from the model — these stay for
// initial state only.
// ──────────────────────────────────────────────────────────────────

export type BlockSeed = {
  reading: string;
  takeaway: string;
  definition: string;
};

export const blockSeeds: Record<BlockSlug, BlockSeed> = {
  "subconscious-loops": {
    reading:
      "approaches closeness then engineers a small failure to step back.",
    takeaway: "the retreat is the loop. not the closeness.",
    definition:
      "Repeating sequences of feeling, action, and outcome that occur outside conscious choice. Naming the loop is the first interruption of it.",
  },
  "linguistic-unconscious": {
    reading:
      "speech doubles on the word “should” — site of an inherited demand.",
    takeaway: "someone else's voice is still speaking through this word.",
    definition:
      "The way unconscious material surfaces in word choice, repetition, slips, and the structure of speech — Lacan's claim that the unconscious is structured like a language.",
  },
  "father-imago": {
    reading:
      "judges from above before being judged from above — the position is identical.",
    takeaway: "the seat changes. the chair does not.",
    definition:
      "The internalized image of the father, formed early and partly mythic. It shapes how authority, ambition, and judgment are met later in life.",
  },
  "intimacy-threshold": {
    reading: "holds well until the other becomes legible — then withdraws.",
    takeaway: "being known is the edge, not being close.",
    definition:
      "The point at which closeness begins to feel like a risk, and a defensive move follows. Different for each person; surprisingly stable across relationships.",
  },
  "desire-structure": {
    reading: "names many wants, refuses two — the refusal is the signal.",
    takeaway: "what is pushed away points more clearly than what is chased.",
    definition:
      "What the user actually wants, distinguished from what they have been told to want. Often discovered by negation — by noticing what they refuse.",
  },
  "professional-block": {
    reading: "the finish line is where the doubt arrives, never the start.",
    takeaway: "the block is at visibility, not at effort.",
    definition:
      "Where work catches: the start, the middle, the finish, or the visibility. Each location has its own unconscious source.",
  },
  // Report-only — seed reading/takeaway are intentionally thin; the
  // dashboard never shows them. The migration uses the same "too early
  // to say" thin seed for v1 across all twelve so this map mirrors it
  // for the six dashboard slugs (rich seed) and gives thin seeds here
  // for the report-only six.
  "mother-imago": {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "early attunement leaves a long signature.",
    definition:
      "The internalized image of the mother — the first attunement, the first separation. It informs the texture of dependence and refuge.",
  },
  "dream-logic": {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "dream content has its own grammar.",
    definition:
      "The condensation and displacement at work in dream material. Read for the grammar, not the symbols.",
  },
  "relational-pattern": {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "the same shape appears across different rooms.",
    definition:
      "The recurring posture taken in relationships — pursuer, withdrawer, parent, child, equal. Stable across partners more than the partners are stable across the user.",
  },
  defenses: {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "the defense names what was once unbearable.",
    definition:
      "The characteristic moves used to keep difficult material out of awareness — intellectualization, displacement, reaction formation, splitting. Defenses are not failures; they are old solutions.",
  },
  shadow: {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "what is disowned still acts.",
    definition:
      "What has been disowned and assigned to others — the qualities the user is most certain they are not. Often the route to vitality.",
  },
  transference: {
    reading: "too early to say with confidence — the shape is forming.",
    takeaway: "old figures arrive in present rooms.",
    definition:
      "The way old relational figures are projected onto present ones — the analyst, the partner, the boss. The pattern reveals the imago.",
  },
};

// ──────────────────────────────────────────────────────────────────
// Resolve a TodayContext into a finished sentence.
//
// computeTodayLine() in lib/today.ts returns { key, args? }. This
// function turns that into the visible string.
// ──────────────────────────────────────────────────────────────────

export type TodayLineRef =
  | {
      key:
        | "quiet"
        | "catchupCompleted"
        | "catchupConsider"
        | "unfinished"
        | "thinReading"
        | "reportReady"
        | "welcomeBack"
        | "initialReadingsGenerating"
        | "safetyFollowup";
    }
  | { key: "openDream"; args: [day: string] }
  | { key: "connectionAccepted"; args: [name: string] }
  | { key: "connectionEnded"; args: [name: string] };

export function resolveTodayLine(ref: TodayLineRef): string {
  switch (ref.key) {
    case "openDream":
      return todayLines.openDream(ref.args[0]);
    case "connectionAccepted":
      return todayLines.connectionAccepted(ref.args[0]);
    case "connectionEnded":
      return todayLines.connectionEnded(ref.args[0]);
    default:
      return todayLines[ref.key];
  }
}

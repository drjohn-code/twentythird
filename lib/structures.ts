import "server-only";

import type { BlockSlug } from "@/lib/blocks";

// ────────────────────────────────────────────────────────────────────
// Clinical structures (Lacan + McWilliams / PDM-2).
//
// The radar on /room shows where the user sits across these four
// canonical psychodynamic personality structures. The labels are
// never the six reading titles — those readings are the *inputs* to
// the structure, not the structures themselves.
// ────────────────────────────────────────────────────────────────────

export type StructureCode =
  | "obsessional"
  | "hysterical"
  | "phobic"
  | "depressive";

export const STRUCTURE_CODES: readonly StructureCode[] = [
  "obsessional",
  "hysterical",
  "phobic",
  "depressive",
];

export type DashboardSlug =
  | "subconscious-loops"
  | "linguistic-unconscious"
  | "father-imago"
  | "intimacy-threshold"
  | "desire-structure"
  | "professional-block";

export const DASHBOARD_SLUG_LIST: readonly DashboardSlug[] = [
  "subconscious-loops",
  "linguistic-unconscious",
  "father-imago",
  "intimacy-threshold",
  "desire-structure",
  "professional-block",
];

export const STRUCTURE_LOADINGS: Record<
  StructureCode,
  Record<DashboardSlug, number>
> = {
  obsessional: {
    "subconscious-loops": 0.8,
    "professional-block": 0.85,
    "father-imago": 0.7,
    "intimacy-threshold": 0.3,
    "linguistic-unconscious": 0.2,
    "desire-structure": 0.2,
  },
  hysterical: {
    "linguistic-unconscious": 0.85,
    "desire-structure": 0.75,
    "intimacy-threshold": 0.65,
    "father-imago": 0.4,
    "subconscious-loops": 0.3,
    "professional-block": 0.15,
  },
  phobic: {
    "intimacy-threshold": 0.8,
    "subconscious-loops": 0.6,
    "desire-structure": 0.35,
    "linguistic-unconscious": 0.3,
    "father-imago": 0.25,
    "professional-block": 0.2,
  },
  depressive: {
    "father-imago": 0.8,
    "desire-structure": 0.55,
    "professional-block": 0.5,
    "intimacy-threshold": 0.4,
    "subconscious-loops": 0.35,
    "linguistic-unconscious": 0.2,
  },
};

// ────────────────────────────────────────────────────────────────────
// Analytics gating — when a diagram is unblurred. The signal for
// "has the user given us enough" is *never* reading_depth alone;
// it is the per-domain inputs.
// ────────────────────────────────────────────────────────────────────

export const ANALYTICS_THRESHOLDS = {
  structureMap: 0.3,
  subconsciousLoops: 0.2,
  linguisticUnconscious: 0.15,
  fatherImago: 0.2,
  intimacyThreshold: 0.2,
  desireStructure: 0.2,
  professionalBlock: 0.2,
} as const;

// Minimum weight an individual anchor must clear to count toward the
// "four of six anchors are real" gate for the StructureMap.
const ANCHOR_MIN_WEIGHT = 0.1;

// ────────────────────────────────────────────────────────────────────
// Placeholder fixtures — deterministic by user id. The blurred-
// underneath diagram is the same component the user would have seen
// if they had given enough data, but seeded with synthetic input.
// Em-dashes for node labels keep the placeholder semantically empty.
// ────────────────────────────────────────────────────────────────────

const EM = "—";

type LoopFixture = { nodes: string[] };
type LinguisticFixture = {
  markers: Array<{ label: string; count: number }>;
};
type AuthorityFixture = { position: number };
type ThresholdFixture = { anxiety: number; avoidance: number };
type DesireFixture = { wantTo: number; oughtTo: number; forbidden: number };
type DefenceFixture = {
  highlight: "mature" | "neurotic" | "immature" | "psychotic";
};

export const PLACEHOLDER_FIXTURES = {
  subconsciousLoops: [
    { nodes: [EM, EM, EM, EM] },
    { nodes: [EM, EM, EM] },
    { nodes: [EM, EM, EM, EM, EM] },
  ] satisfies LoopFixture[],
  linguisticUnconscious: [
    {
      markers: [
        { label: "modal verbs", count: 3 },
        { label: "negations", count: 2 },
        { label: "body words", count: 2 },
      ],
    },
    {
      markers: [
        { label: "passive constructions", count: 4 },
        { label: "modal verbs", count: 2 },
      ],
    },
    {
      markers: [
        { label: "temporal markers", count: 3 },
        { label: "negations", count: 3 },
        { label: "modal verbs", count: 2 },
        { label: "body words", count: 2 },
      ],
    },
  ] satisfies LinguisticFixture[],
  fatherImago: [
    { position: 0.32 },
    { position: 0.5 },
    { position: 0.68 },
  ] satisfies AuthorityFixture[],
  intimacyThreshold: [
    { anxiety: 0.62, avoidance: 0.34 },
    { anxiety: 0.38, avoidance: 0.66 },
    { anxiety: 0.5, avoidance: 0.5 },
  ] satisfies ThresholdFixture[],
  desireStructure: [
    { wantTo: 0.62, oughtTo: 0.48, forbidden: 0.28 },
    { wantTo: 0.42, oughtTo: 0.66, forbidden: 0.34 },
    { wantTo: 0.54, oughtTo: 0.52, forbidden: 0.4 },
  ] satisfies DesireFixture[],
  professionalBlock: [
    { highlight: "neurotic" },
    { highlight: "neurotic" },
    { highlight: "immature" },
  ] satisfies DefenceFixture[],
  structureMap: [
    {
      scores: [
        { code: "obsessional", score: 0.62 },
        { code: "hysterical", score: 0.48 },
        { code: "phobic", score: 0.34 },
        { code: "depressive", score: 0.42 },
      ],
    },
    {
      scores: [
        { code: "obsessional", score: 0.42 },
        { code: "hysterical", score: 0.6 },
        { code: "phobic", score: 0.48 },
        { code: "depressive", score: 0.38 },
      ],
    },
    {
      scores: [
        { code: "obsessional", score: 0.48 },
        { code: "hysterical", score: 0.46 },
        { code: "phobic", score: 0.5 },
        { code: "depressive", score: 0.52 },
      ],
    },
  ] satisfies Array<{
    scores: Array<{ code: StructureCode; score: number }>;
  }>,
} as const;

// ────────────────────────────────────────────────────────────────────
// Linguistic tally — exact substring matches across all free-text
// intake answers. No NLP, no model, no embedding. This is intentionally
// crude — the point is to show the user what is observable in their
// own words.
//
// TODO: replace with proper linguistic feature extraction once the
// intake pipeline grows a tagger.
// ────────────────────────────────────────────────────────────────────

const MARKER_PATTERNS: Record<string, RegExp> = {
  "modal verbs": /\b(should|must|ought|have to|need to|cannot)\b/gi,
  negations: /\b(not|never|no one|nothing|don'?t|won'?t|can'?t)\b/gi,
  "passive constructions": /\b(was|were|been|being)\s+\w+ed\b/gi,
  "body words": /\b(chest|stomach|throat|jaw|heart|gut|breath)\b/gi,
  "temporal markers":
    /\b(always|never|every time|sometimes|usually|often)\b/gi,
};

const SELF_BLAME =
  /\b(should(?:'?ve)?|not enough|failed|my fault|i fail|i can'?t|never enough|i let|i missed|i should)\b/gi;
const OTHER_BLAME =
  /\b(they|demanded|unfair|punished|forced|made me|expected me|they expect|they want)\b/gi;

const WANT_TO =
  /\b(want|wish|hope|long for|would love|would like|crave|desire)\b/gi;
const OUGHT_TO = /\b(should|must|ought|have to|need to|supposed to)\b/gi;
const FORBIDDEN =
  /\b(can'?t|cannot|forbidden|not allowed|won'?t let|impossible|off limits)\b/gi;

const ANXIETY_WORDS =
  /\b(anxious|worry|worried|afraid|fear|scared|abandoned|leave|lose|losing|panic|cling)\b/gi;
const AVOIDANCE_WORDS =
  /\b(distance|withdraw|withdrawn|alone|space|independent|shut down|shut off|pull away|retreat|avoid)\b/gi;

const IMMATURE_DEFENCE =
  /\b(blame|projected?|acting out|passive[- ]aggressive|fantasy|denial)\b/gi;
const MATURE_DEFENCE =
  /\b(humor|humour|sublimat|anticipat|suppress)\b/gi;

function countMatches(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

// ────────────────────────────────────────────────────────────────────
// Inputs + outputs
// ────────────────────────────────────────────────────────────────────

export interface StructureInputs {
  /** Latest weight per dashboard slug. Missing = treated as 0. */
  weights: Partial<Record<BlockSlug, number>>;
  /** Latest takeaway per dashboard slug — source of LoopCycle nodes. */
  takeaways: Partial<Record<BlockSlug, string>>;
  /** users_meta.reading_depth (0..1). */
  readingDepth: number;
  /** Free-text intake answers, pooled across all open questions. */
  freeText: string;
  /** User id — used as deterministic seed for placeholder fixtures. */
  userId: string;
}

export interface StructureResult {
  scores: Array<{ code: StructureCode; score: number }>;
  dominant: {
    primary: StructureCode | "mixed";
    secondary?: StructureCode;
    mode: "single" | "with-traces" | "mixed";
  };
  isBlurred: boolean;
  blurReason?: "few_anchors" | "low_depth";
}

export type DiagramInput =
  | {
      slug: "subconscious-loops";
      nodes: string[];
      isBlurred: boolean;
    }
  | {
      slug: "linguistic-unconscious";
      markers: Array<{ label: string; count: number }>;
      isBlurred: boolean;
    }
  | {
      slug: "father-imago";
      position: number;
      isBlurred: boolean;
    }
  | {
      slug: "intimacy-threshold";
      anxiety: number;
      avoidance: number;
      isBlurred: boolean;
    }
  | {
      slug: "desire-structure";
      wantTo: number;
      oughtTo: number;
      forbidden: number;
      isBlurred: boolean;
    }
  | {
      slug: "professional-block";
      highlight: "mature" | "neurotic" | "immature" | "psychotic";
      isBlurred: boolean;
    };

// ────────────────────────────────────────────────────────────────────
// Compute
// ────────────────────────────────────────────────────────────────────

export function computeStructure(input: StructureInputs): StructureResult {
  // Anchor gate: at least 4 of 6 anchors have weight > 0.10.
  const anchorsWithWeight = DASHBOARD_SLUG_LIST.filter(
    (slug) => (input.weights[slug] ?? 0) > ANCHOR_MIN_WEIGHT,
  ).length;
  const hasEnoughAnchors = anchorsWithWeight >= 4;
  const hasEnoughDepth =
    input.readingDepth >= ANALYTICS_THRESHOLDS.structureMap;
  const isBlurred = !hasEnoughAnchors || !hasEnoughDepth;
  const blurReason: StructureResult["blurReason"] = !hasEnoughAnchors
    ? "few_anchors"
    : !hasEnoughDepth
      ? "low_depth"
      : undefined;

  // Real scores — even when blurred we compute them so the underlay
  // is structurally honest if a future intake landed it just above.
  const realScores: Array<{ code: StructureCode; score: number }> =
    STRUCTURE_CODES.map((code) => {
      const loadings = STRUCTURE_LOADINGS[code];
      const sumOfLoadings = DASHBOARD_SLUG_LIST.reduce(
        (acc, slug) => acc + loadings[slug],
        0,
      );
      const weighted = DASHBOARD_SLUG_LIST.reduce((acc, slug) => {
        const w = input.weights[slug] ?? 0;
        return acc + w * loadings[slug];
      }, 0);
      return {
        code,
        score: sumOfLoadings > 0 ? weighted / sumOfLoadings : 0,
      };
    });

  // When blurred, swap to a deterministic placeholder set so the
  // visual underneath the blur is identical across renders.
  const scores = isBlurred
    ? PLACEHOLDER_FIXTURES.structureMap[
        seedFromUserId(input.userId, PLACEHOLDER_FIXTURES.structureMap.length)
      ].scores
    : realScores;

  // Dominant figure copy logic.
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const [top, second, , fourth] = sorted;
  let dominant: StructureResult["dominant"];

  if (top.score === 0 && (second?.score ?? 0) === 0) {
    dominant = { primary: "mixed", mode: "mixed" };
  } else if (
    fourth &&
    fourth.score > 0 &&
    top.score - fourth.score < 0.15 * top.score
  ) {
    dominant = { primary: "mixed", mode: "mixed" };
  } else if (second && top.score <= 1.35 * second.score) {
    dominant = {
      primary: top.code,
      secondary: second.code,
      mode: "with-traces",
    };
  } else {
    dominant = { primary: top.code, mode: "single" };
  }

  return {
    scores,
    dominant,
    isBlurred,
    blurReason,
  };
}

export function computeReadingDiagramInput(
  slug: BlockSlug,
  input: StructureInputs,
): DiagramInput | null {
  const userSeed = (count: number) => seedFromUserId(input.userId, count);
  const realWeight = input.weights[slug] ?? 0;

  switch (slug) {
    case "subconscious-loops": {
      const nodes = parseLoopNodes(input.takeaways[slug] ?? "");
      const enoughWeight =
        realWeight >= ANALYTICS_THRESHOLDS.subconsciousLoops;
      const enoughNodes = nodes.length >= 2;
      const isBlurred = !(enoughWeight && enoughNodes);
      const fixture =
        PLACEHOLDER_FIXTURES.subconsciousLoops[
          userSeed(PLACEHOLDER_FIXTURES.subconsciousLoops.length)
        ];
      return {
        slug: "subconscious-loops",
        nodes: isBlurred ? fixture.nodes : nodes,
        isBlurred,
      };
    }

    case "linguistic-unconscious": {
      const tally = tallyLinguisticMarkers(input.freeText);
      const enoughWeight =
        realWeight >= ANALYTICS_THRESHOLDS.linguisticUnconscious;
      const significant = tally.filter((m) => m.count >= 2);
      const enoughMarkers = significant.length >= 2;
      const isBlurred = !(enoughWeight && enoughMarkers);
      const fixture =
        PLACEHOLDER_FIXTURES.linguisticUnconscious[
          userSeed(PLACEHOLDER_FIXTURES.linguisticUnconscious.length)
        ];
      return {
        slug: "linguistic-unconscious",
        markers: isBlurred ? fixture.markers : significant.slice(0, 4),
        isBlurred,
      };
    }

    case "father-imago": {
      const self = countMatches(input.freeText, SELF_BLAME);
      const other = countMatches(input.freeText, OTHER_BLAME);
      const total = self + other;
      const enoughWeight = realWeight >= ANALYTICS_THRESHOLDS.fatherImago;
      const enoughHits = self >= 2 || other >= 2;
      const isBlurred = !(enoughWeight && enoughHits);
      const realPosition =
        total > 0 ? other / total : 0.5; // 0 = internal severity, 1 = external authority
      const fixture =
        PLACEHOLDER_FIXTURES.fatherImago[
          userSeed(PLACEHOLDER_FIXTURES.fatherImago.length)
        ];
      return {
        slug: "father-imago",
        position: isBlurred ? fixture.position : realPosition,
        isBlurred,
      };
    }

    case "intimacy-threshold": {
      const anxietyHits = countMatches(input.freeText, ANXIETY_WORDS);
      const avoidanceHits = countMatches(input.freeText, AVOIDANCE_WORDS);
      const enoughWeight =
        realWeight >= ANALYTICS_THRESHOLDS.intimacyThreshold;
      const enoughHits = anxietyHits + avoidanceHits >= 3;
      const isBlurred = !(enoughWeight && enoughHits);
      const max = Math.max(anxietyHits, avoidanceHits, 1);
      const realAnxiety = Math.min(0.92, anxietyHits / (max + 1) + 0.15);
      const realAvoidance = Math.min(
        0.92,
        avoidanceHits / (max + 1) + 0.15,
      );
      const fixture =
        PLACEHOLDER_FIXTURES.intimacyThreshold[
          userSeed(PLACEHOLDER_FIXTURES.intimacyThreshold.length)
        ];
      return {
        slug: "intimacy-threshold",
        anxiety: isBlurred ? fixture.anxiety : realAnxiety,
        avoidance: isBlurred ? fixture.avoidance : realAvoidance,
        isBlurred,
      };
    }

    case "desire-structure": {
      const wantHits = countMatches(input.freeText, WANT_TO);
      const oughtHits = countMatches(input.freeText, OUGHT_TO);
      const forbiddenHits = countMatches(input.freeText, FORBIDDEN);
      const max = Math.max(wantHits, oughtHits, forbiddenHits, 1);
      const enoughWeight =
        realWeight >= ANALYTICS_THRESHOLDS.desireStructure;
      const enoughHits = wantHits + oughtHits + forbiddenHits >= 3;
      const isBlurred = !(enoughWeight && enoughHits);
      const fixture =
        PLACEHOLDER_FIXTURES.desireStructure[
          userSeed(PLACEHOLDER_FIXTURES.desireStructure.length)
        ];
      return {
        slug: "desire-structure",
        wantTo: isBlurred ? fixture.wantTo : Math.min(0.95, wantHits / max),
        oughtTo: isBlurred
          ? fixture.oughtTo
          : Math.min(0.95, oughtHits / max),
        forbidden: isBlurred
          ? fixture.forbidden
          : Math.min(0.95, forbiddenHits / max),
        isBlurred,
      };
    }

    case "professional-block": {
      const enoughWeight =
        realWeight >= ANALYTICS_THRESHOLDS.professionalBlock;
      const isBlurred = !enoughWeight;
      const immatureHits = countMatches(input.freeText, IMMATURE_DEFENCE);
      const matureHits = countMatches(input.freeText, MATURE_DEFENCE);
      const realHighlight: DefenceFixture["highlight"] =
        immatureHits >= 3 && immatureHits > matureHits
          ? "immature"
          : matureHits >= 3 && matureHits > immatureHits
            ? "mature"
            : "neurotic";
      const fixture =
        PLACEHOLDER_FIXTURES.professionalBlock[
          userSeed(PLACEHOLDER_FIXTURES.professionalBlock.length)
        ];
      return {
        slug: "professional-block",
        highlight: isBlurred ? fixture.highlight : realHighlight,
        isBlurred,
      };
    }

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function seedFromUserId(userId: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % Math.max(1, mod);
}

function parseLoopNodes(takeaway: string): string[] {
  if (!takeaway || takeaway.indexOf("→") === -1) return [];
  // Strip the lead-in clause like "the loop is" before the first arrow.
  let segment = takeaway;
  const firstArrow = segment.indexOf("→");
  const colonIdx = segment.lastIndexOf(":", firstArrow);
  const isIdx = segment.toLowerCase().lastIndexOf(" is ", firstArrow);
  const cut = Math.max(
    colonIdx >= 0 ? colonIdx + 1 : -1,
    isIdx >= 0 ? isIdx + 4 : -1,
  );
  if (cut > 0) segment = segment.slice(cut);
  return segment
    .split("→")
    .map((s) =>
      s
        .trim()
        .replace(/^the loop is\s+/i, "")
        .replace(/[.,;]+$/, "")
        .toLowerCase(),
    )
    .filter((s) => s.length > 0 && s.length <= 32)
    .slice(0, 5);
}

function tallyLinguisticMarkers(
  freeText: string,
): Array<{ label: string; count: number }> {
  const out: Array<{ label: string; count: number }> = [];
  for (const [label, re] of Object.entries(MARKER_PATTERNS)) {
    const count = countMatches(freeText, re);
    if (count > 0) out.push({ label, count });
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

export const STRUCTURE_LABEL: Record<StructureCode, string> = {
  obsessional: "obsessional",
  hysterical: "hysterical",
  phobic: "phobic",
  depressive: "depressive",
};

// Formats a StructureResult's dominant figure into the canonical
// serif-italic clinical line. Three legal forms.
export function formatDominantLine(
  dominant: StructureResult["dominant"],
): string {
  if (dominant.mode === "mixed") return "mixed · no dominant figure yet";
  if (dominant.mode === "with-traces" && dominant.secondary) {
    return `${STRUCTURE_LABEL[dominant.primary as StructureCode]} · with ${
      STRUCTURE_LABEL[dominant.secondary]
    } traces`;
  }
  return STRUCTURE_LABEL[dominant.primary as StructureCode];
}

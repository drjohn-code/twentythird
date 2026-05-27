import { createClient } from "@/lib/supabase/server";
import Glass from "@/components/ui/Glass";
import BlockSection from "@/components/room/BlockSection";
import ClinicalReportCTA from "@/components/room/ClinicalReportCTA";
import ReadingDiagram from "@/components/room/analytics/ReadingDiagram";
import { DASHBOARD_BLOCKS, type BlockSlug } from "@/lib/blocks";
import { blockSeeds } from "@/lib/copy";
import { queueReadingLede } from "@/lib/ai/reading-lede-jobs";
import {
  computeReadingDiagramInput,
  type StructureInputs,
} from "@/lib/structures";

type BlockReadingRow = {
  id: string;
  block_slug: string;
  reading: string;
  takeaway: string;
  definition: string | null;
  weight: number | null;
  last_refined_source: string | null;
  version: number;
  created_at: string;
  lede: string | null;
};

type SubscriptionRow = {
  status: string | null;
};

type IntakeResponseRow = {
  step_number: number;
  payload: Record<string, unknown> | null;
};

type IntakeAnswerRow = {
  question_key: string;
  answer: { value: unknown } | null;
  version: number;
};

const FIGURE_INDEX: Record<BlockSlug, number> = {
  "subconscious-loops": 1,
  "linguistic-unconscious": 2,
  "father-imago": 3,
  "intimacy-threshold": 4,
  "desire-structure": 5,
  "professional-block": 6,
  // report-only slugs — not rendered on this page, kept for typing
  "mother-imago": 0,
  "dream-logic": 0,
  "relational-pattern": 0,
  defenses: 0,
  shadow: 0,
  transference: 0,
};

export default async function ReadingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // (room) layout has already guaranteed a session. Narrow for TS.
  if (!user) return null;

  const monthStartIso = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      1,
      0,
      0,
      0,
    ),
  ).toISOString();

  const [
    metaRes,
    readingsRes,
    subRes,
    monthReportRes,
    intakeResponsesRes,
    intakeAnswersRes,
  ] = await Promise.all([
    supabase
      .from("users_meta")
      .select("reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<{ reading_depth: number | null }>(),
    supabase
      .from("block_readings")
      .select(
        "id, block_slug, reading, takeaway, definition, weight, last_refined_source, version, created_at, lede",
      )
      .eq("user_id", user.id)
      .is("superseded_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "clinical")
      .gte("created_at", monthStartIso),
    supabase
      .from("intake_responses")
      .select("step_number, payload")
      .eq("user_id", user.id),
    supabase
      .from("intake_answers")
      .select("question_key, answer, version")
      .eq("user_id", user.id),
  ]);

  const depth = metaRes.data?.reading_depth ?? 0;
  const isSubscribed = subRes.data?.status === "active";
  const monthlyReportUsed =
    isSubscribed && (monthReportRes.count ?? 0) >= 1;

  const readingsBySlug = new Map<string, BlockReadingRow>();
  let mostRecentAt: Date | null = null;
  for (const row of (readingsRes.data ?? []) as BlockReadingRow[]) {
    readingsBySlug.set(row.block_slug, row);
    const ts = new Date(row.created_at);
    if (!mostRecentAt || ts > mostRecentAt) mostRecentAt = ts;
  }

  const structureInputs: StructureInputs = {
    weights: weightsFrom(readingsBySlug),
    takeaways: takeawaysFrom(readingsBySlug),
    readingDepth: depth,
    freeText: gatherFreeText(
      (intakeResponsesRes.data ?? []) as IntakeResponseRow[],
      (intakeAnswersRes.data ?? []) as IntakeAnswerRow[],
    ),
    userId: user.id,
  };

  return (
    <>
      {/* Top strip — last-refined + mini depth meter */}
      <section className="room-section reading-strip-wrap">
        <Glass className="reading-strip">
          <span className="reading-strip-left">
            <span className="reading-strip-label">last refined</span>
            <span className="reading-strip-date">
              {formatRefinedDate(mostRecentAt)}
            </span>
          </span>
          <span className="reading-strip-right">
            <span className="reading-strip-label">reading depth</span>
            <span className="reading-mini-meter" aria-hidden="true">
              <span
                className="reading-mini-meter-fill"
                style={{ width: `${Math.max(0, Math.min(1, depth)) * 100}%` }}
              />
            </span>
          </span>
        </Glass>
      </section>

      {/* Six BlockSections in catalogue order */}
      {DASHBOARD_BLOCKS.map((b) => {
        const row = readingsBySlug.get(b.slug);
        const definition = row?.definition ?? b.definition;
        const lede = ledeFromRow(b.slug, row);
        const hasPriorReadings = row ? row.version > 1 : false;
        if (row && (!row.lede || row.lede.trim().length === 0)) {
          // Queue regeneration in the background — the page renders
          // a fallback lede this time; the next visit shows the real
          // one.
          void queueReadingLede({
            userId: user.id,
            blockReadingId: row.id,
            slug: b.slug,
          });
        }
        const diagramInput = computeReadingDiagramInput(
          b.slug,
          structureInputs,
        );
        return (
          <BlockSection
            key={b.slug}
            index={FIGURE_INDEX[b.slug]}
            slug={b.slug}
            subtitle={b.subtitle}
            definition={definition}
            readingLede={lede}
            hasPriorReadings={hasPriorReadings}
            figure={
              diagramInput ? (
                <ReadingDiagram input={diagramInput} size="section" />
              ) : null
            }
          />
        );
      })}

      <ClinicalReportCTA
        isSubscribed={isSubscribed}
        depth={depth}
        monthlyReportUsed={monthlyReportUsed}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Reading lede — cached AI prose lives on block_readings.lede.
// When present, we render it as a single paragraph (split on blank
// lines if the model wrote multiple). When missing, we fall back to
// the opening reading + the seed tail and queue regeneration.
// ────────────────────────────────────────────────────────────────────

function ledeFromRow(
  slug: BlockSlug,
  row: BlockReadingRow | undefined,
): string[] {
  if (row?.lede && row.lede.trim().length > 0) {
    const paragraphs = row.lede
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return paragraphs.length > 0
      ? paragraphs
      : [row.lede.trim()];
  }
  const opening =
    (row?.reading ?? blockSeeds[slug].reading).replace(/^./, (c) =>
      c.toUpperCase(),
    );
  const tail = LEDE_TAIL[slug] ?? [];
  return [opening, ...tail];
}

const LEDE_TAIL: Partial<Record<BlockSlug, string[]>> = {
  "subconscious-loops": [
    "The loop is older than the relationships it appears in — it predates them, and is rehearsed inside each one with small variations.",
    "Naming the move is the first interruption. The second is allowing the closeness to last past the point where the engineered failure would arrive.",
  ],
  "linguistic-unconscious": [
    "Word choice is rarely accidental. Where a sentence stalls, repeats, or self-corrects, an older grammar is asserting itself underneath the present-day claim.",
    "Listen for the word that does the most work and the word the sentence will not finish around. Both mark a site.",
  ],
  "father-imago": [
    "The internal figure is composite — partly the historical father, partly the position the father occupied. The position is the more durable inheritance.",
    "Authority, ambition, and judgment are met along the contour this figure traced. Working with it is not a refusal; it is a re-staging.",
  ],
  "intimacy-threshold": [
    "Closeness is welcomed up to a particular legibility. When the other moves from object of interest to subject who can see in return, the threshold appears.",
    "The withdrawal is not from the person but from being known. Treating the two as different is the first move.",
  ],
  "desire-structure": [
    "What is wanted and what is permitted often diverge. The refusals are where the structure is most visible — what is set aside is shaped by an older economy.",
    "The work is not to override the refusal but to read it. The refused object usually names a desire the wanted object only gestures toward.",
  ],
  "professional-block": [
    "The block sits at a specific phase of the work — start, middle, finish, or visibility. Each has its own unconscious source and asks for a different intervention.",
    "Where the doubt arrives reliably, look for an old prohibition against the type of exposure that phase requires.",
  ],
};

function formatRefinedDate(d: Date | null): string {
  if (!d) return "—";
  return d
    .toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

function weightsFrom(
  readingsBySlug: Map<string, BlockReadingRow>,
): StructureInputs["weights"] {
  const out: StructureInputs["weights"] = {};
  for (const [slug, row] of readingsBySlug) {
    out[slug as keyof StructureInputs["weights"]] = row.weight ?? 0;
  }
  return out;
}

function takeawaysFrom(
  readingsBySlug: Map<string, BlockReadingRow>,
): StructureInputs["takeaways"] {
  const out: StructureInputs["takeaways"] = {};
  for (const [slug, row] of readingsBySlug) {
    out[slug as keyof StructureInputs["takeaways"]] = row.takeaway ?? "";
  }
  return out;
}

function gatherFreeText(
  responses: IntakeResponseRow[],
  edits: IntakeAnswerRow[],
): string {
  const chunks: string[] = [];
  for (const r of responses) {
    if (!r.payload) continue;
    for (const v of Object.values(r.payload)) {
      if (typeof v === "string" && v.length > 10 && v.includes(" ")) {
        chunks.push(v);
      }
    }
  }
  for (const a of edits) {
    const v = a.answer?.value;
    if (typeof v === "string" && v.length > 10 && v.includes(" ")) {
      chunks.push(v);
    }
  }
  return chunks.join(" ");
}

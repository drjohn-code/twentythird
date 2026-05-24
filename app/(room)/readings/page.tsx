import { createClient } from "@/lib/supabase/server";
import Glass from "@/components/ui/Glass";
import FigureCard from "@/components/figures/FigureCard";
import PatternList from "@/components/figures/PatternList";
import DreamText, { Ann } from "@/components/figures/DreamText";
import DreamKey from "@/components/figures/DreamKey";
import ReportMock from "@/components/figures/ReportMock";
import ScriptRevision from "@/components/figures/ScriptRevision";
import BlockSection from "@/components/room/BlockSection";
import ClinicalReportCTA from "@/components/room/ClinicalReportCTA";
import { DASHBOARD_BLOCKS, type BlockSlug } from "@/lib/blocks";
import { blockSeeds } from "@/lib/copy";

type BlockReadingRow = {
  block_slug: string;
  reading: string;
  takeaway: string;
  definition: string | null;
  weight: number | null;
  last_refined_source: string | null;
  version: number;
  created_at: string;
};

type SubscriptionRow = {
  status: string | null;
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

  const [metaRes, readingsRes, subRes] = await Promise.all([
    supabase
      .from("users_meta")
      .select("reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<{ reading_depth: number | null }>(),
    supabase
      .from("block_readings")
      .select(
        "block_slug, reading, takeaway, definition, weight, last_refined_source, version, created_at",
      )
      .eq("user_id", user.id)
      .is("superseded_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
  ]);

  const depth = metaRes.data?.reading_depth ?? 0;
  const isSubscribed = subRes.data?.status === "active";

  const readingsBySlug = new Map<string, BlockReadingRow>();
  let mostRecentAt: Date | null = null;
  for (const row of (readingsRes.data ?? []) as BlockReadingRow[]) {
    readingsBySlug.set(row.block_slug, row);
    const ts = new Date(row.created_at);
    if (!mostRecentAt || ts > mostRecentAt) mostRecentAt = ts;
  }

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
        const lede = readingLedeFor(b.slug, row?.reading ?? blockSeeds[b.slug].reading);
        const hasPriorReadings = row ? row.version > 1 : false;
        return (
          <BlockSection
            key={b.slug}
            index={FIGURE_INDEX[b.slug]}
            slug={b.slug}
            subtitle={b.subtitle}
            definition={definition}
            readingLede={lede}
            hasPriorReadings={hasPriorReadings}
            figure={figureFor(b.slug)}
          />
        );
      })}

      <ClinicalReportCTA isSubscribed={isSubscribed} depth={depth} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Reading lede — short serif paragraphs specific to the user.
//
// Until the model is wired (Phase 3+ refinement), we open with the
// current reading row's italic line and follow with two stub
// paragraphs that explain its texture. The shape is intentional:
// observation, mechanism, prognosis.
// TODO: model-driven reading lede.
// ────────────────────────────────────────────────────────────────────

function readingLedeFor(slug: BlockSlug, openingReading: string): string[] {
  const opening = openingReading.replace(/^./, (c) => c.toUpperCase());
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

// ────────────────────────────────────────────────────────────────────
// Figure mapping — each slug owns one figure pattern from
// components/figures. The figures use stub data for now;
// TODO: hydrate from refined model output once Phase 3+ writes it.
// ────────────────────────────────────────────────────────────────────

function figureFor(slug: BlockSlug) {
  switch (slug) {
    case "subconscious-loops":
      return (
        <FigureCard
          label="LONGITUDINAL"
          subtitle="recurrence"
          fig="Fig. 01"
        >
          <PatternList
            rows={[
              { year: "2014", width: 56, outcome: "first cycle, repaired late" },
              { year: "2017", width: 64, outcome: "same shape, faster exit" },
              { year: "2021", width: 58, outcome: "named, not yet altered" },
              { year: "2024", width: 62, outcome: "interrupted once" },
            ]}
            summary={[
              { k: "frequency", v: "~3.2y" },
              { k: "duration", v: "~14 wks", italic: true },
              { k: "trend", v: "softening", italic: true },
            ]}
          />
        </FigureCard>
      );
    case "linguistic-unconscious":
      return (
        <FigureCard
          label="ANNOTATED"
          subtitle="speech sample"
          fig="Fig. 02"
        >
          <DreamText
            paragraphs={[
              <>
                I keep telling myself I <Ann n="1">should</Ann> have
                been further along by now, but every time the work is
                almost finished I find a reason to begin{" "}
                <Ann n="2">again</Ann>.
              </>,
              <>
                It is not that I do not want it &mdash; I do, only it
                feels like the want is{" "}
                <Ann n="3">already someone else&rsquo;s</Ann>.
              </>,
            ]}
          />
          <DreamKey
            entries={[
              { n: "01", label: "should", gloss: "inherited demand" },
              { n: "02", label: "again", gloss: "loop marker" },
              {
                n: "03",
                label: "already someone else's",
                gloss: "displaced desire",
              },
            ]}
          />
        </FigureCard>
      );
    case "father-imago":
      return (
        <FigureCard
          label="PROFILE"
          subtitle="father position"
          fig="Fig. 03"
        >
          <ReportMock
            caseLabel="case · self"
            prepared="last refined · this week"
            rows={[
              { k: "authority received", pct: ".68", width: 68 },
              { k: "authority granted", pct: ".71", width: 71 },
              { k: "judgment internal", pct: ".82", width: 82 },
            ]}
            footerLabel="dominant posture"
            footerValue="judge · before being judged"
          />
        </FigureCard>
      );
    case "intimacy-threshold":
      return (
        <FigureCard
          label="PROFILE"
          subtitle="closeness response"
          fig="Fig. 04"
        >
          <ReportMock
            caseLabel="case · self"
            prepared="last refined · this week"
            rows={[
              { k: "tolerated proximity", pct: ".74", width: 74 },
              { k: "withdrawal latency", pct: ".46", width: 46 },
              { k: "repair openness", pct: ".58", width: 58 },
            ]}
            footerLabel="threshold sits at"
            footerValue="legibility · not nearness"
          />
        </FigureCard>
      );
    case "desire-structure":
      return (
        <FigureCard
          label="PROFILE"
          subtitle="want vs. refusal"
          fig="Fig. 05"
        >
          <ReportMock
            caseLabel="case · self"
            prepared="last refined · this week"
            rows={[
              { k: "stated wants", pct: ".77", width: 77 },
              { k: "active refusals", pct: ".62", width: 62 },
              { k: "named desire", pct: ".34", width: 34 },
            ]}
            footerLabel="signal carried by"
            footerValue="the refusal · not the want"
          />
        </FigureCard>
      );
    case "professional-block":
      return (
        <FigureCard
          label="REVISION"
          subtitle="working scripts"
          fig="Fig. 06"
        >
          <ScriptRevision
            rows={[
              {
                prefix: "START",
                old: "I need it perfect before I begin.",
                next: "I begin in draft. The shape arrives by working.",
              },
              {
                prefix: "FINISH",
                old: "If I finish, they will see what is missing.",
                next: "If I finish, the work begins its own conversation.",
              },
              {
                prefix: "SHOW",
                old: "It is not ready to be seen.",
                next: "Being seen is the last step of the work, not after it.",
              },
            ]}
            metaLeft={{ label: "site", value: "visibility" }}
            metaRight={{ label: "trend", value: "softening" }}
          />
        </FigureCard>
      );
    default:
      return null;
  }
}

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

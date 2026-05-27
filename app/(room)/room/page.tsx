import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import Glass from "@/components/ui/Glass";
import FigureCard from "@/components/figures/FigureCard";
import InsightTimeline from "@/components/figures/InsightTimeline";
import Reveal from "@/components/layout/Reveal";
import RoomHero from "@/components/room/RoomHero";
import BlockCard from "@/components/room/BlockCard";
import Hairline from "@/components/room/Hairline";
import SessionPreview from "@/components/room/SessionPreview";
import StructureMap from "@/components/room/analytics/StructureMap";
import ReadingDiagram from "@/components/room/analytics/ReadingDiagram";
import { DASHBOARD_BLOCKS } from "@/lib/blocks";
import { blockSeeds } from "@/lib/copy";
import { firstNameFrom } from "@/lib/connections";
import {
  computeStructure,
  computeReadingDiagramInput,
  type StructureInputs,
} from "@/lib/structures";

type BlockReadingRow = {
  block_slug: string;
  reading: string;
  takeaway: string;
  definition: string | null;
  weight: number | null;
  last_refined_source: string | null;
  version: number;
};

type SubscriptionRow = {
  status: string | null;
};

type CatchupSummaryRow = {
  week_number: number;
  created_at: string;
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

const ISO_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function RoomLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The (room) layout already guarantees a session — this is a
  // defensive narrow to satisfy the type checker.
  if (!user) return null;

  const [
    metaRes,
    profileRes,
    readingsRes,
    subRes,
    catchupsRes,
    intakeResponsesRes,
    intakeAnswersRes,
  ] = await Promise.all([
    supabase
      .from("users_meta")
      .select("reading_depth, display_name")
      .eq("user_id", user.id)
      .maybeSingle<{ reading_depth: number | null; display_name: string | null }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>(),
    supabase
      .from("block_readings")
      .select(
        "block_slug, reading, takeaway, definition, weight, last_refined_source, version",
      )
      .eq("user_id", user.id)
      .is("superseded_at", null),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("catchups")
      .select("week_number, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
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
  const firstName = firstNameFrom(
    metaRes.data?.display_name ?? profileRes.data?.full_name ?? null,
  );

  const readingsBySlug = new Map<string, BlockReadingRow>();
  for (const row of (readingsRes.data ?? []) as BlockReadingRow[]) {
    readingsBySlug.set(row.block_slug, row);
  }

  const latestCatchup =
    (catchupsRes.data as CatchupSummaryRow[] | null)?.[0] ?? null;
  const catchupWithinThisWeek =
    latestCatchup &&
    Date.now() - new Date(latestCatchup.created_at).getTime() < ISO_WEEK_MS;

  // ── Build StructureInputs from already-loaded data ──────────────
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

  const structure = computeStructure(structureInputs);

  return (
    <>
      {/* 1 — Landing hero */}
      <RoomHero firstName={firstName} depth={depth} />

      {/* 2 — Latest reading preview */}
      <section className="room-section">
        <Reveal className="room-split">
          <div className="room-split-copy">
            <Eyebrow>LATEST READING</Eyebrow>
            <h2>
              Six readings <span className="it">— and what shifts.</span>
            </h2>
            <p className="lede">
              The six readings are computed from your intake and refined
              by each Catchup, consultation, and accepted connection. The
              structure is steady; the texture moves.
            </p>
            {structure.isBlurred ? (
              <RowLink href="/settings#depth">
                strengthen the data for analytics
              </RowLink>
            ) : (
              <RowLink href="/readings">open the readings</RowLink>
            )}
          </div>
          <div className="room-split-figure">
            <StructureMap result={structure} />
          </div>
        </Reveal>
      </section>

      <Hairline />

      {/* 3 — The six readings */}
      <section className="room-section">
        <Reveal as="div" className="room-section-head">
          <Eyebrow>THE SIX READINGS</Eyebrow>
          <h2 className="serif room-split-copy-h" style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(28px, 3vw, 38px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            What is being read <span className="it">in you, right now.</span>
          </h2>
        </Reveal>
        <Reveal as="div" className="block-grid">
          {DASHBOARD_BLOCKS.map((b) => {
            const row = readingsBySlug.get(b.slug);
            const seed = blockSeeds[b.slug];
            const diagramInput = computeReadingDiagramInput(
              b.slug,
              structureInputs,
            );
            return (
              <BlockCard
                key={b.slug}
                index={b.index}
                slug={b.slug}
                subtitle={b.subtitle}
                reading={row?.reading ?? seed.reading}
                takeaway={row?.takeaway ?? seed.takeaway}
                diagram={
                  diagramInput ? (
                    <ReadingDiagram input={diagramInput} size="card" />
                  ) : null
                }
              />
            );
          })}
        </Reveal>
      </section>

      <Hairline />

      {/* 4 — Catchup card */}
      <section className="room-section">
        <Reveal className="room-split reverse">
          <div className="room-split-figure">
            <FigureCard
              label="CATCHUPS"
              subtitle="recent weeks"
              fig="Fig. 02"
            >
              <InsightTimeline
                heading="window"
                range="last 4 weeks"
                markers={catchupMarkers(
                  catchupsRes.data as CatchupSummaryRow[] | null,
                )}
                summaryBig={`${(catchupsRes.data as CatchupSummaryRow[] | null)?.length ?? 0}`}
                summaryLabel="catchups in window"
              />
            </FigureCard>
          </div>
          <div className="room-split-copy">
            <Eyebrow>WEEKLY CATCHUP</Eyebrow>
            <h2>
              Sit with the week. <span className="it">Then we look again.</span>
            </h2>
            <p className="lede">
              Eight short questions. Honest is better than long. The
              answers refine the reading.
            </p>
            <div className="room-card-cta-row">
              {catchupWithinThisWeek ? (
                <span className="room-card-foot">
                  completed — read the summary
                </span>
              ) : (
                <CTA href="/catchup">Open this week&rsquo;s catchup</CTA>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <Hairline />

      {/* 5 — Consulting Room card */}
      <section className="room-section">
        <Reveal className="room-split">
          <div className="room-split-copy">
            <Eyebrow>CONSULTING ROOM</Eyebrow>
            <h2>
              An hour with <span className="it">the analyst.</span>
            </h2>
            <p className="lede">
              {isSubscribed
                ? "Open whenever the week presses. The room remembers what you have already said."
                : "Subscribers can enter the consulting room — a long-form session with the analyst, held in the same voice as your readings."}
            </p>
            <div className="room-card-cta-row">
              <CTA href="/consulting">
                {isSubscribed
                  ? "Enter the consulting room"
                  : "Enter the consulting room"}
              </CTA>
            </div>
          </div>
          <div className="room-split-figure">
            {isSubscribed ? (
              <FigureCard
                label="LAST SESSION"
                subtitle="held question"
                fig="Fig. 03"
              >
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: "20px",
                    color: "var(--fg-dim)",
                    lineHeight: 1.4,
                    padding: "20px 0",
                  }}
                >
                  &ldquo;the dream from tuesday — do you want to return to
                  it?&rdquo;
                </p>
              </FigureCard>
            ) : (
              <Glass as="div" className="consulting-placeholder">
                <SessionPreview />
              </Glass>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

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
      if (
        typeof v === "string" &&
        v.length > 10 &&
        v.includes(" ")
      ) {
        chunks.push(v);
      }
    }
  }
  for (const a of edits) {
    const v = a.answer?.value;
    if (
      typeof v === "string" &&
      v.length > 10 &&
      v.includes(" ")
    ) {
      chunks.push(v);
    }
  }
  return chunks.join(" ");
}

function catchupMarkers(
  rows: CatchupSummaryRow[] | null,
): { day: number; label?: string }[] {
  if (!rows || rows.length === 0) {
    return [{ day: 23, label: "first" }];
  }
  // Map the last four catchups onto the timeline figure's 1..23 axis
  // as evenly-spaced markers — the timeline grammar is reused only
  // for its visual shape, not its semantics.
  const max = Math.max(rows.length, 4);
  return rows.slice(0, 4).map((r, i) => ({
    day: Math.round(((i + 1) / max) * 23),
    label: `w${r.week_number}`,
  }));
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import Glass from "@/components/ui/Glass";
import FigureCard from "@/components/figures/FigureCard";
import ReportMock from "@/components/figures/ReportMock";
import InsightTimeline from "@/components/figures/InsightTimeline";
import Reveal from "@/components/layout/Reveal";
import DepthMeter from "@/components/room/DepthMeter";
import BlockCard from "@/components/room/BlockCard";
import Hairline from "@/components/room/Hairline";
import { DASHBOARD_BLOCKS } from "@/lib/blocks";
import { blockSeeds } from "@/lib/copy";

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

type CaseEntryRow = {
  entry_id: string;
  entry_kind: string;
  entry_title: string;
  entry_summary: string;
  occurred_at: string;
};

type CatchupSummaryRow = {
  week_number: number;
  created_at: string;
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
    readingsRes,
    subRes,
    catchupsRes,
    caseFileRes,
    activeConnectionsRes,
  ] = await Promise.all([
    supabase
      .from("users_meta")
      .select("reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<{ reading_depth: number | null }>(),
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
      .from("case_file_entries")
      .select("entry_id, entry_kind, entry_title, entry_summary, occurred_at")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(3),
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("inviter_user_id", user.id)
      .eq("status", "active"),
  ]);

  const depth = metaRes.data?.reading_depth ?? 0;
  const isSubscribed = subRes.data?.status === "active";
  const activeConnectionCount = activeConnectionsRes.count ?? 0;
  const showDeepenIntake = depth < 0.7;
  const showInviteConnection = activeConnectionCount < 2;

  const readingsBySlug = new Map<string, BlockReadingRow>();
  for (const row of (readingsRes.data ?? []) as BlockReadingRow[]) {
    readingsBySlug.set(row.block_slug, row);
  }

  const latestCatchup =
    (catchupsRes.data as CatchupSummaryRow[] | null)?.[0] ?? null;
  const catchupWithinThisWeek =
    latestCatchup &&
    Date.now() - new Date(latestCatchup.created_at).getTime() < ISO_WEEK_MS;

  const caseFileRows = (caseFileRes.data as CaseEntryRow[] | null) ?? [];

  return (
    <>
      {/* 1 — Reading Depth */}
      <section className="room-section">
        <DepthMeter
          variant="landing"
          depth={depth}
          prompt={largestMissingSource({
            depth,
            recentCatchupCount:
              (catchupsRes.data as CatchupSummaryRow[] | null)?.length ?? 0,
          })}
        />
        {showDeepenIntake || showInviteConnection ? (
          <div className="mt-6 flex flex-col gap-4">
            {showDeepenIntake ? (
              <RowLink href="/settings#intake">deepen the intake</RowLink>
            ) : null}
            {showInviteConnection ? (
              <RowLink href="/settings#connections">
                invite a connection
              </RowLink>
            ) : null}
          </div>
        ) : null}
      </section>

      <Hairline />

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
            <RowLink href="/readings">open the readings</RowLink>
          </div>
          <div className="room-split-figure">
            <FigureCard
              label="STRUCTURE"
              subtitle="dominant figure"
              fig="Fig. 01"
            >
              <ReportMock
                caseLabel="case · self"
                prepared="prepared · this week"
                rows={topThreeMeters(readingsBySlug)}
                footerLabel="dominant structure"
                footerValue="obsessional · with hysterical traces"
              />
            </FigureCard>
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
            return (
              <BlockCard
                key={b.slug}
                index={b.index}
                subtitle={b.subtitle}
                reading={row?.reading ?? seed.reading}
                takeaway={row?.takeaway ?? seed.takeaway}
                definition={row?.definition ?? b.definition}
                weight={row?.weight ?? 0.6}
                refinedLabel={refinedLabel(row?.last_refined_source)}
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
                <span>the consulting room</span>
              </Glass>
            )}
          </div>
        </Reveal>
      </section>

      <Hairline />

      {/* 6 — Case File preview */}
      <section className="room-section">
        <Reveal as="div" className="room-section-head">
          <Eyebrow>CASE FILE</Eyebrow>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(28px, 3vw, 38px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            A record, kept <span className="it">quietly.</span>
          </h2>
        </Reveal>
        <Reveal as="div" className="case-preview">
          {caseFileRows.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--serif)",
                fontStyle: "italic",
                color: "var(--fg-dim)",
                fontSize: "17px",
              }}
            >
              the case file is empty for now — the first catchup will
              open it.
            </p>
          ) : (
            caseFileRows.map((row) => (
              <div key={row.entry_id} className="case-preview-row">
                <span className="case-preview-date">
                  {formatCaseDate(row.occurred_at)}
                </span>
                <span className="case-preview-kind">
                  {row.entry_kind}
                </span>
                <span className="case-preview-title">
                  {row.entry_title}
                </span>
              </div>
            ))
          )}
        </Reveal>
        <div>
          <RowLink href="/case-file">open the case file</RowLink>
        </div>
      </section>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function topThreeMeters(
  readingsBySlug: Map<string, BlockReadingRow>,
): { k: string; pct: string; width: number }[] {
  const rows = DASHBOARD_BLOCKS.slice(0, 3).map((b) => {
    const row = readingsBySlug.get(b.slug);
    const w = Math.round((row?.weight ?? 0.6) * 100);
    return {
      k: b.subtitle,
      pct: `.${String(Math.max(0, Math.min(99, w))).padStart(2, "0")}`,
      width: w,
    };
  });
  return rows;
}

function refinedLabel(lastRefinedSource: string | null | undefined): string {
  if (!lastRefinedSource) return "intake reading · v1";
  // Phase 3+ writes labels like "catchup:week_04"; surface as
  // "refined after catchup · week 04".
  const catchupMatch = /^catchup:week_(\d+)$/i.exec(lastRefinedSource);
  if (catchupMatch) {
    return `refined after catchup · week ${catchupMatch[1].padStart(2, "0")}`;
  }
  if (lastRefinedSource.startsWith("session:")) {
    return "refined after session";
  }
  return lastRefinedSource;
}

function formatCaseDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
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

function largestMissingSource({
  depth,
  recentCatchupCount,
}: {
  depth: number;
  recentCatchupCount: number;
}): { href: string; label: string } | null {
  if (depth >= 0.5) return null;
  // Priority per the build prompt. Intake completeness is the layout
  // gate (we wouldn't be here without it submitted) so the first
  // checkable rung is "no recent catchup".
  if (recentCatchupCount === 0) {
    return { href: "/catchup", label: "open this week's catchup" };
  }
  // Other branches (connections, sessions) need server fetches that
  // would duplicate the layout's work — wire them in Phase 5/6 once
  // connections/sessions are real surfaces.
  return { href: "/catchup", label: "open this week's catchup" };
}

import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import ScriptRevision from "../../components/figures/ScriptRevision";

export const metadata: Metadata = {
  title: "Insight, then habit — TwentyThird",
  description:
    "Daily prompts and small rituals built around your structure, not a generic curriculum. The integration layer of TwentyThird.",
};

type DayCardProps = {
  day: string;
  num: string;
  prompt: React.ReactNode;
  stream: Array<{ label: string; time: string; done?: boolean }>;
  pips: boolean[];
};

function DayCard({ day, num, prompt, stream, pips }: DayCardProps) {
  return (
    <div className="week-card">
      <div className="wc-head">
        <span className="wc-day">{day}</span>
        <span className="wc-num">{num}</span>
      </div>
      <div className="wc-prompt">{prompt}</div>
      <div className="wc-stream">
        {stream.map((row, i) => (
          <div key={i} className="wc-stream-row">
            <span className={row.done ? "wc-dot done" : "wc-dot"}></span>
            <span className="wc-label">{row.label}</span>
            <span>{row.time}</span>
          </div>
        ))}
      </div>
      <div className="wc-pips" aria-hidden="true">
        {pips.map((on, i) => (
          <i key={i} className={on ? "on" : ""}></i>
        ))}
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              INTEGRATION
            </div>
            <h1>
              Insight, then <span className="it">habit</span>.
            </h1>
            <p className="lede">
              Naming a pattern is only the first move. The plan is the second —
              daily prompts and small rituals built around your structure, not
              a generic curriculum.
            </p>
          </div>
        </div>
      </Reveal>

      {/* A WEEK IN THE PLAN */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">A WEEK IN THE PLAN</div>
            <h2 className="head-h2">
              Seven prompts,{" "}
              <span className="it">one structure</span>.
            </h2>
            <p className="lede">
              Reflective, embodied, written. The week breathes around the
              pattern the report named, not around a curriculum.
            </p>
          </Reveal>

          <Reveal>
            <div className="week-grid">
              <DayCard
                day="MON"
                num="01"
                prompt={<>&ldquo;Where today did you choose <em>not</em> to be seen?&rdquo;</>}
                stream={[
                  { label: "journal", time: "07:10", done: true },
                  { label: "shadow prompt", time: "20:00" },
                ]}
                pips={[true, true, true, false, false, false, false]}
              />
              <DayCard
                day="TUE"
                num="02"
                prompt={<>&ldquo;Take a walk without an errand. Note one thing you almost said.&rdquo;</>}
                stream={[
                  { label: "walking", time: "08:30", done: true },
                  { label: "note", time: "09:10", done: true },
                ]}
                pips={[true, true, true, true, false, false, false]}
              />
              <DayCard
                day="WED"
                num="03"
                prompt={<>&ldquo;What did you over-qualify today, and what was the <em>unqualified</em> sentence underneath?&rdquo;</>}
                stream={[
                  { label: "breath-work", time: "06:30", done: true },
                  { label: "journal", time: "12:45", done: true },
                  { label: "shadow prompt", time: "20:00" },
                ]}
                pips={[true, true, true, true, true, false, false]}
              />
              <DayCard
                day="THU"
                num="04"
                prompt={<>&ldquo;A body scan from the throat down. Where does the holding live?&rdquo;</>}
                stream={[
                  { label: "body scan", time: "07:00", done: true },
                  { label: "note", time: "07:20", done: true },
                ]}
                pips={[true, true, true, true, true, true, false]}
              />
              <DayCard
                day="FRI"
                num="05"
                prompt={<>&ldquo;Write the sentence you would have said if you were already allowed.&rdquo;</>}
                stream={[
                  { label: "journal", time: "08:00", done: true },
                  { label: "rewrite", time: "20:30" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
              <DayCard
                day="SAT"
                num="06"
                prompt={<>&ldquo;A long walk. No prompts. Notice what the silence brings back.&rdquo;</>}
                stream={[
                  { label: "walking", time: "10:00" },
                  { label: "rest", time: "—" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
              <DayCard
                day="SUN"
                num="07"
                prompt={<>&ldquo;Read the week back. Which line was already <em>true</em>?&rdquo;</>}
                stream={[
                  { label: "review", time: "19:00" },
                  { label: "note", time: "19:30" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW THE PLAN ADAPTS */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">ADAPTATION</div>
            <h2 className="head-h2">
              The plan <span className="it">tapers</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Adaptation
                  </span>
                </div>
                <h3>
                  Last week&apos;s recurrence sets next week&apos;s{" "}
                  <span className="it">density</span>.
                </h3>
                <p>
                  When the pattern strength drops, the prompts thin. When a
                  pattern surges, the prompts return. The aim is not adherence.
                  The aim is the smallest scaffolding the structure still
                  needs.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="prompt density"
                  subtitle="weeks 1–8"
                  fig="Fig. 01"
                >
                  <InsightTimeline
                    heading="Prompt count · per week"
                    range="tapering as recurrence weakens"
                    markers={[
                      { day: 1, label: "wk 1" },
                      { day: 7, label: "wk 3" },
                      { day: 14, label: "wk 5" },
                      { day: 23, label: "wk 8", inflection: true },
                    ]}
                    summaryBig="~38%"
                    summaryLabel={"fewer prompts\nby wk 8"}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* SHADOW WORK */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">SHADOW WORK</div>
            <h2 className="head-h2">
              Not catharsis. <span className="it">Speaking</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Shadow
                  </span>
                </div>
                <h3>
                  The deliberate practice of speaking what was{" "}
                  <span className="it">unspeakable</span>.
                </h3>
                <p>
                  Shadow work, in this context, is not exposure. It is not a
                  purge. It is the slow practice of saying — to oneself, first
                  — what one had been taught to keep unsaid. Three before /
                  after lines drawn from real plans.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="shadow revisions"
                  subtitle="three lines, working draft"
                  fig="Fig. 02"
                >
                  <ScriptRevision
                    rows={[
                      {
                        prefix: "01 · to self",
                        old: "I do not deserve this.",
                        next: "I have not yet practised wanting it aloud.",
                      },
                      {
                        prefix: "02 · to self",
                        old: "I should be over this by now.",
                        next: "the timeline I borrowed was not for this kind of grief.",
                      },
                      {
                        prefix: "03 · to self",
                        old: "I am too much.",
                        next: "I am exactly the volume the room was not built for.",
                      },
                    ]}
                    metaLeft={{ label: "previously", value: "said about self" }}
                    metaRight={{ label: "now", value: "said to self" }}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* HELD BY STRUCTURE, NOT CURRICULUM */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">FRAME</div>
            <h2 className="head-h2">
              Held by structure, not by{" "}
              <span className="it">curriculum</span>.
            </h2>
          </Reveal>

          <Reveal className="mono-prose">
            <p>
              A curriculum is a set of moves a stranger built. A structure is
              the shape your particular life happens to take. The plan is
              built against the latter. Every prompt is anchored to a line in
              your report — when the line dissolves, the prompt does too.
            </p>
            <p>
              Nothing here is supposed to be permanent. The plan is rented.
              The structure is yours.
            </p>
          </Reveal>

          <Reveal>
            <div className="closeout-italic">
              the structure is yours · the plan is rented
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <Reveal as="section" className="page-final">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            CONTINUE
          </div>
          <h2>
            Begin, <span className="it">or read the science</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Begin <span className="arrow">→</span>
            </Link>
            <Link href="/science" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read the science
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

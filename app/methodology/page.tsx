import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import ScriptRevision from "../../components/figures/ScriptRevision";

export const metadata: Metadata = {
  title: "Methodology — TwentyThird",
  description:
    "From first conversation to therapist-ready map. Five stages of the TwentyThird pipeline.",
};

type StageProps = {
  num: string;
  name: React.ReactNode;
  blurb: React.ReactNode;
  fig: string;
  label: string;
  subtitle: string;
  children: React.ReactNode;
};

function Stage({ num, name, blurb, fig, label, subtitle, children }: StageProps) {
  return (
    <FigureCard
      label={label}
      subtitle={subtitle}
      fig={fig}
      className="pipeline-card"
    >
      <div className="pipeline-body">
        <div className="pipeline-copy">
          <div className="pipeline-stage">STAGE {num}</div>
          <h3 className="pipeline-name">{name}</h3>
          <p className="pipeline-blurb">{blurb}</p>
        </div>
        <div className="pipeline-visual">{children}</div>
      </div>
    </FigureCard>
  );
}

export default function MethodologyPage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              THE METHOD
            </div>
            <h1>
              Weeks of preparation,{" "}
              <span className="it">not years of search</span>.
            </h1>
            <p className="lede">
              Therapy works. It also takes time to know what you&apos;re there
              for. TwentyThird compresses the preparation — the part where you
              learn what you&apos;re actually saying — so the room itself can
              go faster.
            </p>
          </div>
        </div>
      </Reveal>

      {/* THE PIPELINE — five stage cards */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">THE PIPELINE</div>
            <h2 className="head-h2">
              Five stages, one <span className="it">brief</span>.
            </h2>
            <p className="lede">
              From sampled speech to a working document a clinician can read in
              eight minutes.
            </p>
          </Reveal>

          <div className="pipeline-stack">
            <Reveal>
              <Stage
                num="01"
                name={<>Sampling</>}
                blurb={<>Voice and text from guided sessions. The model listens for shape, not content.</>}
                fig="Fig. 01"
                label="sampling"
                subtitle="volume across the cohort"
              >
                <div className="sampling-figure">
                  <div className="sf-row">
                    <span className="sf-k">words sampled</span>
                    <span className="sf-v">~24,000</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">sessions</span>
                    <span className="sf-v">18</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">elapsed</span>
                    <span className="sf-v">~9 wks</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">median turn</span>
                    <span className="sf-v">42 wds</span>
                  </div>
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="02"
                name={<>Linguistic <em>extraction</em></>}
                blurb={<>Features the model lifts from the transcript — quietly, before any interpretation.</>}
                fig="Fig. 02"
                label="extraction"
                subtitle="feature classes"
              >
                <div className="mini-key">
                  <div className="mk-item">
                    <span className="mk-n">01</span>
                    <span className="mk-label">qualifier density</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">02</span>
                    <span className="mk-label">modal verbs</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">03</span>
                    <span className="mk-label">conditional frame</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">04</span>
                    <span className="mk-label">affective hedges</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">05</span>
                    <span className="mk-label">slips · misnamings</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">06</span>
                    <span className="mk-label">repetition windows</span>
                  </div>
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="03"
                name={<>Recurrence <em>detection</em></>}
                blurb={<>The pattern that returns at the same shape, in different decades. The signal that something is structural.</>}
                fig="Fig. 03"
                label="recurrence"
                subtitle="three anchors of one pattern"
              >
                <div className="mini-pattern">
                  <PatternList
                    rows={[
                      { year: "2014", durationLabel: "first job", width: 56, outcome: "ceiling at month 9" },
                      { year: "2019", durationLabel: "second", width: 60, outcome: "ceiling at month 11" },
                      { year: "2024", durationLabel: "third", width: 58, outcome: "ceiling at month 8" },
                    ]}
                  />
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="04"
                name={<>Script <em>reconstruction</em></>}
                blurb={<>The sentence underneath the pattern. Old line, then a candidate revision the subject can rehearse.</>}
                fig="Fig. 04"
                label="reconstruction"
                subtitle="working draft"
              >
                <div className="mini-script">
                  <ScriptRevision
                    rows={[
                      {
                        prefix: "01 · I am",
                        old: "not yet ready.",
                        next: "already allowed.",
                      },
                      {
                        prefix: "02 · to",
                        old: "wait to be chosen.",
                        next: "name what I want.",
                      },
                    ]}
                  />
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="05"
                name={<>Map for the <em>clinician</em></>}
                blurb={<>Three labelled meters and a one-line structural reading. Eight minutes to read, weeks to use.</>}
                fig="Fig. 05"
                label="clinical handoff"
                subtitle="working brief"
              >
                <div className="mini-report">
                  <ReportMock
                    caseLabel="case 0217-B"
                    prepared="prepared 04 · 26"
                    rows={[
                      { k: "Ego structure", pct: ".72", width: 72 },
                      { k: "Object relations", pct: ".48", width: 48 },
                      { k: "Symbolic register", pct: ".67", width: 67 },
                    ]}
                    footerLabel="Reading"
                    footerValue="obsessional · with hysterical traces"
                  />
                </div>
              </Stage>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHAT WE MEASURE / DON'T */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">SCOPE</div>
            <h2 className="head-h2">
              What we measure, and what we{" "}
              <span className="it">refuse</span> to.
            </h2>
          </Reveal>

          <Reveal>
            <div className="measure-grid">
              <div className="measure-col">
                <div className="measure-head">What we measure</div>
                <div className="measure-item">
                  <span className="k">language patterns</span>
                  <span className="gloss">Qualifier density, modal verbs, hedges, conditional frames.</span>
                </div>
                <div className="measure-item">
                  <span className="k">recurrence</span>
                  <span className="gloss">Patterns that return at the same shape across years.</span>
                </div>
                <div className="measure-item">
                  <span className="k">narrative coherence</span>
                  <span className="gloss">How a life is told, where the seams show.</span>
                </div>
                <div className="measure-item">
                  <span className="k">attachment markers</span>
                  <span className="gloss">Where intimacy crosses a threshold, what follows.</span>
                </div>
                <div className="measure-item">
                  <span className="k">linguistic slips</span>
                  <span className="gloss">Misnamings, condensations, displacements.</span>
                </div>
              </div>
              <div className="measure-col">
                <div className="measure-head">What we don&apos;t</div>
                <div className="measure-item">
                  <span className="k">DSM / ICD categories</span>
                  <span className="gloss">Nosology is a separate instrument, used by clinicians.</span>
                </div>
                <div className="measure-item">
                  <span className="k">IQ or cognition</span>
                  <span className="gloss">Out of scope. The model is psychodynamic, not psychometric.</span>
                </div>
                <div className="measure-item">
                  <span className="k">personality types</span>
                  <span className="gloss">Five-factor and its descendants are not part of the brief.</span>
                </div>
                <div className="measure-item">
                  <span className="k">risk scores</span>
                  <span className="gloss">Acute risk is a clinician&apos;s call, not a model&apos;s.</span>
                </div>
                <div className="measure-item">
                  <span className="k">predictions</span>
                  <span className="gloss">Structure, not forecast. We name what is, not what comes.</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WALK IN KNOWING WHAT TO SAY */}
      <section className="page-section split-section">
        <div className="container">
          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Compression
                  </span>
                </div>
                <h3>
                  Walk in knowing what to <span className="it">say</span>.
                </h3>
                <p>
                  Therapy is not the place to figure out the question. It is
                  the place to live with it. The compression we offer is on the
                  approach — the months a clinician usually spends listening
                  for the shape of the brief.
                </p>
                <p>
                  Across the pilot cohort, prepared subjects reached working
                  alliance in fewer sessions. The reading was already there.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="alliance"
                  subtitle="median sessions to working alliance"
                  fig="Fig. 06"
                >
                  <InsightTimeline
                    heading="Time to working alliance"
                    range="median across cohort"
                    markers={[
                      { day: 1 },
                      { day: 7 },
                      { day: 14, label: "unprepared" },
                      { day: 23, label: "prepared", inflection: true },
                    ]}
                    summaryBig="~6"
                    summaryLabel={"fewer sessions to\nworking alliance"}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <Reveal as="section" className="page-final">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            CONTINUE
          </div>
          <h2>
            Begin, <span className="it">or view a sample report</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Begin <span className="arrow">→</span>
            </Link>
            <Link href="/reports/sample" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              view a sample report
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

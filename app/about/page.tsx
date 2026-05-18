import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import ScriptRevision from "../../components/figures/ScriptRevision";

export const metadata: Metadata = {
  title: "About — TwentyThird",
  description:
    "Origin, method, and the inflection at day twenty-three. Built inside CognitiveLab at WelloWork AB.",
};

export default function AboutPage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero split-section">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              ABOUT
            </div>
            <h1>
              Origin, method, and the{" "}
              <span className="it">inflection at day twenty‑three</span>.
            </h1>
            <p className="lede">
              TwentyThird is a psychodynamic AI for self‑discovery. It maps the
              recurring loops and structures beneath the symptom — language,
              attachment, repetition — and returns a working brief, not a
              quiz.
            </p>
          </div>
          <FigureCard
            label="day-23"
            subtitle="inflection metaphor"
            fig="Fig. 01"
          >
            <InsightTimeline
              heading="The 23-day arc"
              range="curiosity → awareness"
              markers={[
                { day: 1, label: "" },
                { day: 7, label: "" },
                { day: 14, label: "" },
                { day: 23, label: "inflection", inflection: true },
              ]}
              summaryBig="23"
              summaryLabel={"day the question\nturns inward"}
            />
          </FigureCard>
        </div>
      </Reveal>

      {/* PHILOSOPHY */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">PHILOSOPHY</div>
            <h2 className="head-h2">
              Freud&apos;s correspondent. Fliess&apos;s number.{" "}
              <span className="it">Our metaphor</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Lineage
                  </span>
                </div>
                <h3>
                  A <span className="it">23-day rhythm</span> proposed in a
                  letter, kept as figure.
                </h3>
                <p>
                  The 23-day cycle was Wilhelm Fliess&apos;s hypothesis,
                  argued through his correspondence with Freud at the close of
                  the nineteenth century. Contemporary science does not
                  support fixed biorhythms.
                </p>
                <p>
                  We keep the number for what it names — the threshold at
                  which curiosity matures into awareness. Day‑23 is figure,
                  not biology.
                </p>
              </div>
              <FigureCard label="lineage" subtitle="four anchors" fig="Fig. 02">
                <PatternList
                  rows={[
                    {
                      year: "1897",
                      durationLabel: "Fliess–Freud",
                      width: 42,
                      outcome: "proposal",
                    },
                    {
                      year: "1923",
                      durationLabel: "Ego & Id",
                      width: 60,
                      outcome: "structural model",
                    },
                    {
                      year: "1953",
                      durationLabel: "Rome discourse",
                      width: 54,
                      outcome: "linguistic turn",
                    },
                    {
                      year: "2026",
                      durationLabel: "TwentyThird",
                      width: 68,
                      outcome: "synthesis",
                    },
                  ]}
                  summary={[
                    { k: "interval", v: "~30 yrs" },
                    { k: "thread", v: "structure", italic: true },
                    { k: "method", v: "psychodynamic" },
                  ]}
                />
              </FigureCard>
            </div>
          </div>
        </div>
      </section>

      {/* ORIGIN */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">ORIGIN</div>
            <h2 className="head-h2">
              Built inside CognitiveLab.{" "}
              <span className="it">Answered a question we kept being asked</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Team
                  </span>
                </div>
                <h3>
                  Physicians, originally building{" "}
                  <span className="it">cognitive training</span>.
                </h3>
                <p>
                  TwentyThird began inside the CognitiveLab at WelloWork AB,
                  where the team was developing cognitive training systems.
                  Friends and colleagues began bringing personal questions —
                  anxiety, recurring patterns, the loops they could not name.
                </p>
                <p>
                  Between clinical practice as physicians, the pilot data we
                  were accumulating, and a long reading list in psychoanalysis
                  and Lacanian theory, we had something to offer. TwentyThird
                  is what that became.
                </p>
              </div>
              <FigureCard label="team" subtitle="profile" fig="Fig. 03">
                <ReportMock
                  caseLabel="cognitivelab · wellowork ab"
                  prepared="prepared 05 · 26"
                  rows={[
                    { k: "Clinical practice", pct: "12 yrs", width: 78 },
                    {
                      k: "Research output",
                      pct: "n = 47",
                      width: 62,
                    },
                    {
                      k: "Subjects in pilot",
                      pct: "n = 2,418",
                      width: 84,
                    },
                    { k: "Physicians on team", pct: "04", width: 30 },
                  ]}
                  footerLabel="Profile"
                  footerValue="clinician–researcher hybrid"
                />
              </FigureCard>
            </div>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">METHOD</div>
            <h2 className="head-h2">
              What the model <span className="it">actually does</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Capabilities
                  </span>
                </div>
                <h3>
                  Beneath the symptom, a{" "}
                  <span className="it">structure</span>.
                </h3>
                <p>
                  TwentyThird performs root-cause analysis. It maps the{" "}
                  <em>subconscious loop</em> across years, reads the{" "}
                  <em>linguistic unconscious</em> in word choice and slips of
                  speech, surfaces <em>attachment</em> at the intimacy
                  threshold, and writes a working plan for{" "}
                  <em>shadow work</em>.
                </p>
                <p>
                  The output is therapist-ready. Names the structure, not the
                  surface.
                </p>
              </div>
              <FigureCard
                label="symptom → structure"
                subtitle="three rewrites"
                fig="Fig. 04"
              >
                <ScriptRevision
                  rows={[
                    {
                      prefix: "01 · surface",
                      old: "I procrastinate on important work.",
                      next: "Avoidance of being seen as the one who knows.",
                    },
                    {
                      prefix: "02 · surface",
                      old: "I keep dating the same person.",
                      next:
                        "Repetition of the father‑imago at the intimacy threshold.",
                    },
                    {
                      prefix: "03 · surface",
                      old: "I can't finish anything.",
                      next:
                        "Refusal to surrender the position of potential.",
                    },
                  ]}
                  metaLeft={{ label: "presenting", value: "complaint" }}
                  metaRight={{ label: "structural", value: "reading" }}
                />
              </FigureCard>
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
            Read the method, <span className="it">or begin</span>.
          </h2>
          <div className="cta-row">
            <Link href="/" className="cta">
              Read the method <span className="arrow">→</span>
            </Link>
            <Link href="/contact" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              write to us
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

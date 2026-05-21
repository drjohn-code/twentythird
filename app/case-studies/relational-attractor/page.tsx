import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../../components/layout/Reveal";
import FigureCard from "../../../components/figures/FigureCard";
import InsightTimeline from "../../../components/figures/InsightTimeline";
import PatternList from "../../../components/figures/PatternList";
import ScriptRevision from "../../../components/figures/ScriptRevision";
import DreamText, { Ann } from "../../../components/figures/DreamText";
import DreamKey from "../../../components/figures/DreamKey";

export const metadata: Metadata = {
  title: "The same fight, eighteen years apart — TwentyThird",
  description:
    "Clinical case study. A subject in their late thirties traces a relational pattern back through five prior relationships and one earlier scene.",
};

export default function CaseStudyPage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              CASE STUDY · 04
            </div>
            <h1>
              The same fight,{" "}
              <span className="it">eighteen years apart</span>.
            </h1>
            <p className="lede">
              Subject M. arrived for relational work in their late thirties.
              The presenting problem was familiar: a partner who &ldquo;kept
              becoming&rdquo; withholding. We traced it back to four prior
              relationships and one earlier scene.
            </p>
          </div>
        </div>
      </Reveal>

      {/* PRESENTING PATTERN */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">PRESENTING PATTERN</div>
            <h2 className="head-h2">
              The complaint at <span className="it">first session</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Subject M.
                  </span>
                </div>
                <h3>
                  Five relationships, <span className="it">one ending</span>.
                </h3>
                <p>
                  M. is a designer in their late thirties. Educated, articulate,
                  in steady work. The surface complaint, offered in the first
                  session almost verbatim:
                </p>
                <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "19px", color: "var(--fg)" }}>
                  &ldquo;I keep choosing people who become withholding. I see
                  the pattern. I just can&apos;t break it.&rdquo;
                </p>
                <p>
                  The longitudinal frame complicated the explanation. Five
                  partners across nineteen years had ended in the same
                  configuration — not by chance, not by choice of type, but by
                  the same terminal phase.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="subject M."
                  subtitle="five relationships"
                  fig="Fig. 01"
                >
                  <PatternList
                    rows={[
                      { year: "2007", durationLabel: "14 mo", width: 58, outcome: "withdrew at month 12" },
                      { year: "2010", durationLabel: "11 mo", width: 54, outcome: "broke contact" },
                      { year: "2014", durationLabel: "9 mo", width: 50, outcome: "escalating fights" },
                      { year: "2019", durationLabel: "13 mo", width: 62, outcome: "withdrew, returned, left" },
                      { year: "2024", durationLabel: "10 mo", width: 56, outcome: "withdrew at month 8" },
                    ]}
                    summary={[
                      { k: "n", v: "5" },
                      { k: "mean", v: "11 mo" },
                      { k: "terminal", v: "withdrawal", italic: true },
                    ]}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* EARLIER SCENE */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">THE EARLIER SCENE</div>
            <h2 className="head-h2">
              A configuration <span className="it">already rehearsed</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Adolescence
                  </span>
                </div>
                <h3>
                  Intermittent <span className="it">availability</span>, and a
                  reading of it.
                </h3>
                <p>
                  M.&apos;s adolescence held a parent who was emotionally
                  available in a particular kind of moment — never the one
                  M. was asking for. The arrival of warmth and its sudden
                  retreat formed a rhythm. M. learned to anticipate the
                  retreat by performing it first.
                </p>
                <p>
                  In the dream below, recorded in session four, the structuring
                  scene returns in disguise. The supervisor is a parent. The
                  hallway is the house. The door does not open.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="dream"
                  subtitle="session 04"
                  fig="Fig. 02"
                >
                  <DreamText
                    paragraphs={[
                      <>
                        &ldquo;I am in the hallway of the apartment we lived in
                        when I was eleven{" "}
                        <Ann n="01">displacement</Ann>. My supervisor at work
                        is also my father{" "}
                        <Ann n="02">condensation</Ann>. He says my name but
                        gets it slightly wrong{" "}
                        <Ann n="03">slip</Ann>.&rdquo;
                      </>,
                    ]}
                  />
                  <DreamKey
                    entries={[
                      { n: "01", label: "displacement", gloss: "the workplace stands in for the house" },
                      { n: "02", label: "condensation", gloss: "two figures merge into one" },
                      { n: "03", label: "slip", gloss: "the mis-name carries the unsaid claim" },
                    ]}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* INTERVENTION */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">THE INTERVENTION</div>
            <h2 className="head-h2">
              The reading, in the subject&apos;s own{" "}
              <span className="it">sentences</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Method
                  </span>
                </div>
                <h3>
                  Five rewrites of one <span className="it">self-narration</span>.
                </h3>
                <p>
                  The work is sentence-level. M.&apos;s description of the
                  pattern carried the pattern. Each line we rewrote slackened a
                  grip the structure had on the choosing. The aim is not
                  affirmation. It is the more accurate sentence.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="rewrites"
                  subtitle="five lines, working draft"
                  fig="Fig. 03"
                >
                  <ScriptRevision
                    rows={[
                      {
                        prefix: "01 · I",
                        old: "always pick avoidant partners.",
                        next: "rehearse an arrival, then rehearse a leaving.",
                      },
                      {
                        prefix: "02 · they",
                        old: "always become withholding.",
                        next: "arrive into a position I have already shaped.",
                      },
                      {
                        prefix: "03 · so I",
                        old: "have bad taste.",
                        next: "have an accurate ear for a familiar music.",
                      },
                      {
                        prefix: "04 · because",
                        old: "love is unreliable.",
                        next: "love arrived once, on a particular schedule.",
                      },
                      {
                        prefix: "05 · which means",
                        old: "I should be more careful.",
                        next: "I can want what the schedule withheld.",
                      },
                    ]}
                    metaLeft={{ label: "presenting", value: "complaint" }}
                    metaRight={{ label: "structural", value: "reading" }}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* SIX MONTHS LATER */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">SIX MONTHS LATER</div>
            <h2 className="head-h2">
              What changes when the structure is{" "}
              <span className="it">named</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Follow-up
                  </span>
                </div>
                <h3>
                  The gravity slackens, it does not{" "}
                  <span className="it">vanish</span>.
                </h3>
                <p>
                  Six months after the working brief was handed to M.&apos;s
                  clinician, the pattern was still recognisable. M. recognised
                  it earlier — in a relationship, in a sentence, in the breath
                  before a sentence. Time-to-first-recognition is the metric
                  we trust.
                </p>
                <p>
                  This is not a cure. It is a less expensive return. The same
                  fight is no longer eighteen years apart; it is two minutes
                  apart, and M. is on speaking terms with it.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="recognition"
                  subtitle="median across cohort"
                  fig="Fig. 04"
                >
                  <InsightTimeline
                    heading="Time-to-first-recognition"
                    range="across three recurring patterns"
                    markers={[
                      { day: 1 },
                      { day: 7 },
                      { day: 14, label: "median" },
                      { day: 23, label: "inflection", inflection: true },
                    ]}
                    summaryBig="~14"
                    summaryLabel={"wks to first\nrecognition"}
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
            Begin your own, <span className="it">or read another</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Begin your own <span className="arrow">→</span>
            </Link>
            <Link href="/papers/professional-blocks" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read the method paper
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

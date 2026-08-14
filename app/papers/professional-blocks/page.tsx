import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Reveal from "../../../components/layout/Reveal";
import FigureCard from "../../../components/figures/FigureCard";
import InsightTimeline from "../../../components/figures/InsightTimeline";
import PatternList from "../../../components/figures/PatternList";
import ScriptRevision from "../../../components/figures/ScriptRevision";

export const metadata: Metadata = {
  title: "The ceiling is a script — TwentyThird",
  description:
    "Methods paper. Professional stuckness as a sentence written early and rehearsed quietly, and the linguistic pipeline that surfaces and rewrites it.",
};

export default async function PaperPage() {
  const locale = await getLocale();
  const t = await getTranslations("marketing");
  return (
    // Body copy here is a hardcoded English methods paper — never wired
    // through the locale layer (see I18N.md). lang="en" so it isn't
    // announced as Lithuanian; translating it is separate, fenced-off work.
    <main className="page-shell" lang="en">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div className="paper-narrow">
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              METHODS PAPER · 03
            </div>
            <h1>
              The ceiling is a <span className="it">script</span>.
            </h1>
            <p className="lede">
              Professional stuckness — the ceiling that returns at the same
              height in each new role — is rarely a skill problem. It is a
              sentence written early and rehearsed quietly. This paper
              describes how TwentyThird surfaces and rewrites that sentence.
            </p>
            {locale === "lt" && (
              <p className="lede" lang="lt">
                {t("englishPageNotice")}
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* ABSTRACT */}
      <section className="page-section" style={{ paddingTop: "60px", paddingBottom: "0" }}>
        <div className="container">
          <div className="paper-narrow">
            <Reveal>
              <FigureCard label="abstract" subtitle="" fig="ABS">
                <div className="abstract-block">
                  <div className="ab-row">
                    <span className="ab-k">Background</span>
                    <span className="ab-v">
                      Professional plateaus are commonly framed as skill or
                      motivation deficits. Clinical observation suggests a
                      third explanation: an early self-narration that limits
                      what the subject is allowed to want.
                    </span>
                  </div>
                  <div className="ab-row">
                    <span className="ab-k">Method</span>
                    <span className="ab-v">
                      Speech samples from 41-session profiles (n = 2,418) were
                      analysed for recurrence patterns, modal hedging, and
                      qualifier density. Candidate scripts were reconstructed
                      and offered for revision.
                    </span>
                  </div>
                  <div className="ab-row">
                    <span className="ab-k">Findings</span>
                    <span className="ab-v">
                      Vocational scripts were detectable across role
                      transitions. Sentence-level revision correlated with
                      reduced rumination and faster time-to-working-alliance
                      in subsequent therapy.
                    </span>
                  </div>
                  <div className="ab-row">
                    <span className="ab-k">Conclusion</span>
                    <span className="ab-v">
                      The block is linguistic before it is behavioural.
                      Preparation is the work; the room is the rehearsal.
                    </span>
                  </div>
                </div>
              </FigureCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head paper-narrow">
            <div className="eyebrow">METHOD</div>
            <h2 className="head-h2">
              Five steps from speech to{" "}
              <span className="it">revision</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Pipeline
                  </span>
                </div>
                <h3>
                  Sampling → extraction → recurrence →{" "}
                  <span className="it">reconstruction</span> → revision.
                </h3>
                <p>
                  Each profile begins with guided speech and writing samples.
                  Linguistic features — modal density, qualifier frequency,
                  conditional frame, micro-slips — are extracted and aligned
                  against an internal recurrence map.
                </p>
                <p>
                  Where the same shape recurs at the same shape in a different
                  decade, the model proposes a candidate self-narration. The
                  subject revises. Time-to-first-recognition is the metric we
                  track.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="recognition"
                  subtitle="three professional patterns"
                  fig="Fig. 01"
                >
                  <InsightTimeline
                    heading="Time-to-first-recognition"
                    range="weeks across cohort"
                    markers={[
                      { day: 1 },
                      { day: 7, label: "promotion-adjacent" },
                      { day: 14, label: "over-functioning" },
                      { day: 23, label: "credit-deflection", inflection: true },
                    ]}
                    summaryBig="~9"
                    summaryLabel={"wks to first\nrecognition"}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FINDINGS */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head paper-narrow">
            <div className="eyebrow">FINDINGS</div>
            <h2 className="head-h2">
              Two results, both at the level of the{" "}
              <span className="it">sentence</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            {/* Finding 1 */}
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Finding 01
                  </span>
                </div>
                <h3>
                  Scripts are <span className="it">vocational</span>, not generic.
                </h3>
                <p>
                  The same subject reproduced the same ceiling at the same
                  role-month across four jobs in twelve years. The pattern
                  travelled with the speaker, not the position.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="subject 0418-V"
                  subtitle="four roles, one ceiling"
                  fig="Fig. 02"
                >
                  <PatternList
                    rows={[
                      { year: "2013", durationLabel: "junior · agency", width: 56, outcome: "stalled at month 11" },
                      { year: "2016", durationLabel: "mid · agency", width: 62, outcome: "stalled at month 10" },
                      { year: "2020", durationLabel: "lead · in-house", width: 58, outcome: "stalled at month 12" },
                      { year: "2024", durationLabel: "head · in-house", width: 60, outcome: "stalled at month 11" },
                    ]}
                    summary={[
                      { k: "n", v: "4 / 4" },
                      { k: "mean", v: "11 mo" },
                      { k: "carrier", v: "the speaker", italic: true },
                    ]}
                  />
                </FigureCard>
              </Reveal>
            </div>

            {/* Finding 2 */}
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Finding 02
                  </span>
                </div>
                <h3>
                  Revision happens at the level of the{" "}
                  <span className="it">sentence</span>.
                </h3>
                <p>
                  Six representative rewrites from the cohort. Each old line
                  was offered by the subject; each new line was arrived at,
                  not given.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="revisions"
                  subtitle="six lines, cohort sample"
                  fig="Fig. 03"
                >
                  <ScriptRevision
                    rows={[
                      {
                        prefix: "01 · I am",
                        old: "not yet ready.",
                        next: "being asked to want what I was taught not to want.",
                      },
                      {
                        prefix: "02 · I",
                        old: "should wait for the right moment.",
                        next: "produce the moment by naming it.",
                      },
                      {
                        prefix: "03 · I",
                        old: "don't want to seem entitled.",
                        next: "have confused entitlement with permission.",
                      },
                      {
                        prefix: "04 · I",
                        old: "always finish other people&apos;s work first.",
                        next: "use other people&apos;s work as a permission slip.",
                      },
                      {
                        prefix: "05 · I",
                        old: "deflect when I am credited.",
                        next: "deflect because being seen interrupts a position.",
                      },
                      {
                        prefix: "06 · I",
                        old: "burn out before promotion.",
                        next: "perform the leaving early to keep arrival safe.",
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

      {/* DISCUSSION */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head paper-narrow">
            <div className="eyebrow">DISCUSSION</div>
            <h2 className="head-h2">
              On the debt to <span className="it">script theory</span>.
            </h2>
          </Reveal>

          <Reveal className="mono-prose paper-narrow">
            <p>
              Script theory in this paper inherits both Berne&apos;s
              transactional reading — life-script as early decision — and
              Lacan&apos;s reading of the unconscious as a chain of
              signifiers. The two are not identical. Berne reads the script as
              a decision the subject made; Lacan reads it as a sentence the
              subject was given. The cohort data is consistent with both
              readings; the intervention is the same either way.
            </p>
            <p>
              We are also careful about what this paper is not. It is not a
              substitute for psychotherapy. It is preparation for the room. A
              well-prepared subject does not bypass treatment; they arrive in
              treatment with a sentence to put down.
            </p>
          </Reveal>
        </div>
      </section>

      {/* REFERENCES */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head paper-narrow">
            <div className="eyebrow">REFERENCES</div>
            <h2 className="head-h2">
              The <span className="it">selected</span> bibliography.
            </h2>
          </Reveal>

          <Reveal>
            <div className="paper-narrow">
              <div className="hair-list">
                <div className="hair-item">
                  <span className="hair-num">01</span>
                  <span className="hair-title">Beyond the Pleasure Principle</span>
                  <span className="hair-meta">Freud · 1920</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">02</span>
                  <span className="hair-title">The Ego and the Id</span>
                  <span className="hair-meta">Freud · 1923</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">03</span>
                  <span className="hair-title">Écrits</span>
                  <span className="hair-meta">Lacan · 1966</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">04</span>
                  <span className="hair-title">The Function and Field of Speech and Language</span>
                  <span className="hair-meta">Lacan · 1953</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">05</span>
                  <span className="hair-title">What Do You Say After You Say Hello?</span>
                  <span className="hair-meta">Berne · 1972</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">06</span>
                  <span className="hair-title">Affect Regulation and the Origin of the Self</span>
                  <span className="hair-meta">Schore · 1994</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">07</span>
                  <span className="hair-title">Standing in the Spaces</span>
                  <span className="hair-meta">Bromberg · 1998</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">08</span>
                  <span className="hair-title">Affect Regulation, Mentalization, and the Development of the Self</span>
                  <span className="hair-meta">Fonagy et al. · 2002</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">09</span>
                  <span className="hair-title">Attachment</span>
                  <span className="hair-meta">Bowlby · 1969</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">10</span>
                  <span className="hair-title">A Secure Base</span>
                  <span className="hair-meta">Bowlby · 1988</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">11</span>
                  <span className="hair-title">Pipeline notes on linguistic recurrence</span>
                  <span className="hair-meta">TwentyThird Cognitive Lab · working paper 02</span>
                </div>
                <div className="hair-item">
                  <span className="hair-num">12</span>
                  <span className="hair-title">Cohort study of professional-block revisions</span>
                  <span className="hair-meta">TwentyThird Cognitive Lab · working paper 04</span>
                </div>
              </div>
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
            Begin a profile, <span className="it">or download the paper</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Begin a profile <span className="arrow">→</span>
            </Link>
            <Link href="/papers/professional-blocks" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              download as PDF
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

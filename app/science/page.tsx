import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import DreamText, { Ann } from "../../components/figures/DreamText";
import DreamKey from "../../components/figures/DreamKey";

export const metadata: Metadata = {
  title: "The science — TwentyThird",
  description:
    "A century of psychoanalytic theory and four decades of empirical research into pattern, language, and the unconscious.",
};

export default function SciencePage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              THE FOUNDATION
            </div>
            <h1>
              The science behind the{" "}
              <span className="it">listening</span>.
            </h1>
            <p className="lede">
              TwentyThird is built on a century of psychoanalytic theory and
              four decades of empirical research into pattern, language, and
              the unconscious. This is what we read, and why.
            </p>
          </div>
        </div>
      </Reveal>

      {/* TWO LINEAGES */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">TWO LINEAGES</div>
            <h2 className="head-h2">
              Freud&apos;s structure. Lacan&apos;s{" "}
              <span className="it">letter</span>.
            </h2>
            <p className="lede">
              Two readings of the unconscious, a half-century apart. Together
              they form the spine of the method.
            </p>
          </Reveal>

          <div className="split-stack">
            {/* Row 1 — Freud */}
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Freud
                  </span>
                </div>
                <h3>
                  The <span className="it">structural</span> unconscious.
                </h3>
                <p>
                  Freud&apos;s lasting contribution is structural, not
                  thematic. The dynamic unconscious is not a basement of
                  forgotten content — it is a working organ of the mind,
                  rehearsing, repeating, transferring.
                </p>
                <p>
                  We read him as a clinician of repetition. The same scene
                  arrives in different decades. That recurrence is the signal
                  the model is trained to find.
                </p>
              </div>
              <FigureCard
                label="recurrence"
                subtitle="five anchors, one structure"
                fig="Fig. 01"
              >
                <PatternList
                  rows={[
                    { year: "1998", durationLabel: "early adolescence", width: 54, outcome: "withdrawal" },
                    { year: "2006", durationLabel: "first long bond", width: 62, outcome: "withdrawal" },
                    { year: "2013", durationLabel: "second long bond", width: 58, outcome: "withdrawal" },
                    { year: "2019", durationLabel: "third bond", width: 66, outcome: "withdrawal" },
                    { year: "2025", durationLabel: "fourth bond", width: 60, outcome: "withdrawal" },
                  ]}
                  summary={[
                    { k: "recurrence", v: "5 / 5" },
                    { k: "interval", v: "~7 yrs" },
                    { k: "attractor", v: "intimacy threshold", italic: true },
                  ]}
                />
              </FigureCard>
            </div>

            {/* Row 2 — Lacan */}
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Lacan
                  </span>
                </div>
                <h3>
                  The unconscious is structured like a{" "}
                  <span className="it">language</span>.
                </h3>
                <p>
                  Lacan&apos;s reading shifts the field. The signifier moves;
                  meaning slides along chains of metonymy and metaphor. The
                  mirror stage names the founding misrecognition.{" "}
                  <em>Desire is the desire of the Other.</em>
                </p>
                <p>
                  In our pipeline this is concrete. We read dreams and waking
                  speech as text — the displacements, condensations, and slips
                  carry the structuring grammar.
                </p>
              </div>
              <FigureCard
                label="linguistic signal"
                subtitle="dream excerpt, annotated"
                fig="Fig. 02"
              >
                <DreamText
                  paragraphs={[
                    <>
                      &ldquo;The room I lived in as a child has another door I
                      do not remember{" "}
                      <Ann n="01">displacement</Ann>. Behind it, my
                      supervisor&apos;s voice{" "}
                      <Ann n="02">condensation</Ann> calls me by the wrong
                      name{" "}
                      <Ann n="03">slip</Ann>.&rdquo;
                    </>,
                  ]}
                />
                <DreamKey
                  entries={[
                    { n: "01", label: "displacement" },
                    { n: "02", label: "condensation" },
                    { n: "03", label: "slip" },
                  ]}
                />
              </FigureCard>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEMPORARY RESEARCH */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">EMPIRICAL ANCHORS</div>
            <h2 className="head-h2">
              What contemporary research <span className="it">adds</span>.
            </h2>
            <p className="lede">
              Five converging strands from attachment, narrative, and process
              research. Not a complete bibliography — the anchors the model
              actually rests on.
            </p>
          </Reveal>

          <Reveal>
            <FigureCard
              label="empirical anchors"
              subtitle="converging evidence"
              fig="Fig. 03"
            >
              <ReportMock
                caseLabel="literature · synthesis"
                prepared="updated 04 · 26"
                rows={[
                  { k: "Attachment continuity across decades", pct: ".78", width: 78 },
                  { k: "Therapeutic alliance as outcome predictor", pct: ".64", width: 64 },
                  { k: "Narrative coherence and well-being", pct: ".57", width: 57 },
                  { k: "Implicit relational knowing", pct: ".49", width: 49 },
                  { k: "Script theory in vocational stuckness", pct: ".42", width: 42 },
                ]}
                footerLabel="Synthesis"
                footerValue="converging evidence · n = 2,418"
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* CLAIMS / LIMITS */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">WHAT WE DO NOT CLAIM</div>
            <h2 className="head-h2">
              The honest <span className="it">edges</span> of the work.
            </h2>
          </Reveal>

          <Reveal className="mono-prose">
            <p>
              <strong>We are not a substitute for a therapist.</strong> The
              model prepares the conversation. It does not hold it.
            </p>
            <p>
              <strong>We are not a diagnostic instrument under DSM or ICD.</strong>{" "}
              The categories we work in are structural — obsessional,
              hysterical, phobic — not nosological. They name how a person is
              organised, not what they have.
            </p>
            <p>
              <strong>The 23-day cycle is metaphor.</strong> The number comes
              from Wilhelm Fliess&apos;s correspondence with Freud at the end
              of the nineteenth century. Contemporary science does not support
              fixed biorhythms. We keep the number for what it names — the
              inflection from curiosity into awareness.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FURTHER READING */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">FURTHER READING</div>
            <h2 className="head-h2">
              The shelf <span className="it">behind</span> the model.
            </h2>
            <p className="lede">
              Books, not papers. The ones we return to.
            </p>
          </Reveal>

          <Reveal>
            <div className="hair-list">
              <div className="hair-item">
                <span className="hair-num">01</span>
                <span className="hair-title">Beyond the Pleasure Principle</span>
                <span className="hair-meta">Sigmund Freud · 1920</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">02</span>
                <span className="hair-title">The Interpretation of Dreams</span>
                <span className="hair-meta">Sigmund Freud · 1900</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">03</span>
                <span className="hair-title">Écrits</span>
                <span className="hair-meta">Jacques Lacan · 1966</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">04</span>
                <span className="hair-title">The Four Fundamental Concepts of Psychoanalysis</span>
                <span className="hair-meta">Jacques Lacan · 1973</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">05</span>
                <span className="hair-title">Attachment</span>
                <span className="hair-meta">John Bowlby · 1969</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">06</span>
                <span className="hair-title">Affect Regulation and the Origin of the Self</span>
                <span className="hair-meta">Allan Schore · 1994</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">07</span>
                <span className="hair-title">Standing in the Spaces</span>
                <span className="hair-meta">Philip Bromberg · 1998</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">08</span>
                <span className="hair-title">Affect Regulation, Mentalization, and the Development of the Self</span>
                <span className="hair-meta">Peter Fonagy et al. · 2002</span>
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
            Begin a profile, <span className="it">or read a case</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Begin a profile <span className="arrow">→</span>
            </Link>
            <Link href="/case-studies/relational-attractor" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read a case study
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

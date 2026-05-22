import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../../components/layout/Reveal";
import FigureCard from "../../../components/figures/FigureCard";
import ReportMock from "../../../components/figures/ReportMock";
import DreamText, { Ann } from "../../../components/figures/DreamText";
import DreamKey from "../../../components/figures/DreamKey";

export const metadata: Metadata = {
  title: "Dream logic, annotated — TwentyThird",
  description:
    "An annotated dream specimen. How TwentyThird reads the displacements, condensations, and slips that carry the waking decision.",
};

export default function DreamExamplePage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              WORKED EXAMPLE · 02
            </div>
            <h1>
              Dream logic, <span className="it">annotated</span>.
            </h1>
            <p className="lede">
              A dream is a rehearsal of meaning. Below is one reported by a
              subject in week three of analysis, followed by the structure we
              surfaced and the waking decision it was preparing them to make.
            </p>
          </div>
        </div>
      </Reveal>

      {/* THE DREAM AS REPORTED */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">AS REPORTED</div>
            <h2 className="head-h2">
              The dream, <span className="it">verbatim</span>, with its key.
            </h2>
            <p className="lede">
              Eight markers, inline. Each chip names a mechanism the dream-work
              is using; the eight readings sit below the narrative, indexed by
              number.
            </p>
          </Reveal>

          <Reveal>
            <FigureCard
              label="subject 0184 · week 03"
              subtitle="dream entry, annotated"
              fig="Fig. 01"
            >
              <DreamText
                paragraphs={[
                  <>
                    &ldquo;I am back inside the apartment we lived in when I
                    was nine, but the rooms have been rearranged{" "}
                    <Ann n="01">displacement</Ann>. The staircase that used to
                    go up now opens into a corridor I do not remember{" "}
                    <Ann n="02">condensation</Ann>. At the end of it is the
                    door to my colleague&apos;s office.&rdquo;
                  </>,
                  <>
                    &ldquo;A figure is waiting there who is both my mother and
                    my colleague{" "}
                    <Ann n="03">condensation</Ann>. She tells me to come in,
                    but the latch will not lift{" "}
                    <Ann n="04">delayed action</Ann>. I look down and the key
                    in my hand has my brother&apos;s name engraved into it{" "}
                    <Ann n="05">imago</Ann>.&rdquo;
                  </>,
                  <>
                    &ldquo;When I finally open the door I say her name and
                    something else comes out{" "}
                    <Ann n="06">slip</Ann>. The room behind her is the
                    apartment&apos;s kitchen{" "}
                    <Ann n="07">return</Ann>. I want to step inside, but I am
                    already there{" "}
                    <Ann n="08">reversal</Ann>.&rdquo;
                  </>,
                ]}
              />
              <DreamKey
                entries={[
                  { n: "01", label: "displacement", gloss: "the workplace stands in for the childhood house" },
                  { n: "02", label: "condensation", gloss: "two architectures merge into one impossible plan" },
                  { n: "03", label: "condensation", gloss: "mother and colleague occupy the same body" },
                  { n: "04", label: "delayed action", gloss: "the will to open is older than the door" },
                  { n: "05", label: "imago", gloss: "the brother is the silent third the scene rehearses" },
                  { n: "06", label: "slip", gloss: "the wrong word is the right address" },
                  { n: "07", label: "return", gloss: "the kitchen is the scene the dream is here to revisit" },
                  { n: "08", label: "reversal", gloss: "to want is to find that one has already arrived" },
                ]}
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* THE STRUCTURE */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">THE STRUCTURE</div>
            <h2 className="head-h2">
              Dream-work, read as <span className="it">grammar</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Mechanism
                  </span>
                </div>
                <h3>
                  Three mechanisms,{" "}
                  <span className="it">one signal</span>.
                </h3>
                <p>
                  Freud names three movements in the dream-work: displacement,
                  condensation, secondary revision. Lacan reads them as the
                  rhetorical operations of metonymy and metaphor. The signifier
                  moves. Meaning slides. The dream is structured like a
                  sentence the dreamer has not yet learned to speak awake.
                </p>
                <p>
                  Below, five signal strengths extracted from this single
                  dream. Each meter is a quiet vote.
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label="signal extraction"
                  subtitle="from one dream"
                  fig="Fig. 02"
                >
                  <ReportMock
                    caseLabel="dream 0184-W3"
                    prepared="prepared 04 · 26"
                    rows={[
                      { k: "Paternal imago activation", pct: ".74", width: 74 },
                      { k: "Maternal threshold anxiety", pct: ".68", width: 68 },
                      { k: "Career / intimacy condensation", pct: ".81", width: 81 },
                      { k: "Sibling triangulation", pct: ".42", width: 42 },
                      { k: "Reversal of agency", pct: ".59", width: 59 },
                    ]}
                    footerLabel="Dominant"
                    footerValue="career · intimacy condensation"
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* THE WAKING DECISION */}
      <section className="page-section split-section">
        <div className="container">
          <div className="split-stack">
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Waking
                  </span>
                </div>
                <h3>
                  What the dream was{" "}
                  <span className="it">rehearsing</span>.
                </h3>
                <p>
                  The subject was three weeks into deliberating a job offer
                  that required a move to another city, near the apartment of
                  her childhood. The career and intimacy condensation that the
                  dream insisted on was the offer itself — the workplace
                  standing in for a house she had not lived in for two decades.
                </p>
                <p>
                  In session the next week she said the offer aloud and heard,
                  for the first time, that she had been considering whether to
                  go home.
                </p>
              </Reveal>
              <Reveal>
                <div className="closeout-italic">
                  the dream was the deliberation
                </div>
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
            Submit a dream of your own, <span className="it">or read the method</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Submit a dream <span className="arrow">→</span>
            </Link>
            <Link href="/methodology" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read the methodology
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

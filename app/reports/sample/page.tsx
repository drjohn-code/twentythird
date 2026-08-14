import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Reveal from "../../../components/layout/Reveal";
import FigureCard from "../../../components/figures/FigureCard";
import PatternList from "../../../components/figures/PatternList";
import ReportMock from "../../../components/figures/ReportMock";
import ScriptRevision from "../../../components/figures/ScriptRevision";
import DreamText, { Ann } from "../../../components/figures/DreamText";
import DreamKey from "../../../components/figures/DreamKey";

export const metadata: Metadata = {
  title: "Sample report — TwentyThird",
  description:
    "A complete TwentyThird report for a synthesised subject. Names and dates are invented; the structure is what we deliver.",
};

export default async function SampleReportPage() {
  const locale = await getLocale();
  const t = await getTranslations("marketing");
  return (
    // Body copy here is a hardcoded English sample report — never wired
    // through the locale layer (see I18N.md). lang="en" so it isn't
    // announced as Lithuanian; translating it is separate, fenced-off work.
    <main className="page-shell" lang="en">
      {locale === "lt" && (
        <p className="lede" lang="lt">
          {t("englishPageNotice")}
        </p>
      )}
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              SAMPLE REPORT · SUBJECT 217-B
            </div>
            <h1>
              A structural diagram of{" "}
              <span className="it">you</span>.
            </h1>
            <p className="lede">
              What follows is a complete TwentyThird report for a synthesised
              subject. Names, dates, and dream content are invented. The
              structure of the report is what we actually deliver.
            </p>
          </div>
        </div>
      </Reveal>

      {/* HEADER CHART */}
      <section className="page-section" style={{ paddingBottom: "0" }}>
        <div className="container">
          <Reveal>
            <FigureCard label="chart header" subtitle="subject 217-B" fig="Fig. 01">
              <div className="report-chart">
                <span className="rc-k">Subject</span>
                <span className="rc-v">217-B</span>
                <span className="rc-k">Cohort</span>
                <span className="rc-v">2025-Q1</span>
                <span className="rc-k">Period</span>
                <span className="rc-v">18 wks</span>
                <span className="rc-k">Sessions</span>
                <span className="rc-v">41</span>
                <span className="rc-k">Frame</span>
                <span className="rc-v">psychodynamic</span>
                <span className="rc-k">Language</span>
                <span className="rc-v">EN</span>
              </div>
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* STRUCTURAL DIAGNOSIS */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "0" }}>
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">STRUCTURAL DIAGNOSIS</div>
            <h2 className="head-h2">
              The <span className="it">organising</span> reading.
            </h2>
          </Reveal>

          <Reveal>
            <FigureCard
              label="structural reading"
              subtitle="five markers"
              fig="Fig. 02"
            >
              <div className="diagnosis-line">
                <span className="dl-eyebrow">PRIMARY READING</span>
                <span className="dl-name">obsessional · with hysterical traces</span>
              </div>
              <div style={{ height: "1px", background: "var(--hair)", margin: "8px 0 4px" }} />
              <ReportMock
                caseLabel="case 217-B"
                prepared="prepared 04 · 26"
                rows={[
                  { k: "Ego structure", pct: ".72", width: 72 },
                  { k: "Object relations", pct: ".48", width: 48 },
                  { k: "Defense complexity", pct: ".81", width: 81 },
                  { k: "Drive organisation", pct: ".54", width: 54 },
                  { k: "Symbolic register", pct: ".67", width: 67 },
                ]}
                footerLabel="Dominant"
                footerValue="rumination · over-qualification"
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* RECURRING PATTERNS */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "0" }}>
        <div className="container">
          <Reveal>
            <FigureCard
              label="recurrence"
              subtitle="five anchors across nineteen years"
              fig="Fig. 03"
            >
              <PatternList
                rows={[
                  { year: "2007", durationLabel: "first long bond", width: 62, outcome: "withdrew at month 9" },
                  { year: "2012", durationLabel: "second", width: 56, outcome: "withdrew at month 11" },
                  { year: "2016", durationLabel: "third", width: 60, outcome: "withdrew at month 8" },
                  { year: "2020", durationLabel: "fourth", width: 54, outcome: "withdrew at month 12" },
                  { year: "2024", durationLabel: "fifth", width: 64, outcome: "withdrew at month 10" },
                ]}
                summary={[
                  { k: "recurrence", v: "5 / 5" },
                  { k: "interval", v: "~10 mo" },
                  { k: "attractor", v: "intimacy threshold", italic: true },
                ]}
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* LINGUISTIC SIGNATURES */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "0" }}>
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">LINGUISTIC SIGNATURES</div>
            <h2 className="head-h2">
              The hinges in this subject&apos;s{" "}
              <span className="it">speech</span>.
            </h2>
          </Reveal>

          <Reveal>
            <FigureCard label="signatures" subtitle="six hinges" fig="Fig. 04">
              <div className="measure-grid" style={{ marginTop: 0 }}>
                <div className="measure-col">
                  <div className="measure-item">
                    <span className="k">over-use of the conditional</span>
                    <span className="gloss">Statements arrive prefaced by <em>I think</em> or <em>maybe</em> even when the speaker is sure.</span>
                  </div>
                  <div className="measure-item">
                    <span className="k">the word &ldquo;just&rdquo; as a hinge</span>
                    <span className="gloss">Used to shrink the speaker&apos;s own action. 14 instances per session.</span>
                  </div>
                  <div className="measure-item">
                    <span className="k">qualifier before affect</span>
                    <span className="gloss">Every emotional claim is softened before it lands.</span>
                  </div>
                </div>
                <div className="measure-col">
                  <div className="measure-item">
                    <span className="k">passive voice in self-narration</span>
                    <span className="gloss">Things happen to the subject; the subject rarely acts.</span>
                  </div>
                  <div className="measure-item">
                    <span className="k">slip of the parent&apos;s name</span>
                    <span className="gloss">Replaces partner with parent twice in eight sessions.</span>
                  </div>
                  <div className="measure-item">
                    <span className="k">recursive self-correction</span>
                    <span className="gloss">Three rewrites per claim before the claim is allowed to stand.</span>
                  </div>
                </div>
              </div>
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* SAMPLE DREAM */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "0" }}>
        <div className="container">
          <Reveal>
            <FigureCard label="dream" subtitle="session 12" fig="Fig. 05">
              <DreamText
                paragraphs={[
                  <>
                    &ldquo;I am holding a door open for someone whose face I
                    cannot see{" "}
                    <Ann n="01">imago</Ann>. The corridor behind them keeps
                    extending. I want to step through but the door is mine to
                    hold{" "}
                    <Ann n="02">role</Ann>.&rdquo;
                  </>,
                  <>
                    &ldquo;When I finally turn the figure has gone and I am the
                    one waiting at the threshold{" "}
                    <Ann n="03">reversal</Ann>.&rdquo;
                  </>,
                ]}
              />
              <DreamKey
                entries={[
                  { n: "01", label: "imago", gloss: "the partial parent who arrives in disguise" },
                  { n: "02", label: "role", gloss: "the function the subject habitually takes" },
                  { n: "03", label: "reversal", gloss: "the position swap that names what was hidden" },
                ]}
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* SCRIPT REVISIONS */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "0" }}>
        <div className="container">
          <Reveal>
            <FigureCard
              label="revisions"
              subtitle="in progress · week 14"
              fig="Fig. 06"
            >
              <ScriptRevision
                rows={[
                  {
                    prefix: "01 · I am",
                    old: "the one who holds the door.",
                    next: "also the one who walks through it.",
                  },
                  {
                    prefix: "02 · because",
                    old: "someone might be left waiting.",
                    next: "waiting is also a position I can refuse.",
                  },
                  {
                    prefix: "03 · so I",
                    old: "stay at the threshold.",
                    next: "let the threshold dissolve behind me.",
                  },
                  {
                    prefix: "04 · which means",
                    old: "I never quite arrive.",
                    next: "arrival is the part I had not been allowed to want.",
                  },
                ]}
                metaLeft={{ label: "original", value: "age 14" }}
                metaRight={{ label: "revised", value: "session 27" }}
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* RECOMMENDED FRAME */}
      <section className="page-section" style={{ paddingTop: "80px", paddingBottom: "60px" }}>
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">RECOMMENDED FRAME</div>
            <h2 className="head-h2">
              For the <span className="it">clinician&apos;s</span> use.
            </h2>
          </Reveal>

          <Reveal>
            <FigureCard label="handoff" subtitle="three notes" fig="Fig. 07">
              <div className="report-frame">
                <div className="rf-section">
                  <span className="rf-k">Opening transference question</span>
                  <p className="rf-p">
                    Ask early what the subject expects to leave undone in your
                    room. The phrasing will be a near-repeat of how she
                    describes her last withdrawal.
                  </p>
                </div>
                <div className="rf-section">
                  <span className="rf-k">Suggested pace</span>
                  <p className="rf-p">
                    Slow. Recursive self-correction will offer many openings;
                    refuse most. The hinge is the second sentence, never the
                    first.
                  </p>
                </div>
                <div className="rf-section">
                  <span className="rf-k">Contraindications</span>
                  <p className="rf-p">
                    No directive technique in the first eight sessions. The
                    subject already over-functions. A frame that asks for
                    performance will reproduce the symptom.
                  </p>
                </div>
              </div>
            </FigureCard>
          </Reveal>

          <Reveal>
            <p className="report-fineprint">
              not a diagnosis · prepared for clinician handoff · valid 90 days
            </p>
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
            Generate your own, <span className="it">or read the paper</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Generate your own <span className="arrow">→</span>
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

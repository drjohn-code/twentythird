import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import ScriptRevision from "../../components/figures/ScriptRevision";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.methodology");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

type StageProps = {
  num: string;
  stageLabel: string;
  name: React.ReactNode;
  blurb: React.ReactNode;
  fig: string;
  label: string;
  subtitle: string;
  children: React.ReactNode;
};

function Stage({ num, stageLabel, name, blurb, fig, label, subtitle, children }: StageProps) {
  return (
    <FigureCard
      label={label}
      subtitle={subtitle}
      fig={fig}
      className="pipeline-card"
    >
      <div className="pipeline-body">
        <div className="pipeline-copy">
          <div className="pipeline-stage">{stageLabel} {num}</div>
          <h3 className="pipeline-name">{name}</h3>
          <p className="pipeline-blurb">{blurb}</p>
        </div>
        <div className="pipeline-visual">{children}</div>
      </div>
    </FigureCard>
  );
}

export default async function MethodologyPage() {
  const t = await getTranslations("marketing.methodology");
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              {t("hero.eyebrow")}
            </div>
            <h1>
              {t("hero.headingLead")}{" "}
              <span className="it">{t("hero.headingItalic")}</span>.
            </h1>
            <p className="lede">
              {t("hero.lede")}
            </p>
          </div>
        </div>
      </Reveal>

      {/* THE PIPELINE — five stage cards */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("pipeline.eyebrow")}</div>
            <h2 className="head-h2">
              {t("pipeline.headingLead")} <span className="it">{t("pipeline.headingItalic")}</span>.
            </h2>
            <p className="lede">
              {t("pipeline.lede")}
            </p>
          </Reveal>

          <div className="pipeline-stack">
            <Reveal>
              <Stage
                num="01"
                stageLabel={t("pipeline.stageLabel")}
                name={<>{t("pipeline.stage01.name")}</>}
                blurb={<>{t("pipeline.stage01.blurb")}</>}
                fig="Fig. 01"
                label={t("pipeline.stage01.label")}
                subtitle={t("pipeline.stage01.subtitle")}
              >
                <div className="sampling-figure">
                  <div className="sf-row">
                    <span className="sf-k">{t("pipeline.stage01.fig.wordsSampled")}</span>
                    <span className="sf-v">~24,000</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">{t("pipeline.stage01.fig.sessions")}</span>
                    <span className="sf-v">18</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">{t("pipeline.stage01.fig.elapsed")}</span>
                    <span className="sf-v">~9 wks</span>
                  </div>
                  <div className="sf-row">
                    <span className="sf-k">{t("pipeline.stage01.fig.medianTurn")}</span>
                    <span className="sf-v">42 wds</span>
                  </div>
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="02"
                stageLabel={t("pipeline.stageLabel")}
                name={<>{t("pipeline.stage02.nameLead")} <em>{t("pipeline.stage02.nameEm")}</em></>}
                blurb={<>{t("pipeline.stage02.blurb")}</>}
                fig="Fig. 02"
                label={t("pipeline.stage02.label")}
                subtitle={t("pipeline.stage02.subtitle")}
              >
                <div className="mini-key">
                  <div className="mk-item">
                    <span className="mk-n">01</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.qualifierDensity")}</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">02</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.modalVerbs")}</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">03</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.conditionalFrame")}</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">04</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.affectiveHedges")}</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">05</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.slipsMisnamings")}</span>
                  </div>
                  <div className="mk-item">
                    <span className="mk-n">06</span>
                    <span className="mk-label">{t("pipeline.stage02.fig.repetitionWindows")}</span>
                  </div>
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="03"
                stageLabel={t("pipeline.stageLabel")}
                name={<>{t("pipeline.stage03.nameLead")} <em>{t("pipeline.stage03.nameEm")}</em></>}
                blurb={<>{t("pipeline.stage03.blurb")}</>}
                fig="Fig. 03"
                label={t("pipeline.stage03.label")}
                subtitle={t("pipeline.stage03.subtitle")}
              >
                <div className="mini-pattern">
                  <PatternList
                    rows={[
                      { year: "2014", durationLabel: t("pipeline.stage03.fig.row1.durationLabel"), width: 56, outcome: t("pipeline.stage03.fig.row1.outcome") },
                      { year: "2019", durationLabel: t("pipeline.stage03.fig.row2.durationLabel"), width: 60, outcome: t("pipeline.stage03.fig.row2.outcome") },
                      { year: "2024", durationLabel: t("pipeline.stage03.fig.row3.durationLabel"), width: 58, outcome: t("pipeline.stage03.fig.row3.outcome") },
                    ]}
                  />
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="04"
                stageLabel={t("pipeline.stageLabel")}
                name={<>{t("pipeline.stage04.nameLead")} <em>{t("pipeline.stage04.nameEm")}</em></>}
                blurb={<>{t("pipeline.stage04.blurb")}</>}
                fig="Fig. 04"
                label={t("pipeline.stage04.label")}
                subtitle={t("pipeline.stage04.subtitle")}
              >
                <div className="mini-script">
                  <ScriptRevision
                    rows={[
                      {
                        prefix: `01 · ${t("pipeline.stage04.fig.row1.prefix")}`,
                        old: t("pipeline.stage04.fig.row1.old"),
                        next: t("pipeline.stage04.fig.row1.next"),
                      },
                      {
                        prefix: `02 · ${t("pipeline.stage04.fig.row2.prefix")}`,
                        old: t("pipeline.stage04.fig.row2.old"),
                        next: t("pipeline.stage04.fig.row2.next"),
                      },
                    ]}
                  />
                </div>
              </Stage>
            </Reveal>

            <Reveal>
              <Stage
                num="05"
                stageLabel={t("pipeline.stageLabel")}
                name={<>{t("pipeline.stage05.nameLead")} <em>{t("pipeline.stage05.nameEm")}</em></>}
                blurb={<>{t("pipeline.stage05.blurb")}</>}
                fig="Fig. 05"
                label={t("pipeline.stage05.label")}
                subtitle={t("pipeline.stage05.subtitle")}
              >
                <div className="mini-report">
                  <ReportMock
                    caseLabel={`${t("pipeline.stage05.fig.casePrefix")} 0217-B`}
                    prepared={`${t("pipeline.stage05.fig.preparedPrefix")} 04 · 26`}
                    rows={[
                      { k: t("pipeline.stage05.fig.egoStructure"), pct: ".72", width: 72 },
                      { k: t("pipeline.stage05.fig.objectRelations"), pct: ".48", width: 48 },
                      { k: t("pipeline.stage05.fig.symbolicRegister"), pct: ".67", width: 67 },
                    ]}
                    footerLabel={t("pipeline.stage05.fig.footerLabel")}
                    footerValue={t("pipeline.stage05.fig.footerValue")}
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
            <div className="eyebrow">{t("scope.eyebrow")}</div>
            <h2 className="head-h2">
              {t("scope.headingLead")}{" "}
              <span className="it">{t("scope.headingItalic")}</span> {t("scope.headingTail")}
            </h2>
          </Reveal>

          <Reveal>
            <div className="measure-grid">
              <div className="measure-col">
                <div className="measure-head">{t("scope.measureHead")}</div>
                <div className="measure-item">
                  <span className="k">{t("scope.measure.languagePatterns.k")}</span>
                  <span className="gloss">{t("scope.measure.languagePatterns.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.measure.recurrence.k")}</span>
                  <span className="gloss">{t("scope.measure.recurrence.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.measure.narrativeCoherence.k")}</span>
                  <span className="gloss">{t("scope.measure.narrativeCoherence.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.measure.attachmentMarkers.k")}</span>
                  <span className="gloss">{t("scope.measure.attachmentMarkers.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.measure.linguisticSlips.k")}</span>
                  <span className="gloss">{t("scope.measure.linguisticSlips.gloss")}</span>
                </div>
              </div>
              <div className="measure-col">
                <div className="measure-head">{t("scope.refuseHead")}</div>
                <div className="measure-item">
                  <span className="k">{t("scope.refuse.dsmIcd.k")}</span>
                  <span className="gloss">{t("scope.refuse.dsmIcd.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.refuse.iqCognition.k")}</span>
                  <span className="gloss">{t("scope.refuse.iqCognition.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.refuse.personalityTypes.k")}</span>
                  <span className="gloss">{t("scope.refuse.personalityTypes.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.refuse.riskScores.k")}</span>
                  <span className="gloss">{t("scope.refuse.riskScores.gloss")}</span>
                </div>
                <div className="measure-item">
                  <span className="k">{t("scope.refuse.predictions.k")}</span>
                  <span className="gloss">{t("scope.refuse.predictions.gloss")}</span>
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
                    {t("compression.tag")}
                  </span>
                </div>
                <h3>
                  {t("compression.headingLead")} <span className="it">{t("compression.headingItalic")}</span>.
                </h3>
                <p>
                  {t("compression.body1")}
                </p>
                <p>
                  {t("compression.body2")}
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label={t("compression.figure.label")}
                  subtitle={t("compression.figure.subtitle")}
                  fig="Fig. 06"
                >
                  <InsightTimeline
                    heading={t("compression.figure.heading")}
                    range={t("compression.figure.range")}
                    markers={[
                      { day: 1 },
                      { day: 7 },
                      { day: 14, label: t("compression.figure.markerUnprepared") },
                      { day: 23, label: t("compression.figure.markerPrepared"), inflection: true },
                    ]}
                    summaryBig="~6"
                    summaryLabel={t("compression.figure.summaryLabel")}
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
            {t("finalCta.eyebrow")}
          </div>
          <h2>
            {t("finalCta.headingLead")} <span className="it">{t("finalCta.headingItalic")}</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              {t("finalCta.beginLabel")} <span className="arrow">→</span>
            </Link>
            <Link href="/reports/sample" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("finalCta.or")}
              </span>{" "}
              {t("finalCta.ghostLabel")}
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import ScriptRevision from "../../components/figures/ScriptRevision";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.about");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("marketing.about");
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero split-section">
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
          <FigureCard
            label={t("hero.figure.label")}
            subtitle={t("hero.figure.subtitle")}
            fig="Fig. 01"
          >
            <InsightTimeline
              heading={t("hero.figure.heading")}
              range={t("hero.figure.range")}
              markers={[
                { day: 1, label: "" },
                { day: 7, label: "" },
                { day: 14, label: "" },
                { day: 23, label: t("hero.figure.markerInflection"), inflection: true },
              ]}
              summaryBig="23"
              summaryLabel={t("hero.figure.summaryLabel")}
            />
          </FigureCard>
        </div>
      </Reveal>

      {/* PHILOSOPHY */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("philosophy.eyebrow")}</div>
            <h2 className="head-h2">
              {t("philosophy.headingLead")}{" "}
              <span className="it">{t("philosophy.headingItalic")}</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("philosophy.tag")}
                  </span>
                </div>
                <h3>
                  {t("philosophy.row.headingPre")} <span className="it">{t("philosophy.row.headingItalic")}</span> {t("philosophy.row.headingPost")}
                </h3>
                <p>
                  {t("philosophy.row.para1")}
                </p>
                <p>
                  {t("philosophy.row.para2")}
                </p>
              </div>
              <FigureCard label={t("philosophy.figure.label")} subtitle={t("philosophy.figure.subtitle")} fig="Fig. 02">
                <PatternList
                  rows={[
                    {
                      year: "1897",
                      durationLabel: "Fliess–Freud",
                      width: 42,
                      outcome: t("philosophy.figure.row1Outcome"),
                    },
                    {
                      year: "1923",
                      durationLabel: t("philosophy.figure.row2Duration"),
                      width: 60,
                      outcome: t("philosophy.figure.row2Outcome"),
                    },
                    {
                      year: "1953",
                      durationLabel: t("philosophy.figure.row3Duration"),
                      width: 54,
                      outcome: t("philosophy.figure.row3Outcome"),
                    },
                    {
                      year: "2026",
                      durationLabel: "TwentyThird",
                      width: 68,
                      outcome: t("philosophy.figure.row4Outcome"),
                    },
                  ]}
                  summary={[
                    { k: t("philosophy.figure.summary1Key"), v: "~30 yrs" },
                    { k: t("philosophy.figure.summary2Key"), v: t("philosophy.figure.summary2Value"), italic: true },
                    { k: t("philosophy.figure.summary3Key"), v: t("philosophy.figure.summary3Value") },
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
            <div className="eyebrow">{t("origin.eyebrow")}</div>
            <h2 className="head-h2">
              {t("origin.headingLead")}{" "}
              <span className="it">{t("origin.headingItalic")}</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("origin.tag")}
                  </span>
                </div>
                <h3>
                  {t("origin.row.headingLead")}{" "}
                  <span className="it">{t("origin.row.headingItalic")}</span>.
                </h3>
                <p>
                  {t("origin.row.para1")}
                </p>
                <p>
                  {t("origin.row.para2")}
                </p>
              </div>
              <FigureCard label={t("origin.figure.label")} subtitle={t("origin.figure.subtitle")} fig="Fig. 03">
                <ReportMock
                  caseLabel={t("origin.figure.caseLabel")}
                  prepared={t("origin.figure.prepared")}
                  rows={[
                    { k: t("origin.figure.row1Key"), pct: "12 yrs", width: 78 },
                    {
                      k: t("origin.figure.row2Key"),
                      pct: "n = 47",
                      width: 62,
                    },
                    {
                      k: t("origin.figure.row3Key"),
                      pct: "n = 2,418",
                      width: 84,
                    },
                    { k: t("origin.figure.row4Key"), pct: "04", width: 30 },
                  ]}
                  footerLabel={t("origin.figure.footerLabel")}
                  footerValue={t("origin.figure.footerValue")}
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
            <div className="eyebrow">{t("method.eyebrow")}</div>
            <h2 className="head-h2">
              {t("method.headingLead")} <span className="it">{t("method.headingItalic")}</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("method.tag")}
                  </span>
                </div>
                <h3>
                  {t("method.row.headingLead")}{" "}
                  <span className="it">{t("method.row.headingItalic")}</span>.
                </h3>
                <p>
                  {t.rich("method.row.para1", {
                    em: (chunks) => <em>{chunks}</em>,
                  })}
                </p>
                <p>
                  {t("method.row.para2")}
                </p>
              </div>
              <FigureCard
                label={t("method.figure.label")}
                subtitle={t("method.figure.subtitle")}
                fig="Fig. 04"
              >
                <ScriptRevision
                  rows={[
                    {
                      prefix: t("method.figure.row1Prefix"),
                      old: t("method.figure.row1Old"),
                      next: t("method.figure.row1Next"),
                    },
                    {
                      prefix: t("method.figure.row2Prefix"),
                      old: t("method.figure.row2Old"),
                      next: t("method.figure.row2Next"),
                    },
                    {
                      prefix: t("method.figure.row3Prefix"),
                      old: t("method.figure.row3Old"),
                      next: t("method.figure.row3Next"),
                    },
                  ]}
                  metaLeft={{ label: t("method.figure.metaLeftLabel"), value: t("method.figure.metaLeftValue") }}
                  metaRight={{ label: t("method.figure.metaRightLabel"), value: t("method.figure.metaRightValue") }}
                />
              </FigureCard>
            </div>
          </div>
        </div>
      </section>

      {/* AUTHOR */}
      <Reveal as="section" className="page-section author-section">
        <div className="container">
          <div className="split-row">
            <div className="author-portrait">
              <div className="portrait-wrap">
                <Image
                  src="/images/John.jpeg"
                  alt={t("author.photoAlt")}
                  width={1200}
                  height={896}
                  sizes="(max-width: 980px) 100vw, 40vw"
                />
              </div>
              <div className="caption">
                <span className="mono">{t("author.portraitCaption")}</span>
                <span className="name">{t("author.portraitName")}</span>
              </div>
            </div>
            <div className="split-copy author-copy">
              <div className="eyebrow">{t("author.eyebrow")}</div>
              <h2>
                {t("author.headingLead")}{" "}
                <span className="it">{t("author.headingItalic")}</span>.
              </h2>
              <p>{t("author.para1")}</p>
              <p>{t("author.para2")}</p>
              <div className="author-links">
                <a
                  className="author-link"
                  href="https://www.linkedin.com/in/muhammadi-bg/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="author-link-label">
                    {t("author.linkedinLabel")}
                  </span>
                  <span className="ar" aria-hidden="true">→</span>
                </a>
                <a className="author-link" href="mailto:john@wellowork.net">
                  <span className="author-link-label">
                    {t("author.emailLabel")}
                  </span>
                  <span className="ar" aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal as="section" className="page-final">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            {t("final.eyebrow")}
          </div>
          <h2>
            {t("final.headingLead")} <span className="it">{t("final.headingItalic")}</span>.
          </h2>
          <div className="cta-row">
            <Link href="/" className="cta">
              {t("final.ctaPrimary")} <span className="arrow">→</span>
            </Link>
            <Link href="/contact" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("final.ctaGhostPrefix")}
              </span>{" "}
              {t("final.ctaGhostText")}
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

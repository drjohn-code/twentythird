import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import PatternList from "../../components/figures/PatternList";
import ReportMock from "../../components/figures/ReportMock";
import DreamText, { Ann } from "../../components/figures/DreamText";
import DreamKey from "../../components/figures/DreamKey";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.science");
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function SciencePage() {
  const t = await getTranslations("marketing.science");
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
              {t("hero.headlineLead")}{" "}
              <span className="it">{t("hero.headlineItalic")}</span>{t("hero.headlineTail")}
            </h1>
            <p className="lede">
              {t("hero.lede")}
            </p>
          </div>
        </div>
      </Reveal>

      {/* TWO LINEAGES */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("lineages.eyebrow")}</div>
            <h2 className="head-h2">
              {t("lineages.headlineLead")}{" "}
              <span className="it">{t("lineages.headlineItalic")}</span>{t("lineages.headlineTail")}
            </h2>
            <p className="lede">
              {t("lineages.lede")}
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
                  {t("lineages.freud.headlineLead")} <span className="it">{t("lineages.freud.headlineItalic")}</span>{t("lineages.freud.headlineTail")}
                </h3>
                <p>
                  {t("lineages.freud.body1")}
                </p>
                <p>
                  {t("lineages.freud.body2")}
                </p>
              </div>
              <FigureCard
                label={t("lineages.freud.figure.label")}
                subtitle={t("lineages.freud.figure.subtitle")}
                fig="Fig. 01"
              >
                <PatternList
                  rows={[
                    { year: "1998", durationLabel: t("lineages.freud.figure.rows.anchor1"), width: 54, outcome: t("lineages.freud.figure.outcome") },
                    { year: "2006", durationLabel: t("lineages.freud.figure.rows.anchor2"), width: 62, outcome: t("lineages.freud.figure.outcome") },
                    { year: "2013", durationLabel: t("lineages.freud.figure.rows.anchor3"), width: 58, outcome: t("lineages.freud.figure.outcome") },
                    { year: "2019", durationLabel: t("lineages.freud.figure.rows.anchor4"), width: 66, outcome: t("lineages.freud.figure.outcome") },
                    { year: "2025", durationLabel: t("lineages.freud.figure.rows.anchor5"), width: 60, outcome: t("lineages.freud.figure.outcome") },
                  ]}
                  summary={[
                    { k: t("lineages.freud.figure.summary.recurrenceLabel"), v: "5 / 5" },
                    { k: t("lineages.freud.figure.summary.intervalLabel"), v: "~7 yrs" },
                    { k: t("lineages.freud.figure.summary.attractorLabel"), v: t("lineages.freud.figure.summary.attractorValue"), italic: true },
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
                  {t("lineages.lacan.headlineLead")}{" "}
                  <span className="it">{t("lineages.lacan.headlineItalic")}</span>{t("lineages.lacan.headlineTail")}
                </h3>
                <p>
                  {t("lineages.lacan.body1Lead")}{" "}
                  <em>{t("lineages.lacan.body1Italic")}</em>
                </p>
                <p>
                  {t("lineages.lacan.body2")}
                </p>
              </div>
              <FigureCard
                label={t("lineages.lacan.figure.label")}
                subtitle={t("lineages.lacan.figure.subtitle")}
                fig="Fig. 02"
              >
                <DreamText
                  paragraphs={[
                    <>
                      {t("lineages.lacan.figure.dreamLead")}{" "}
                      <Ann n="01">{t("lineages.lacan.figure.ann1")}</Ann>{t("lineages.lacan.figure.dreamMid1")}{" "}
                      <Ann n="02">{t("lineages.lacan.figure.ann2")}</Ann> {t("lineages.lacan.figure.dreamMid2")}{" "}
                      <Ann n="03">{t("lineages.lacan.figure.ann3")}</Ann>{t("lineages.lacan.figure.dreamTail")}
                    </>,
                  ]}
                />
                <DreamKey
                  entries={[
                    { n: "01", label: t("lineages.lacan.figure.key1") },
                    { n: "02", label: t("lineages.lacan.figure.key2") },
                    { n: "03", label: t("lineages.lacan.figure.key3") },
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
            <div className="eyebrow">{t("research.eyebrow")}</div>
            <h2 className="head-h2">
              {t("research.headlineLead")} <span className="it">{t("research.headlineItalic")}</span>{t("research.headlineTail")}
            </h2>
            <p className="lede">
              {t("research.lede")}
            </p>
          </Reveal>

          <Reveal>
            <FigureCard
              label={t("research.figure.label")}
              subtitle={t("research.figure.subtitle")}
              fig="Fig. 03"
            >
              <ReportMock
                caseLabel={t("research.figure.caseLabel")}
                prepared={t("research.figure.prepared")}
                rows={[
                  { k: t("research.figure.rows.attachment"), pct: ".78", width: 78 },
                  { k: t("research.figure.rows.alliance"), pct: ".64", width: 64 },
                  { k: t("research.figure.rows.narrative"), pct: ".57", width: 57 },
                  { k: t("research.figure.rows.relational"), pct: ".49", width: 49 },
                  { k: t("research.figure.rows.script"), pct: ".42", width: 42 },
                ]}
                footerLabel={t("research.figure.footerLabel")}
                footerValue={t("research.figure.footerValue")}
              />
            </FigureCard>
          </Reveal>
        </div>
      </section>

      {/* CLAIMS / LIMITS */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("limits.eyebrow")}</div>
            <h2 className="head-h2">
              {t("limits.headlineLead")} <span className="it">{t("limits.headlineItalic")}</span>{t("limits.headlineTail")}
            </h2>
          </Reveal>

          <Reveal className="mono-prose">
            <p>
              <strong>{t("limits.claim1Strong")}</strong> {t("limits.claim1Body")}
            </p>
            <p>
              <strong>{t("limits.claim2Strong")}</strong>{" "}
              {t("limits.claim2Body")}
            </p>
            <p>
              <strong>{t("limits.claim3Strong")}</strong> {t("limits.claim3Body")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* FURTHER READING */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("reading.eyebrow")}</div>
            <h2 className="head-h2">
              {t("reading.headlineLead")} <span className="it">{t("reading.headlineItalic")}</span>{t("reading.headlineTail")}
            </h2>
            <p className="lede">
              {t("reading.lede")}
            </p>
          </Reveal>

          <Reveal>
            <div className="hair-list">
              <div className="hair-item">
                <span className="hair-num">01</span>
                <span className="hair-title">{t("reading.books.book1.title")}</span>
                <span className="hair-meta">Sigmund Freud · 1920</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">02</span>
                <span className="hair-title">{t("reading.books.book2.title")}</span>
                <span className="hair-meta">Sigmund Freud · 1900</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">03</span>
                <span className="hair-title">Écrits</span>
                <span className="hair-meta">Jacques Lacan · 1966</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">04</span>
                <span className="hair-title">{t("reading.books.book4.title")}</span>
                <span className="hair-meta">Jacques Lacan · 1973</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">05</span>
                <span className="hair-title">{t("reading.books.book5.title")}</span>
                <span className="hair-meta">John Bowlby · 1969</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">06</span>
                <span className="hair-title">{t("reading.books.book6.title")}</span>
                <span className="hair-meta">Allan Schore · 1994</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">07</span>
                <span className="hair-title">{t("reading.books.book7.title")}</span>
                <span className="hair-meta">Philip Bromberg · 1998</span>
              </div>
              <div className="hair-item">
                <span className="hair-num">08</span>
                <span className="hair-title">{t("reading.books.book8.title")}</span>
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
            {t("final.eyebrow")}
          </div>
          <h2>
            {t("final.headlineLead")} <span className="it">{t("final.headlineItalic")}</span>{t("final.headlineTail")}
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              {t("final.ctaPrimary")} <span className="arrow">→</span>
            </Link>
            <Link href="/case-studies/relational-attractor" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("final.ctaOr")}
              </span>{" "}
              {t("final.ctaGhost")}
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

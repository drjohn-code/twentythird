import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import InsightTimeline from "../../components/figures/InsightTimeline";
import ScriptRevision from "../../components/figures/ScriptRevision";

export const metadata: Metadata = {
  title: "Insight, then habit — TwentyThird",
  description:
    "Daily prompts and small rituals built around your structure, not a generic curriculum. The integration layer of TwentyThird.",
};

type DayCardProps = {
  day: string;
  num: string;
  prompt: React.ReactNode;
  stream: Array<{ label: string; time: string; done?: boolean }>;
  pips: boolean[];
};

function DayCard({ day, num, prompt, stream, pips }: DayCardProps) {
  return (
    <div className="week-card">
      <div className="wc-head">
        <span className="wc-day">{day}</span>
        <span className="wc-num">{num}</span>
      </div>
      <div className="wc-prompt">{prompt}</div>
      <div className="wc-stream">
        {stream.map((row, i) => (
          <div key={i} className="wc-stream-row">
            <span className={row.done ? "wc-dot done" : "wc-dot"}></span>
            <span className="wc-label">{row.label}</span>
            <span>{row.time}</span>
          </div>
        ))}
      </div>
      <div className="wc-pips" aria-hidden="true">
        {pips.map((on, i) => (
          <i key={i} className={on ? "on" : ""}></i>
        ))}
      </div>
    </div>
  );
}

export default async function PlanPage() {
  const t = await getTranslations("marketing.plan");
  const tc = await getTranslations("common");
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
              {t("hero.headlineLead")} <span className="it">{t("hero.headlineItalic")}</span>.
            </h1>
            <p className="lede">
              {t("hero.lede")}
            </p>
          </div>
        </div>
      </Reveal>

      {/* A WEEK IN THE PLAN */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("week.eyebrow")}</div>
            <h2 className="head-h2">
              {t("week.headlineLead")}{" "}
              <span className="it">{t("week.headlineItalic")}</span>.
            </h2>
            <p className="lede">
              {t("week.lede")}
            </p>
          </Reveal>

          <Reveal>
            <div className="week-grid">
              <DayCard
                day={t("week.days.mon.day")}
                num="01"
                prompt={t.rich("week.days.mon.prompt", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
                stream={[
                  { label: t("week.days.mon.stream.journal"), time: "07:10", done: true },
                  { label: t("week.days.mon.stream.shadowPrompt"), time: "20:00" },
                ]}
                pips={[true, true, true, false, false, false, false]}
              />
              <DayCard
                day={t("week.days.tue.day")}
                num="02"
                prompt={t("week.days.tue.prompt")}
                stream={[
                  { label: t("week.days.tue.stream.walking"), time: "08:30", done: true },
                  { label: t("week.days.tue.stream.note"), time: "09:10", done: true },
                ]}
                pips={[true, true, true, true, false, false, false]}
              />
              <DayCard
                day={t("week.days.wed.day")}
                num="03"
                prompt={t.rich("week.days.wed.prompt", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
                stream={[
                  { label: t("week.days.wed.stream.breathWork"), time: "06:30", done: true },
                  { label: t("week.days.wed.stream.journal"), time: "12:45", done: true },
                  { label: t("week.days.wed.stream.shadowPrompt"), time: "20:00" },
                ]}
                pips={[true, true, true, true, true, false, false]}
              />
              <DayCard
                day={t("week.days.thu.day")}
                num="04"
                prompt={t("week.days.thu.prompt")}
                stream={[
                  { label: t("week.days.thu.stream.bodyScan"), time: "07:00", done: true },
                  { label: t("week.days.thu.stream.note"), time: "07:20", done: true },
                ]}
                pips={[true, true, true, true, true, true, false]}
              />
              <DayCard
                day={t("week.days.fri.day")}
                num="05"
                prompt={t("week.days.fri.prompt")}
                stream={[
                  { label: t("week.days.fri.stream.journal"), time: "08:00", done: true },
                  { label: t("week.days.fri.stream.rewrite"), time: "20:30" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
              <DayCard
                day={t("week.days.sat.day")}
                num="06"
                prompt={t("week.days.sat.prompt")}
                stream={[
                  { label: t("week.days.sat.stream.walking"), time: "10:00" },
                  { label: t("week.days.sat.stream.rest"), time: "—" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
              <DayCard
                day={t("week.days.sun.day")}
                num="07"
                prompt={t.rich("week.days.sun.prompt", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
                stream={[
                  { label: t("week.days.sun.stream.review"), time: "19:00" },
                  { label: t("week.days.sun.stream.note"), time: "19:30" },
                ]}
                pips={[true, true, true, true, true, true, true]}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW THE PLAN ADAPTS */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("adaptation.eyebrow")}</div>
            <h2 className="head-h2">
              {t("adaptation.headlineLead")} <span className="it">{t("adaptation.headlineItalic")}</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("adaptation.tag")}
                  </span>
                </div>
                <h3>
                  {t("adaptation.rowHeadingLead")}{" "}
                  <span className="it">{t("adaptation.rowHeadingItalic")}</span>.
                </h3>
                <p>
                  {t("adaptation.body")}
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label={t("adaptation.figure.label")}
                  subtitle={t("adaptation.figure.subtitle")}
                  fig="Fig. 01"
                >
                  <InsightTimeline
                    heading={t("adaptation.figure.heading")}
                    range={t("adaptation.figure.range")}
                    markers={[
                      { day: 1, label: t("adaptation.figure.markers.wk1") },
                      { day: 7, label: t("adaptation.figure.markers.wk3") },
                      { day: 14, label: t("adaptation.figure.markers.wk5") },
                      { day: 23, label: t("adaptation.figure.markers.wk8"), inflection: true },
                    ]}
                    summaryBig="~38%"
                    summaryLabel={t("adaptation.figure.summaryLabel")}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* SHADOW WORK */}
      <section className="page-section split-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("shadow.eyebrow")}</div>
            <h2 className="head-h2">
              {t("shadow.headlineLead")} <span className="it">{t("shadow.headlineItalic")}</span>.
            </h2>
          </Reveal>

          <div className="split-stack">
            <div className="split-row reverse">
              <Reveal className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("shadow.tag")}
                  </span>
                </div>
                <h3>
                  {t("shadow.rowHeadingLead")}{" "}
                  <span className="it">{t("shadow.rowHeadingItalic")}</span>.
                </h3>
                <p>
                  {t("shadow.body")}
                </p>
              </Reveal>
              <Reveal>
                <FigureCard
                  label={t("shadow.figure.label")}
                  subtitle={t("shadow.figure.subtitle")}
                  fig="Fig. 02"
                >
                  <ScriptRevision
                    rows={[
                      {
                        prefix: t("shadow.figure.rows.r1.prefix"),
                        old: t("shadow.figure.rows.r1.old"),
                        next: t("shadow.figure.rows.r1.next"),
                      },
                      {
                        prefix: t("shadow.figure.rows.r2.prefix"),
                        old: t("shadow.figure.rows.r2.old"),
                        next: t("shadow.figure.rows.r2.next"),
                      },
                      {
                        prefix: t("shadow.figure.rows.r3.prefix"),
                        old: t("shadow.figure.rows.r3.old"),
                        next: t("shadow.figure.rows.r3.next"),
                      },
                    ]}
                    metaLeft={{ label: t("shadow.figure.metaLeft.label"), value: t("shadow.figure.metaLeft.value") }}
                    metaRight={{ label: t("shadow.figure.metaRight.label"), value: t("shadow.figure.metaRight.value") }}
                  />
                </FigureCard>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* HELD BY STRUCTURE, NOT CURRICULUM */}
      <section className="page-section">
        <div className="container">
          <Reveal className="section-head">
            <div className="eyebrow">{t("frame.eyebrow")}</div>
            <h2 className="head-h2">
              {t("frame.headlineLead")}{" "}
              <span className="it">{t("frame.headlineItalic")}</span>.
            </h2>
          </Reveal>

          <Reveal className="mono-prose">
            <p>
              {t("frame.body1")}
            </p>
            <p>
              {t("frame.body2")}
            </p>
          </Reveal>

          <Reveal>
            <div className="closeout-italic">
              {t("frame.closeout")}
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
            {t("final.headlineLead")} <span className="it">{t("final.headlineItalic")}</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              {t("final.beginCta")} <span className="arrow">→</span>
            </Link>
            <Link href="/science" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("final.or")}
              </span>{" "}
              {t("final.readScience")}
            </Link>
          </div>
          <p className="mono" style={{ marginTop: "20px", color: "var(--fg-mute)" }}>
            {tc("priceLine", { sub: "€23.23", report: "€11.11" })}
          </p>
          <p className="mono" style={{ marginTop: "8px", color: "var(--fg-mute)" }}>
            {tc("processLine")}
          </p>
        </div>
      </Reveal>
    </main>
  );
}

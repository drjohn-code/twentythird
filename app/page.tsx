import { getTranslations } from "next-intl/server";
import LandingInteractions from "./landing-interactions";

export default async function LandingPage() {
  const t = await getTranslations("marketing.landing");
  const tc = await getTranslations("common");
  return (
    <main className="shell">
      {/* HERO */}
      <section className="hero">
        <div className="hero-portrait" data-fade>
          <div className="portrait-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Freud.png" alt="Sigmund Freud" />
          </div>
          <div className="caption">
            <span className="mono">PORTRAIT — 1921</span>
            <span className="name">Sigmund Freud</span>
          </div>
        </div>
        <div className="hero-copy reveal">
          <div
            className="eyebrow"
            style={{ marginBottom: "32px", fontSize: "1px" }}
          >
            {t("hero.eyebrow")}{" "}
          </div>
          <h1>
            {t("hero.titleLine1")}
            <br />
            {t("hero.titleLine2Pre")} <span className="it">{t("hero.titleLine2It")}</span>,{" "}
            <span className="break">
              {t("hero.titleLine3Pre")} <span className="it">{t("hero.titleLine3It")}</span>
            </span>
          </h1>
          <div className="cta-row">
            <a href="/auth/sign-up" className="cta">
              {t("hero.ctaPrimary")}
              <span className="arrow">→</span>
            </a>
            <a href="/science" className="cta-ghost">
              <span
                style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}
              >
                {t("hero.ctaGhostOr")}
              </span>{" "}
              {t("hero.ctaGhostText")}
            </a>
          </div>
          <p className="mono" style={{ marginTop: "20px", color: "var(--fg-mute)" }}>
            {tc("priceLine", { sub: "€23.23", report: "€11.11" })}
          </p>
          <p className="mono" style={{ marginTop: "8px", color: "var(--fg-mute)" }}>
            {tc("processLine")}
          </p>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="philosophy" id="philosophy">
        <div className="philo-copy reveal">
          <div className="eyebrow" style={{ fontSize: "1px" }}>
            {t("philosophy.eyebrow")}
          </div>
          <h2>
            {t("philosophy.titlePre")}{" "}
            <span className="it">{t("philosophy.titleIt")}</span>.
          </h2>
          <p className="sub">
            {t("philosophy.sub1")}
          </p>
          <p className="sub">
            {t("philosophy.sub2")}
          </p>
          <div className="philo-meta">
            <div>
              <span className="label">{t("philosophy.metaLineageLabel")}</span>
              <span className="val">{t("philosophy.metaLineageVal")}</span>
            </div>
            <div>
              <span className="label">{t("philosophy.metaMethodLabel")}</span>
              <span className="val">{t("philosophy.metaMethodVal")}</span>
            </div>
            <div>
              <span className="label">{t("philosophy.metaFocusLabel")}</span>
              <span className="val">{t("philosophy.metaFocusVal")}</span>
            </div>
          </div>
        </div>
        <div className="philo-portrait reveal" data-fade>
          <div className="portrait-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Lacan.png" alt="Jacques Lacan" />
          </div>
          <div className="caption">
            <span className="mono">PORTRAIT — 1967</span>
            <span className="name">Jacques Lacan</span>
          </div>
        </div>
      </section>

      {/* DATA PRIVACY */}
      <section className="split-section" id="privacy">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow" style={{ fontSize: "16px" }}>
              {t("privacy.eyebrow")}
            </div>
            <h2>
              {t("privacy.titlePre")} <span className="it">{t("privacy.titleIt")}</span> {t("privacy.titlePost")}
            </h2>
            <p className="lede">
              {t("privacy.lede")}
            </p>
          </div>

          <div className="split-stack">
            <div className="split-row">
              <div className="split-copy reveal">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("privacy.rowTag")}
                  </span>
                </div>
                <h3>
                  {t("privacy.rowTitlePre")} <span className="it">{t("privacy.rowTitleIt")}</span> {t("privacy.rowTitlePost")}
                </h3>
                <p>
                  {t("privacy.rowBody")}
                </p>
              </div>
              <div className="split-visual glass reveal">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("privacy.figLabel")}</span> <em>{t("privacy.figSubtitle")}</em>
                  </span>
                  <span>Fig. 02</span>
                </div>
                <div className="vb">
                  <ul className="privacy-list">
                    <li>
                      <span className="k">{t("privacy.listProcessingKey")}</span>
                      <span className="v">
                        {t("privacy.listProcessingVal")}
                      </span>
                    </li>
                    <li>
                      <span className="k">{t("privacy.listEncryptionKey")}</span>
                      <span className="v">{t("privacy.listEncryptionVal")}</span>
                    </li>
                    <li>
                      <span className="k">{t("privacy.listProtectionKey")}</span>
                      <span className="v">
                        {t("privacy.listProtectionVal")}
                      </span>
                    </li>
                  </ul>
                  <div className="privacy-foot">
                    <span className="k">{t("privacy.footKey")}</span>
                    <span className="v">
                      {t("privacy.footVal")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="split-section" id="process">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow" style={{ fontSize: "16px" }}>
              {t("process.eyebrow")}
            </div>
            <h2>
              {t("process.titlePre")} <span className="it">{t("process.titleIt")}</span>.
            </h2>
            <p className="lede">
              {t("process.lede")}
            </p>
          </div>

          <div className="story-grid">
            <article className="story-step glass reveal">
              <div className="story-head">
                <span className="story-num">STEP 01</span>
                <span className="story-sub">{t("process.step1Sub")}</span>
              </div>
              <h3>
                {t("process.step1TitlePre")} <span className="it">{t("process.step1TitleIt")}</span> {t("process.step1TitlePost")}
              </h3>
              <p>
                {t("process.step1Body")}
              </p>
            </article>

            <article className="story-step glass reveal">
              <div className="story-head">
                <span className="story-num">STEP 02</span>
                <span className="story-sub">{t("process.step2Sub")}</span>
              </div>
              <h3>
                {t("process.step2TitlePre")} <span className="it">{t("process.step2TitleIt")}</span>.
              </h3>
              <p>
                {t("process.step2Body")}
              </p>
            </article>

            <article className="story-step glass reveal">
              <div className="story-head">
                <span className="story-num">STEP 03</span>
                <span className="story-sub">{t("process.step3Sub")}</span>
              </div>
              <h3>
                {t("process.step3TitlePre")} <span className="it">{t("process.step3TitleIt")}</span>.
              </h3>
              <p>
                {t("process.step3Body")}
              </p>
            </article>

            <article className="story-step glass reveal">
              <div className="story-head">
                <span className="story-num">STEP 04</span>
                <span className="story-sub">{t("process.step4Sub")}</span>
              </div>
              <h3>
                {t("process.step4TitlePre")} <span className="it">{t("process.step4TitleIt")}</span>.
              </h3>
              <p>
                {t("process.step4Body")}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* BRAIN (pinned) */}
      <section className="brain-pin" id="brain">
        <div className="brain-stage">
          <div className="brain-visual">
            <div className="brain-halo"></div>
            <div className="brain-rings">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brain-img" src="/images/Brain.png" alt="" />
          </div>
          <div className="brain-copy">
            <div className="eyebrow" style={{ fontSize: "16px" }}>
              {t("brain.eyebrow")}
            </div>
            <h2>
              {t("brain.titleLine1")}
              <br />
              {t("brain.titleLine2")}
            </h2>
            <div className="brain-states">
              <div className="brain-state active" data-state="0">
                <div className="tag">
                  <span className="num"></span> {t("brain.state1Tag")}
                </div>
                <h3>
                  {t("brain.state1TitlePre")} <span className="it">{t("brain.state1TitleIt")}</span> {t("brain.state1TitlePost")}
                </h3>
                <p>
                  {t("brain.state1Body")}
                </p>
              </div>
              <div className="brain-state" data-state="1">
                <div className="tag">
                  <span className="num"></span> {t("brain.state2Tag")}
                </div>
                <h3>
                  {t("brain.state2TitlePre")} <span className="it">{t("brain.state2TitleIt")}</span>{" "}
                  {t("brain.state2TitlePost")}
                </h3>
                <p>
                  {t("brain.state2Body")}
                </p>
              </div>
              <div className="brain-state" data-state="2">
                <div className="tag">
                  <span className="num"></span> {t("brain.state3Tag")}
                </div>
                <h3>
                  {t("brain.state3TitlePre")} <span className="it">{t("brain.state3TitleIt")}</span>{" "}
                  {t("brain.state3TitlePost")}
                </h3>
                <p>
                  {t("brain.state3Body")}
                </p>
              </div>
            </div>
          </div>
          <div className="brain-progress" aria-hidden="true">
            <div className="pip-label">A</div>
            <div className="pip active" data-pip="0"></div>
            <div className="pip-label">B</div>
            <div className="pip" data-pip="1"></div>
            <div className="pip-label">C</div>
            <div className="pip" data-pip="2"></div>
          </div>
        </div>
      </section>

      {/* TRANSFORM */}
      <section className="split-section" id="transform">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow" style={{ fontSize: "16px" }}>
              {t("transform.eyebrow")}
            </div>
            <h2>
              {t("transform.titleLine1")}
              <br />
              {t("transform.titleLine2")}
            </h2>
            <p className="lede">
              {t("transform.lede")}
            </p>
          </div>

          <div className="split-stack">
            {/* Row 01 — Relational Dynamics */}
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("transform.row1Tag")}
                  </span>
                </div>
                <h3>
                  {t("transform.row1TitlePre")} <span className="it">{t("transform.row1TitleIt")}</span> {t("transform.row1TitlePost")}
                </h3>
                <p>
                  {t("transform.row1Body")}
                </p>
                <a href="/case-studies/relational-attractor" className="row-link">
                  {t("transform.row1Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("transform.row1FigLabel")}</span>{" "}
                    <em>{t("transform.row1FigSubtitle")}</em>
                  </span>
                  <span>Fig. 03</span>
                </div>
                <div className="vb">
                  <ul className="pattern-list">
                    <li>
                      <span className="year">2019</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">14 wks</span>
                      </span>
                      <span className="out">{t("transform.row1Outcome")}</span>
                    </li>
                    <li>
                      <span className="year">2021</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">13 wks</span>
                      </span>
                      <span className="out">{t("transform.row1Outcome")}</span>
                    </li>
                    <li>
                      <span className="year">2023</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">15 wks</span>
                      </span>
                      <span className="out">{t("transform.row1Outcome")}</span>
                    </li>
                    <li>
                      <span className="year">2025</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">14 wks</span>
                      </span>
                      <span className="out">{t("transform.row1Outcome")}</span>
                    </li>
                  </ul>
                  <div className="pattern-summary">
                    <div className="ps-row">
                      <span className="k">{t("transform.row1SummaryRecurrenceKey")}</span>
                      <span className="v">4 / 4</span>
                    </div>
                    <div className="ps-row">
                      <span className="k">{t("transform.row1SummaryIntervalKey")}</span>
                      <span className="v">~14 wks</span>
                    </div>
                    <div className="ps-row">
                      <span className="k">{t("transform.row1SummaryAttractorKey")}</span>
                      <span className="v it">{t("transform.row1SummaryAttractorVal")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 02 — Dream Logic */}
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("transform.row2Tag")}
                  </span>
                </div>
                <h3>
                  {t("transform.row2TitlePre")} <span className="it">{t("transform.row2TitleIt")}</span>{t("transform.row2TitlePost")}
                </h3>
                <p>
                  {t("transform.row2Body")}
                </p>
                <a href="/examples/dream-interpretation" className="row-link">
                  {t("transform.row2Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("transform.row2FigLabel")}</span>{" "}
                    <em>{t("transform.row2FigSubtitle")}</em>
                  </span>
                  <span>Fig. 04</span>
                </div>
                <div className="vb">
                  <div className="dream-text">
                    <p>
                      &ldquo;{t("transform.row2Dream1Pre")}{" "}
                      <span className="ann">
                        <sup>01</sup>{t("transform.row2Ann1")}
                      </span>
                      {t("transform.row2Dream1Mid")}{" "}
                      <span className="ann">
                        <sup>02</sup>{t("transform.row2Ann2")}
                      </span>
                      .&rdquo;
                    </p>
                    <p>
                      &ldquo;{t("transform.row2Dream2Pre")}{" "}
                      <span className="ann">
                        <sup>03</sup>{t("transform.row2Ann3")}
                      </span>{" "}
                      {t("transform.row2Dream2Mid")}{" "}
                      <span className="ann">
                        <sup>04</sup>{t("transform.row2Ann4")}
                      </span>
                      .&rdquo;
                    </p>
                    <p>
                      &ldquo;{t("transform.row2Dream3Pre")}{" "}
                      <span className="ann">
                        <sup>05</sup>{t("transform.row2Ann5")}
                      </span>
                      .&rdquo;
                    </p>
                  </div>
                  <div className="dream-key">
                    <div className="dk-item">
                      <span className="dk-num">01</span>
                      <span className="dk-label">{t("transform.row2Key1")}</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">02</span>
                      <span className="dk-label">{t("transform.row2Key2")}</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">03</span>
                      <span className="dk-label">{t("transform.row2Key3")}</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">04</span>
                      <span className="dk-label">{t("transform.row2Key4")}</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">05</span>
                      <span className="dk-label">{t("transform.row2Key5")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 03 — Professional Blocks */}
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("transform.row3Tag")}
                  </span>
                </div>
                <h3>
                  {t("transform.row3TitlePre")} <span className="it">{t("transform.row3TitleIt")}</span> {t("transform.row3TitlePost")}
                </h3>
                <p>
                  {t("transform.row3Body")}
                </p>
                <a href="/papers/professional-blocks" className="row-link">
                  {t("transform.row3Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("transform.row3FigLabel")}</span> <em>{t("transform.row3FigSubtitle")}</em>
                  </span>
                  <span>Fig. 05</span>
                </div>
                <div className="vb script-revision">
                  <div className="sr-line">
                    <span className="sr-prefix">{t("transform.row3Line1Prefix")}</span>
                    <span className="sr-old">{t("transform.row3Line1Old")}</span>
                    <span className="sr-new">{t("transform.row3Line1New")}</span>
                  </div>
                  <div className="sr-line">
                    <span className="sr-prefix">{t("transform.row3Line2Prefix")}</span>
                    <span className="sr-old">{t("transform.row3Line2Old")}</span>
                    <span className="sr-new">{t("transform.row3Line2New")}</span>
                  </div>
                  <div className="sr-line">
                    <span className="sr-prefix">{t("transform.row3Line3Prefix")}</span>
                    <span className="sr-old">
                      {t("transform.row3Line3Old")}
                    </span>
                    <span className="sr-new">
                      {t("transform.row3Line3New")}
                    </span>
                  </div>
                  <div className="sr-meta">
                    <span>
                      {t("transform.row3MetaOriginalPre")} <em>{t("transform.row3MetaOriginalIt")}</em>
                    </span>
                    <span>
                      {t("transform.row3MetaRevisedPre")} <em>{t("transform.row3MetaRevisedIt")}</em>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="split-section" id="outcomes">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow" style={{ fontSize: "16px" }}>
              {t("outcomes.eyebrow")}
            </div>
            <h2>
              {t("outcomes.titleLine1Pre")} <span className="it">{t("outcomes.titleLine1It")}</span>.
              <br />
              {t("outcomes.titleLine2")}
            </h2>
            <p className="lede">
              {t("outcomes.lede")}
            </p>
          </div>

          <div className="split-stack">
            {/* Row 01 — Shortcut */}
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("outcomes.row1Tag")}
                  </span>
                </div>
                <h3>
                  {t("outcomes.row1TitlePre")} <span className="it">{t("outcomes.row1TitleIt")}</span> {t("outcomes.row1TitlePost")}
                </h3>
                <p>
                  {t("outcomes.row1Body")}
                </p>
                <a href="/methodology" className="row-link">
                  {t("outcomes.row1Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Fig. 01</span> <em>{t("outcomes.row1FigSubtitle")}</em>
                  </span>
                  <span>n = 2,418</span>
                </div>
                <div className="vb insight-timeline">
                  <div className="tl-row">
                    <div className="tl-head">
                      <span className="k">{t("outcomes.row1TraditionalLabel")}</span>
                      <span className="v">8–12 years</span>
                    </div>
                    <div className="tl-bar">
                      <div className="tl-fill long"></div>
                      <div className="endcap"></div>
                    </div>
                    <div className="tl-axis">
                      <span>{t("outcomes.row1AxisYr1")}</span>
                      <span>{t("outcomes.row1AxisYr3")}</span>
                      <span>{t("outcomes.row1AxisYr6")}</span>
                      <span>{t("outcomes.row1AxisYr9")}</span>
                      <span>{t("outcomes.row1AxisYr12")}</span>
                    </div>
                  </div>
                  <div className="tl-row">
                    <div className="tl-head">
                      <span className="k">{t("outcomes.row1TwentyThirdLabelPre")} TwentyThird</span>
                      <span className="v">6–12 weeks</span>
                    </div>
                    <div className="tl-bar">
                      <div className="tl-fill short"></div>
                      <div
                        className="endcap"
                        style={{ right: "auto", left: "11%" }}
                      ></div>
                    </div>
                    <div className="tl-axis">
                      <span>{t("outcomes.row1AxisWk1")}</span>
                      <span>{t("outcomes.row1AxisWk4")}</span>
                      <span>{t("outcomes.row1AxisWk8")}</span>
                      <span>{t("outcomes.row1AxisWk12")}</span>
                    </div>
                  </div>
                  <div className="tl-summary">
                    <span className="big">
                      37<span style={{ fontSize: "0.55em" }}>×</span>
                    </span>
                    <span className="big-label">
                      {t("outcomes.row1SummaryFaster")}
                      <br />
                      {t("outcomes.row1SummaryDesc")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 02 — Map */}
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("outcomes.row2Tag")}
                  </span>
                </div>
                <h3>
                  {t("outcomes.row2TitlePre")} <span className="it">{t("outcomes.row2TitleIt")}</span>{" "}
                  {t("outcomes.row2TitlePost")}
                </h3>
                <p>
                  {t("outcomes.row2Body")}
                </p>
                <a href="/reports/sample" className="row-link">
                  {t("outcomes.row2Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("outcomes.row2FigLabel")}</span> <em>{t("outcomes.row2FigSubtitle")}</em>
                  </span>
                  <span>04 / 26</span>
                </div>
                <div className="vb report-mock">
                  <div className="rep-head">
                    <span>{t("outcomes.row2RepCase")}</span>
                    <span>{t("outcomes.row2RepPrepared")}</span>
                  </div>
                  <div className="rep-section">
                    <div className="rep-row">
                      <span className="k">{t("outcomes.row2MetricEgo")}</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "72%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.72</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">{t("outcomes.row2MetricObject")}</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "48%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.48</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">{t("outcomes.row2MetricDefense")}</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "81%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.81</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">{t("outcomes.row2MetricDrive")}</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "54%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.54</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">{t("outcomes.row2MetricSymbolic")}</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "67%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.67</span>
                    </div>
                  </div>
                  <div className="rep-foot">
                    <div className="rf-label">{t("outcomes.row2FootLabel")}</div>
                    <div className="rf-val">
                      {t("outcomes.row2FootVal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 03 — Integration */}
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    {t("outcomes.row3Tag")}
                  </span>
                </div>
                <h3>
                  {t("outcomes.row3TitlePre")} <span className="it">{t("outcomes.row3TitleIt")}</span> {t("outcomes.row3TitlePost")}
                </h3>
                <p>
                  {t("outcomes.row3Body")}
                </p>
                <a href="/plan" className="row-link">
                  {t("outcomes.row3Link")} <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>{t("outcomes.row3FigLabel")}</span> <em>{t("outcomes.row3FigSubtitle")}</em>
                  </span>
                  <span>{t("outcomes.row3FigPlan")}</span>
                </div>
                <div className="vb prompt-card">
                  <div className="pc-head">
                    <span className="pc-day">{t("outcomes.row3Day")}</span>
                    <span className="pc-date">07 · 24 · 26</span>
                  </div>
                  <div className="pc-prompt">
                    <span className="pc-eyebrow">
                      {t("outcomes.row3PromptEyebrow")}
                    </span>
                    <p className="pc-q">
                      &ldquo;{t("outcomes.row3PromptPre")} <em>{t("outcomes.row3PromptIt")}</em> {t("outcomes.row3PromptPost")}&rdquo;
                    </p>
                  </div>
                  <div className="pc-stream">
                    <div className="pc-stream-row">
                      <span className="dot done"></span>
                      <span className="time">06 : 30</span>
                      <span className="label">{t("outcomes.row3Stream1Label")}</span>
                      <span className="dur">{t("outcomes.row3Stream1Dur")}</span>
                    </div>
                    <div className="pc-stream-row">
                      <span className="dot done"></span>
                      <span className="time">12 : 45</span>
                      <span className="label">{t("outcomes.row3Stream2Label")}</span>
                      <span className="dur">{t("outcomes.row3Stream2Dur")}</span>
                    </div>
                    <div className="pc-stream-row">
                      <span className="dot"></span>
                      <span className="time">20 : 00</span>
                      <span className="label">{t("outcomes.row3Stream3Label")}</span>
                      <span className="dur">{t("outcomes.row3Stream3Dur")}</span>
                    </div>
                  </div>
                  <div className="pc-streak">
                    <span className="streak-label">{t("outcomes.row3StreakLabel")}</span>
                    <span className="streak-val">{t("outcomes.row3StreakVal", { n: 23 })}</span>
                    <span className="streak-mini">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <i key={i}></i>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="crescendo">
          <div className="blob b1"></div>
          <div className="blob b2"></div>
        </div>
        <div className="final-inner reveal">
          <div
            className="eyebrow"
            style={{ marginBottom: "32px", fontSize: "16px" }}
          >
            {t("final.eyebrow")}
          </div>
          <h2>
            {t("final.titlePre")}
            <span className="it">{t("final.titleIt")}</span>
          </h2>
          <div className="cta-row">
            <a href="/auth/sign-up" className="cta">
              {t("final.ctaPrimary")} <span className="arrow">→</span>
            </a>
            <a href="/science" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("final.ctaGhostOr")}
              </span>{" "}
              {t("final.ctaGhostText")}
            </a>
          </div>
        </div>
      </section>

      <LandingInteractions />
    </main>
  );
}

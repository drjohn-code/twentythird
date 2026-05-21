import LandingInteractions from "./landing-interactions";

export default function LandingPage() {
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
            PSYCHODYNAMIC INTELLIGENCE{" "}
          </div>
          <h1>
            Advanced
            <br />
            Psychodynamic <span className="it">AI</span>,
            <span className="break">
              for <span className="it">Self‑Discovery</span>
            </span>
          </h1>
          <div className="cta-row">
            <a href="/auth/sign-up" className="cta">
              Start your discovery
              <span className="arrow">→</span>
            </a>
            <a href="/science" className="cta-ghost">
              <span
                style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}
              >
                or
              </span>{" "}
              read the science
            </a>
          </div>
        </div>
        <div className="scroll-hint">
          <span>scroll</span>
          <span className="line"></span>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="philosophy" id="philosophy">
        <div className="philo-copy reveal">
          <div className="eyebrow" style={{ fontSize: "1px" }}>
            CORE PHILOSOPHY
          </div>
          <h2>
            We do root‑cause analysis. By fusing the foundational insights of
            Sigmund Freud with Jacques Lacan&apos;s breakthroughs in
            linguistics, desire, and identity
          </h2>
          <p className="sub">
            Most tools work on the surface. We work where it was written — in
            the architecture of language, the slips of speech, the patterns
            you have not yet named.
          </p>
          <div className="philo-meta">
            <div>
              <span className="label">Lineage</span>
              <span className="val">Freud · Lacan</span>
            </div>
            <div>
              <span className="label">Method</span>
              <span className="val">Structural</span>
            </div>
            <div>
              <span className="label">Focus</span>
              <span className="val">The unconscious</span>
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
              THE WORK
            </div>
            <h2>
              Deconstructing
              <br />
              your subconscious
            </h2>
            <div className="brain-states">
              <div className="brain-state active" data-state="0">
                <div className="tag">
                  <span className="num"></span> Pattern Mapping
                </div>
                <h3>
                  Subconscious <span className="it">loops</span> &amp;
                  recurrence.
                </h3>
                <p>
                  We track the recurring cycles in your choices, relationship
                  anxieties, and emotional triggers. By identifying these
                  loops, we show you exactly where your conscious intentions
                  are being hijacked by unconscious programming.
                </p>
              </div>
              <div className="brain-state" data-state="1">
                <div className="tag">
                  <span className="num"></span> Profiling
                </div>
                <h3>
                  Deep‑core <span className="it">psychodynamic</span>{" "}
                  profiling.
                </h3>
                <p>
                  Move past superficial personality quizzes. This is a
                  structural scan of your psychological dynamics — mapping
                  how your past experiences shape your current identity, ego,
                  and defense mechanisms.
                </p>
              </div>
              <div className="brain-state" data-state="2">
                <div className="tag">
                  <span className="num"></span> Language
                </div>
                <h3>
                  Linguistic <span className="it">unconscious</span>{" "}
                  exploration.
                </h3>
                <p>
                  Rooted in Lacanian theory, our AI analyzes your word
                  associations, pauses, and speech patterns. We help you read
                  between the lines of your own thoughts to access the hidden
                  anxieties and desires you haven&apos;t yet been able to
                  voice.
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
              TRANSFORM
            </div>
            <h2>
              Break the cycle,
              <br />
              Then rewrite it.
            </h2>
            <p className="lede">
              Three movements in the work. Three places where insight becomes
              change.
            </p>
          </div>

          <div className="split-stack">
            {/* Row 01 — Relational Dynamics */}
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Relational
                  </span>
                </div>
                <h3>
                  Heal your <span className="it">relational</span> dynamics.
                </h3>
                <p>
                  The same attractor draws you toward the same kind of
                  person, the same fight, the same withdrawal. We surface the
                  pattern across years, name it, and watch it lose its
                  gravity.
                </p>
                <a href="/case-studies/relational-attractor" className="row-link">
                  Read the case study <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Subject 1149-A</span>{" "}
                    <em>longitudinal pattern</em>
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
                      <span className="out">withdrew</span>
                    </li>
                    <li>
                      <span className="year">2021</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">13 wks</span>
                      </span>
                      <span className="out">withdrew</span>
                    </li>
                    <li>
                      <span className="year">2023</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">15 wks</span>
                      </span>
                      <span className="out">withdrew</span>
                    </li>
                    <li>
                      <span className="year">2025</span>
                      <span className="dur">
                        <span className="bar"></span>
                        <span className="bar-label">14 wks</span>
                      </span>
                      <span className="out">withdrew</span>
                    </li>
                  </ul>
                  <div className="pattern-summary">
                    <div className="ps-row">
                      <span className="k">recurrence</span>
                      <span className="v">4 / 4</span>
                    </div>
                    <div className="ps-row">
                      <span className="k">interval</span>
                      <span className="v">~14 wks</span>
                    </div>
                    <div className="ps-row">
                      <span className="k">attractor</span>
                      <span className="v it">intimacy threshold</span>
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
                    Dreamwork
                  </span>
                </div>
                <h3>
                  Decode <span className="it">dream logic</span>, align goals.
                </h3>
                <p>
                  Your dreams are rehearsals of meaning. We follow their
                  grammar — the displacements, the condensations, the slips —
                  back to the waking decision they were trying to make for
                  you.
                </p>
                <a href="/examples/dream-interpretation" className="row-link">
                  See an annotated example <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Session 06</span>{" "}
                    <em>dream entry, annotated</em>
                  </span>
                  <span>Fig. 04</span>
                </div>
                <div className="vb">
                  <div className="dream-text">
                    <p>
                      &ldquo;I am back in my parents&apos; house{" "}
                      <span className="ann">
                        <sup>01</sup>primal scene
                      </span>
                      , but the rooms keep opening into other rooms{" "}
                      <span className="ann">
                        <sup>02</sup>ego boundary
                      </span>
                      .&rdquo;
                    </p>
                    <p>
                      &ldquo;A man with my father&apos;s voice{" "}
                      <span className="ann">
                        <sup>03</sup>father‑imago
                      </span>{" "}
                      hands me a key. The key turns into water{" "}
                      <span className="ann">
                        <sup>04</sup>displacement
                      </span>
                      .&rdquo;
                    </p>
                    <p>
                      &ldquo;I wake before I can open the door{" "}
                      <span className="ann">
                        <sup>05</sup>desire / lack
                      </span>
                      .&rdquo;
                    </p>
                  </div>
                  <div className="dream-key">
                    <div className="dk-item">
                      <span className="dk-num">01</span>
                      <span className="dk-label">primal scene</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">02</span>
                      <span className="dk-label">ego boundary</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">03</span>
                      <span className="dk-label">father-imago</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">04</span>
                      <span className="dk-label">displacement</span>
                    </div>
                    <div className="dk-item">
                      <span className="dk-num">05</span>
                      <span className="dk-label">desire / lack</span>
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
                    Vocation
                  </span>
                </div>
                <h3>
                  Dissolve <span className="it">professional</span> blocks.
                </h3>
                <p>
                  The ceiling you keep hitting is rarely about skill. It is
                  a script — written early, rehearsed quietly — that we will
                  help you read aloud and rewrite, sentence by sentence.
                </p>
                <a href="/papers/professional-blocks" className="row-link">
                  The method paper <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Script revision</span> <em>working draft</em>
                  </span>
                  <span>Fig. 05</span>
                </div>
                <div className="vb script-revision">
                  <div className="sr-line">
                    <span className="sr-prefix">01 · I am</span>
                    <span className="sr-old">not yet ready.</span>
                    <span className="sr-new">already allowed.</span>
                  </div>
                  <div className="sr-line">
                    <span className="sr-prefix">02 · to</span>
                    <span className="sr-old">wait my turn.</span>
                    <span className="sr-new">name what I want.</span>
                  </div>
                  <div className="sr-line">
                    <span className="sr-prefix">03 · because</span>
                    <span className="sr-old">
                      someone might be disappointed.
                    </span>
                    <span className="sr-new">
                      disappointment is also language.
                    </span>
                  </div>
                  <div className="sr-meta">
                    <span>
                      original <em>age 11</em>
                    </span>
                    <span>
                      revised <em>session 06</em>
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
              OUTCOMES
            </div>
            <h2>
              Tangible <span className="it">insights</span>.
              <br />
              Quietly measurable.
            </h2>
            <p className="lede">
              Data-driven self-awareness, delivered in the language of a
              clinician — not a quiz.
            </p>
          </div>

          <div className="split-stack">
            {/* Row 01 — Shortcut */}
            <div className="split-row reverse">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Acceleration
                  </span>
                </div>
                <h3>
                  The ultimate <span className="it">shortcut</span> for
                  real-world therapy.
                </h3>
                <p>
                  What used to take a relationship of many years can now
                  begin with weeks of preparation. Walk into your
                  therapist&apos;s office knowing what you&apos;re there to
                  say.
                </p>
                <a href="/methodology" className="row-link">
                  See the methodology <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Fig. 01</span> <em>time to first insight</em>
                  </span>
                  <span>n = 2,418</span>
                </div>
                <div className="vb insight-timeline">
                  <div className="tl-row">
                    <div className="tl-head">
                      <span className="k">Traditional path</span>
                      <span className="v">8–12 years</span>
                    </div>
                    <div className="tl-bar">
                      <div className="tl-fill long"></div>
                      <div className="endcap"></div>
                    </div>
                    <div className="tl-axis">
                      <span>yr 1</span>
                      <span>yr 3</span>
                      <span>yr 6</span>
                      <span>yr 9</span>
                      <span>yr 12</span>
                    </div>
                  </div>
                  <div className="tl-row">
                    <div className="tl-head">
                      <span className="k">With TwentyThird</span>
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
                      <span>wk 1</span>
                      <span>wk 4</span>
                      <span>wk 8</span>
                      <span>wk 12</span>
                    </div>
                  </div>
                  <div className="tl-summary">
                    <span className="big">
                      37<span style={{ fontSize: "0.55em" }}>×</span>
                    </span>
                    <span className="big-label">
                      faster
                      <br />
                      time to first insight
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
                    Report
                  </span>
                </div>
                <h3>
                  Therapist-ready <span className="it">psychological</span>{" "}
                  map.
                </h3>
                <p>
                  A structural diagram of you — exportable, shareable, deeply
                  intelligible to a trained clinician. Not a personality
                  quiz; a working brief.
                </p>
                <a href="/reports/sample" className="row-link">
                  View a sample report <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Subject 1149-A</span> <em>structural profile</em>
                  </span>
                  <span>04 / 26</span>
                </div>
                <div className="vb report-mock">
                  <div className="rep-head">
                    <span>case 1149-A</span>
                    <span>prepared 04 · 26</span>
                  </div>
                  <div className="rep-section">
                    <div className="rep-row">
                      <span className="k">Ego structure</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "72%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.72</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">Object relations</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "48%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.48</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">Defense complexity</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "81%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.81</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">Drive organisation</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "54%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.54</span>
                    </div>
                    <div className="rep-row">
                      <span className="k">Symbolic register</span>
                      <span className="meter">
                        <i style={{ ["--w" as string]: "67%" } as React.CSSProperties}></i>
                      </span>
                      <span className="pct">.67</span>
                    </div>
                  </div>
                  <div className="rep-foot">
                    <div className="rf-label">Dominant structure</div>
                    <div className="rf-val">
                      obsessional · with hysterical traces
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
                    Integration
                  </span>
                </div>
                <h3>
                  Personalised <span className="it">integration</span> &amp;
                  shadow work plans.
                </h3>
                <p>
                  Daily prompts and rituals that take the insight off the
                  page and into the body. Small, deliberate. Built around
                  your structure, not a generic curriculum.
                </p>
                <a href="/plan" className="row-link">
                  How the plan adapts <span className="ar">→</span>
                </a>
              </div>
              <div className="split-visual glass">
                <div className="vh">
                  <span className="lhs">
                    <span>Day 23</span> <em>daily prompt</em>
                  </span>
                  <span>plan 04</span>
                </div>
                <div className="vb prompt-card">
                  <div className="pc-head">
                    <span className="pc-day">Wednesday</span>
                    <span className="pc-date">07 · 24 · 26</span>
                  </div>
                  <div className="pc-prompt">
                    <span className="pc-eyebrow">
                      today&apos;s prompt · shadow work
                    </span>
                    <p className="pc-q">
                      &ldquo;Where today did you choose <em>not</em> to be
                      seen? And what were you keeping safe by hiding?&rdquo;
                    </p>
                  </div>
                  <div className="pc-stream">
                    <div className="pc-stream-row">
                      <span className="dot done"></span>
                      <span className="time">06 : 30</span>
                      <span className="label">breath-work</span>
                      <span className="dur">6 min</span>
                    </div>
                    <div className="pc-stream-row">
                      <span className="dot done"></span>
                      <span className="time">12 : 45</span>
                      <span className="label">journal</span>
                      <span className="dur">12 min</span>
                    </div>
                    <div className="pc-stream-row">
                      <span className="dot"></span>
                      <span className="time">20 : 00</span>
                      <span className="label">shadow prompt</span>
                      <span className="dur">8 min</span>
                    </div>
                  </div>
                  <div className="pc-streak">
                    <span className="streak-label">streak</span>
                    <span className="streak-val">23 days</span>
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
            BEGIN
          </div>
          <h2>
            Your unconscious is speaking.
            <span className="it">It&apos;s time to listen.</span>
          </h2>
          <div className="cta-row">
            <a href="/auth/sign-up" className="cta">
              Start your discovery <span className="arrow">→</span>
            </a>
            <a href="/science" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read the science
            </a>
          </div>
        </div>
      </section>

      <LandingInteractions />
    </main>
  );
}

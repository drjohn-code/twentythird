import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import ReportMock from "../../components/figures/ReportMock";
import PromptCard from "../../components/figures/PromptCard";
import ContactForm from "../../components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — TwentyThird",
  description:
    "Write to us. Substantive inquiries answered within seventy‑two hours.",
};

export default function ContactPage() {
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              CONTACT
            </div>
            <h1>
              Write to us. <span className="it">We read everything</span>.
            </h1>
            <p className="lede">
              Most messages are answered within seventy‑two hours. Clinical and
              partnership inquiries take precedence.
            </p>
          </div>
        </div>
      </Reveal>

      {/* REACH */}
      <section className="page-section split-section">
        <div className="container">
          <div className="split-stack">
            <div className="split-row">
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Direct
                  </span>
                </div>
                <h3>
                  Reach us <span className="it">directly</span>.
                </h3>
                <p>
                  Three channels. Each is read by a clinician on the team. No
                  intake forms in front of a human.
                </p>
                <div className="contact-rows">
                  <div className="contact-row">
                    <span className="row-k">Address</span>
                    <span className="row-v">Rosendal, Uppsala, Sweden</span>
                  </div>
                  <div className="contact-row">
                    <span className="row-k">Email</span>
                    <a
                      href="mailto:info@wellowork.net"
                      className="row-v mono"
                    >
                      info@wellowork.net
                    </a>
                  </div>
                  <div className="contact-row">
                    <span className="row-k">Phone</span>
                    <a href="tel:+46760281272" className="row-v mono">
                      +46 760 28 12 72
                    </a>
                  </div>
                </div>
              </div>
              <FigureCard
                label="inbox"
                subtitle="what arrives"
                fig="Fig. 01"
              >
                <PromptCard
                  heading="This week"
                  date="wk 20 · 26"
                  eyebrow="recent inquiries · last 7 days"
                  quote={
                    <>
                      &ldquo;Three of the four <em>arrived clinical</em> —
                      median read time, eleven minutes.&rdquo;
                    </>
                  }
                  rows={[
                    { type: "clinical inquiry", time: "mon", duration: "12m" },
                    { type: "press", time: "tue", duration: "4m" },
                    { type: "partnership", time: "thu", duration: "18m" },
                    { type: "research", time: "fri", duration: "9m", unread: true },
                  ]}
                  footerLabel="median"
                  footerValue="11 min read"
                />
              </FigureCard>
            </div>

            {/* FORM */}
            <div className="split-row reverse">
              <FigureCard
                label="form"
                subtitle="substantive inquiries only"
                fig="Fig. 02"
              >
                <ContactForm />
              </FigureCard>
              <div className="split-copy">
                <div className="row-meta">
                  <span className="num"></span>
                  <span className="tag" style={{ fontSize: "16px" }}>
                    Cadence
                  </span>
                </div>
                <h3>
                  When you will <span className="it">hear back</span>.
                </h3>
                <p>
                  Median response over the last ninety days. Clinical inquiries
                  are routed first; partnership replies are slower by design,
                  because they need a meeting before a sentence.
                </p>
                <ReportMock
                  caseLabel="response · last 90 days"
                  prepared="median"
                  rows={[
                    { k: "General", pct: "~48 hrs", width: 56 },
                    { k: "Clinical", pct: "~72 hrs", width: 72 },
                    { k: "Press", pct: "~24 hrs", width: 30 },
                    { k: "Partnership", pct: "~5 days", width: 92 },
                  ]}
                  footerLabel="window"
                  footerValue="weekdays, Uppsala"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY DISCLAIMER */}
      <div className="disclaimer-band">
        <p>
          For urgent mental‑health concerns, please contact local emergency
          services or a licensed clinician. TwentyThird is not a crisis
          service.
        </p>
      </div>
    </main>
  );
}

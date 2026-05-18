import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
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

      {/* FORM + CONTACT DETAILS */}
      <section className="page-section">
        <div className="container">
          <div className="contact-split">
            <FigureCard
              label="form"
              subtitle="substantive inquiries only"
              fig="Fig. 02"
            >
              <ContactForm />
            </FigureCard>
            <div className="contact-details">
              <div className="contact-detail">
                <span className="contact-detail-label">ADDRESS</span>
                <span className="contact-detail-value">Rosendal, Uppsala, Sweden</span>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-label">EMAIL</span>
                <a href="mailto:info@day-23.com" className="contact-detail-value contact-detail-link">
                  info@day-23.com
                </a>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-label">PHONE</span>
                <a href="tel:+46760281272" className="contact-detail-value contact-detail-link">
                  +46 760 28 12 72
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <Reveal as="section" className="page-final">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            BEGIN
          </div>
          <h2>
            Or just <span className="it">start</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              Start your discovery <span className="arrow">→</span>
            </Link>
            <Link href="/about" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                or
              </span>{" "}
              read the origin
            </Link>
          </div>
        </div>
      </Reveal>

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

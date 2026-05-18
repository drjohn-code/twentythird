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

      {/* FORM */}
      <section className="page-section">
        <div className="container">
          <div className="contact-form-wrap">
            <FigureCard
              label="form"
              subtitle="substantive inquiries only"
              fig="Fig. 02"
            >
              <ContactForm />
            </FigureCard>
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

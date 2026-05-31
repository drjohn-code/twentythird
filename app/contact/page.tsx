import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Reveal from "../../components/layout/Reveal";
import FigureCard from "../../components/figures/FigureCard";
import ContactForm from "../../components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — TwentyThird",
  description:
    "Write to us. Substantive inquiries answered within seventy‑two hours.",
};

export default async function ContactPage() {
  const t = await getTranslations("marketing.contact");
  return (
    <main className="page-shell">
      {/* HERO */}
      <Reveal as="section" className="page-hero no-figure">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ marginBottom: "28px" }}>
              {t("page.heroEyebrow")}
            </div>
            <h1>
              {t("page.heroHeadlineLead")}{" "}
              <span className="it">{t("page.heroHeadlineItalic")}</span>.
            </h1>
            <p className="lede">{t("page.heroLede")}</p>
          </div>
        </div>
      </Reveal>

      {/* FORM + CONTACT DETAILS */}
      <section className="page-section contact-form-section">
        <div className="container">
          <div className="contact-split">
            <FigureCard
              label={t("page.formCardLabel")}
              subtitle={t("page.formCardSubtitle")}
              fig="Fig. 02"
            >
              <ContactForm />
            </FigureCard>
            <div className="contact-details">
              <div className="contact-detail">
                <span className="contact-detail-label">{t("page.addressLabel")}</span>
                <span className="contact-detail-value">{t("page.addressValue")}</span>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-label">{t("page.emailLabel")}</span>
                <a href="mailto:info@day-23.com" className="contact-detail-value contact-detail-link">
                  info@day-23.com
                </a>
              </div>
              <div className="contact-detail">
                <span className="contact-detail-label">{t("page.phoneLabel")}</span>
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
            {t("page.finalEyebrow")}
          </div>
          <h2>
            {t("page.finalHeadlineLead")}{" "}
            <span className="it">{t("page.finalHeadlineItalic")}</span>.
          </h2>
          <div className="cta-row">
            <Link href="/auth/sign-up" className="cta">
              {t("page.finalCta")} <span className="arrow">→</span>
            </Link>
            <Link href="/about" className="cta-ghost">
              <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>
                {t("page.finalGhostOr")}
              </span>{" "}
              {t("page.finalGhostText")}
            </Link>
          </div>
        </div>
      </Reveal>

      {/* SAFETY DISCLAIMER */}
      <div className="disclaimer-band">
        <p>{t("page.disclaimer")}</p>
      </div>
    </main>
  );
}

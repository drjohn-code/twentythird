import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.terms");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("marketing.legal.terms");
  return (
    <article className="legal-article" id="terms">
      <section className="legal-section">
        <div className="legal-eyebrow">{t("eyebrow")}</div>
        <h2>
          {t("headingLead")} <em>{t("headingItalic")}</em>
        </h2>
        <p className="legal-lede">
          {t("lede")}
        </p>

        <div className="legal-sub">
          <h3>
            {t("service.headingLead")} <em>{t("service.headingItalic")}</em>
          </h3>
          <p>
            {t("service.p1")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("account.headingLead")} <em>{t("account.headingItalic")}</em>
          </h3>
          <p>
            {t("account.p1")}
          </p>
          <p>
            {t("account.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("acceptableUse.headingLead")}{" "}
            <em>{t("acceptableUse.headingItalic")}</em>
          </h3>
          <p>
            {t("acceptableUse.p1")}
          </p>
          <p>
            {t("acceptableUse.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("liability.headingLead")} <em>{t("liability.headingItalic")}</em>
          </h3>
          <p>
            {t("liability.p1")}
          </p>
          <p>
            {t("liability.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("disputes.headingLead")} <em>{t("disputes.headingItalic")}</em>
          </h3>
          <p>
            {t("disputes.p1")}
          </p>
          <p>
            {t("disputes.p2Lead")}{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="legal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            {t("disputes.p2Tail")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>{t("changes.headingItalic")}</em>
          </h3>
          <p>
            {t("changes.p1")}
          </p>
          <p className="legal-effective">
            {t("changes.effectivePrefix")} {LEGAL_EFFECTIVE_DATE}
          </p>
        </div>
      </section>
    </article>
  );
}

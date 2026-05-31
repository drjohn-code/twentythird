import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FigureCard from "../../../components/figures/FigureCard";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("marketing.legal.privacy");
  return (
    <article className="legal-article" id="privacy">
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
            {t("controls.headingLead")} <em>{t("controls.headingItalic")}</em>{" "}
            {t("controls.headingTail")}
          </h3>
          <p>
            {t("controls.p1")}
          </p>
          <p>
            {t("controls.p2")}
          </p>
        </div>

        <FigureCard
          label={t("figure.label")}
          subtitle=""
          fig="Fig. 01"
          className="legal-df-card"
        >
          <div className="df-rows">
            <div className="df-row">
              <div className="df-box">
                <span className="df-role">{t("figure.controller")}</span>
                <span className="df-entity">WelloWork AB</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
                <span className="df-connector-label">
                  {t("figure.directRelationship")}
                </span>
              </div>
              <div className="df-box">
                <span className="df-role">{t("figure.websiteVisitor")}</span>
                <span className="df-entity">{t("figure.you")}</span>
              </div>
            </div>
            <div className="df-row">
              <div className="df-box">
                <span className="df-role">{t("figure.controller")}</span>
                <span className="df-entity">{t("figure.customerOrg")}</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
                <span className="df-connector-label">{t("figure.viaDpa")}</span>
              </div>
              <div className="df-box">
                <span className="df-role">{t("figure.processor")}</span>
                <span className="df-entity">WelloWork AB</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
              </div>
              <div className="df-box">
                <span className="df-role">{t("figure.platformUser")}</span>
                <span className="df-entity">{t("figure.you")}</span>
              </div>
            </div>
          </div>
        </FigureCard>

        <div className="legal-sub">
          <h3>
            {t("collect.headingLead")} <em>{t("collect.headingItalic")}</em>
          </h3>
          <p>
            <strong>{t("collect.contactStrong")}</strong>{" "}
            {t("collect.contactBody")}
          </p>
          <p>
            <strong>{t("collect.sessionStrong")}</strong>{" "}
            {t("collect.sessionBody")}
          </p>
          <p>
            <strong>{t("collect.technicalStrong")}</strong>{" "}
            {t("collect.technicalBody")}
          </p>
          <p>
            {t("collect.p4")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("use.headingLead")} <em>{t("use.headingItalic")}</em>{" "}
            {t("use.headingTail")}
          </h3>
          <p>
            {t("use.p1")}
          </p>
          <p>
            {t("use.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("sees.headingLead")} <em>{t("sees.headingItalic")}</em>{" "}
            {t("sees.headingTail")}
          </h3>
          <p>
            <strong>{t("sees.withinStrong")}</strong> {t("sees.withinBody")}
          </p>
          <p>
            <strong>{t("sees.infraStrong")}</strong> {t("sees.infraBody")}
          </p>
          <p>
            <strong>{t("sees.legalStrong")}</strong> {t("sees.legalBody")}
          </p>
          <p>
            {t("sees.p4")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>{t("retention.headingItalic")}</em>
          </h3>
          <p>
            {t("retention.p1")}
          </p>
          <p>
            {t("retention.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("rights.headingLead")} <em>{t("rights.headingItalic")}</em>
          </h3>
          <p>
            {t("rights.p1")}
          </p>
          <p>
            {t("rights.exerciseLead")}{" "}
            <a href="mailto:privacy@day-23.com" className="legal-link">
              privacy@day-23.com
            </a>
            {t("rights.exerciseTail")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>{t("children.headingItalic")}</em>
          </h3>
          <p>
            {t("children.p1")}
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
            {t("changes.effectivePrefix")} {LEGAL_EFFECTIVE_DATE}{" "}
            {t("changes.effectiveSuffix")}
          </p>
        </div>
      </section>
    </article>
  );
}

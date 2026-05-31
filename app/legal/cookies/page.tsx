import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.legal.cookies");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CookiesPage() {
  const t = await getTranslations("marketing.legal.cookies");
  return (
    <article className="legal-article" id="cookies">
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
            {t("whatIs.headingLead")} <em>{t("whatIs.headingItalic")}</em>
          </h3>
          <p>
            {t("whatIs.p1")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("weSet.headingLead")} <em>{t("weSet.headingItalic")}</em>
          </h3>
          <p>
            <strong>
              <code className="legal-code">sb-auth-token</code>
            </strong>{" "}
            {t("weSet.authBody")}
          </p>
          <p>
            <strong>
              <code className="legal-code">theme</code>
            </strong>{" "}
            {t("weSet.themeBody")}
          </p>
          <p>
            {t("weSet.p3")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            {t("choices.headingLead")} <em>{t("choices.headingItalic")}</em>
          </h3>
          <p>
            {t("choices.p1Lead")}{" "}
            <code className="legal-code">sb-auth-token</code>{" "}
            {t("choices.p1Mid")}{" "}
            <code className="legal-code">theme</code> {t("choices.p1Tail")}
          </p>
          <p>
            {t("choices.p2")}
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>{t("contact.headingItalic")}</em>
          </h3>
          <p>
            {t("contact.p1Lead")}{" "}
            <a href="mailto:privacy@day-23.com" className="legal-link">
              privacy@day-23.com
            </a>
          </p>
          <p className="legal-effective">
            {t("contact.effectivePrefix")} {LEGAL_EFFECTIVE_DATE}
          </p>
        </div>
      </section>
    </article>
  );
}

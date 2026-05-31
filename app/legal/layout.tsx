import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import LegalSidebar from "../../components/legal/LegalSidebar";

export default async function LegalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("marketing.legal.layout");
  return (
    <main className="page-shell">
      <section className="page-hero no-figure">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            {t("eyebrow")}
          </div>
          <h1>
            {t("headingLead")} <em className="it">{t("headingItalic")}</em>
          </h1>
          <p className="lede">
            {t("lede")}
          </p>
        </div>
      </section>

      <div className="legal-body">
        <div className="container">
          <div className="legal-grid">
            <LegalSidebar />
            <div className="legal-content">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

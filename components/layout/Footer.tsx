"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LogoMark from "../brand/LogoMark";

export default function Footer() {
  const t = useTranslations("marketing.footer");
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="wordmark">
              <LogoMark size={34} />
              <span>TwentyThird</span>
            </Link>
            <p>{t("tagline")}</p>
          </div>
          <div className="footer-col">
            <span className="label">{t("product")}</span>
            <Link href="/auth/sign-up">{t("discovery")}</Link>
            <Link href="/reports/sample">{t("sampleReport")}</Link>
            <Link href="/plan">{t("integrationPlan")}</Link>
          </div>
          <div className="footer-col">
            <span className="label">{t("company")}</span>
            <Link href="/about">{t("about")}</Link>
            <Link href="/contact">{t("contact")}</Link>
            <Link href="/about">{t("manifesto")}</Link>
          </div>
          <div className="footer-col">
            <span className="label">{t("resources")}</span>
            <Link href="/science">{t("science")}</Link>
            <Link href="/methodology">{t("methodology")}</Link>
            <Link href="/papers/professional-blocks">{t("methodPaper")}</Link>
            <Link href="/case-studies/relational-attractor">{t("caseStudy")}</Link>
            <Link href="/examples/dream-interpretation">{t("dreamExample")}</Link>
          </div>
          <div className="footer-col">
            <span className="label">{t("legal")}</span>
            <Link href="/legal/privacy">{t("privacy")}</Link>
            <Link href="/legal/terms">{t("terms")}</Link>
            <Link href="/legal/cookies">{t("cookies")}</Link>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 WelloWork AB · {t("rights")}</span>
        </div>
      </div>
    </footer>
  );
}

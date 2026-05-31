import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import Reveal from "@/components/layout/Reveal";

type ClinicalReportCTAProps = {
  /** Whether the user has an active subscription. */
  isSubscribed: boolean;
  /** Current reading depth in [0, 1]. */
  depth: number;
  /**
   * True when the subscriber has already used their included
   * report for the current calendar month. Computed by counting
   * `reports` rows with `kind = 'clinical'` and `created_at >=`
   * the first of the month. Always false for non-subscribers.
   */
  monthlyReportUsed: boolean;
};

/**
 * Bottom of /readings — the offer to generate a clinical report.
 *
 * Three states drive the button + caption:
 *   A · non-subscriber                  → glass CTA → /reports/confirm + caption
 *   B · subscriber, monthly unused      → solid CTA → POST /api/reports
 *   C · subscriber, monthly already used → glass CTA → /reports/confirm
 *
 * The price never appears here. It is only shown on /reports/confirm.
 */
export default async function ClinicalReportCTA({
  isSubscribed,
  depth,
  monthlyReportUsed,
}: ClinicalReportCTAProps) {
  const t = await getTranslations("readings");
  const canGenerateIncluded = isSubscribed && !monthlyReportUsed;
  const showSubscribersCaption = !isSubscribed;

  return (
    <Reveal as="section" className="clinical-report-cta">
      <a id="clinical-report" className="anchor-target" aria-hidden="true" />
      <div className="clinical-report-cta-inner">
        <Eyebrow>{t("report.eyebrow")}</Eyebrow>
        <h2 className="clinical-report-h">
          {t.rich("report.heading", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
        </h2>
        <p className="clinical-report-lede">{t("report.lede")}</p>
        {depth < 0.5 ? (
          <p className="clinical-report-note">{t("report.note")}</p>
        ) : null}
        <div className="clinical-report-actions">
          {canGenerateIncluded ? (
            <form method="POST" action="/api/reports">
              <button type="submit" className="cta cta-solid">
                <span>{t("report.generate")}</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </form>
          ) : (
            <CTA href="/reports/confirm">{t("report.request")}</CTA>
          )}
        </div>
        {showSubscribersCaption ? (
          <p className="clinical-report-foot">
            <span>{t("report.footPrefix")}</span>
            <Link
              href="/subscribe/confirm"
              className="clinical-report-foot-link"
            >
              {t("report.footLink")}
            </Link>
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}

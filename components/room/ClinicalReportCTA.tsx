import Link from "next/link";
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
export default function ClinicalReportCTA({
  isSubscribed,
  depth,
  monthlyReportUsed,
}: ClinicalReportCTAProps) {
  const canGenerateIncluded = isSubscribed && !monthlyReportUsed;
  const showSubscribersCaption = !isSubscribed;

  return (
    <Reveal as="section" className="clinical-report-cta">
      <a id="clinical-report" className="anchor-target" aria-hidden="true" />
      <div className="clinical-report-cta-inner">
        <Eyebrow>CLINICAL REPORT</Eyebrow>
        <h2 className="clinical-report-h">
          For your <span className="it">analyst.</span>
        </h2>
        <p className="clinical-report-lede">
          A 12&ndash;18 page dossier &mdash; the six readings fully
          developed, plus six more the dashboard does not show:
          mother&#8209;imago, dream logic, relational pattern, defenses,
          shadow, transference. Translated into the language a clinician
          works in.
        </p>
        {depth < 0.5 ? (
          <p className="clinical-report-note">
            the report will reflect the depth available. it can be
            regenerated as the reading deepens.
          </p>
        ) : null}
        <div className="clinical-report-actions">
          {canGenerateIncluded ? (
            <form method="POST" action="/api/reports">
              <button type="submit" className="cta cta-solid">
                <span>Generate clinical report</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </form>
          ) : (
            <CTA href="/reports/confirm">Request clinical report</CTA>
          )}
        </div>
        {showSubscribersCaption ? (
          <p className="clinical-report-foot">
            <span>one report included each month for </span>
            <Link
              href="/subscribe/confirm"
              className="clinical-report-foot-link"
            >
              subscribers
            </Link>
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}

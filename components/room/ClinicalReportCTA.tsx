import Eyebrow from "@/components/ui/Eyebrow";
import CTA from "@/components/ui/CTA";
import Reveal from "@/components/layout/Reveal";

type ClinicalReportCTAProps = {
  /** Whether the user has an active subscription. */
  isSubscribed: boolean;
  /** Current reading depth in [0, 1]. */
  depth: number;
};

/**
 * Bottom of /readings — the offer to generate a clinical report.
 *
 * The price NEVER appears on this CTA. It is only shown on the
 * confirmation screens.
 *
 * Subscribed users get a real <form method="POST"> straight to
 * /api/reports, which creates a queued row and redirects to its status
 * page. Free users go to /reports/confirm where the price string lives.
 */
export default function ClinicalReportCTA({
  isSubscribed,
  depth,
}: ClinicalReportCTAProps) {
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
          {isSubscribed ? (
            <form method="POST" action="/api/reports">
              <button type="submit" className="cta">
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
        <div className="clinical-report-foot">
          <span>subscribers · one report included each month</span>
          <span />
        </div>
      </div>
    </Reveal>
  );
}

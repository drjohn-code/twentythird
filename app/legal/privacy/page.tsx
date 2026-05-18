import type { Metadata } from "next";
import FigureCard from "../../../components/figures/FigureCard";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — TwentyThird",
  description:
    "How TwentyThird handles personal data. Nothing leaves the EU. Nothing is sold.",
};

export default function PrivacyPage() {
  return (
    <article className="legal-article" id="privacy">
      <section className="legal-section">
        <div className="legal-eyebrow">PRIVACY</div>
        <h2>
          Personal data, <em>handled with care.</em>
        </h2>
        <p className="legal-lede">
          TwentyThird processes what you share to give you accurate
          psychodynamic insight. Nothing leaves the EU. Nothing is sold.
        </p>

        <div className="legal-sub">
          <h3>
            Who <em>controls</em> your data
          </h3>
          <p>
            WelloWork AB, registered in Sweden (org.&nbsp;nr.&nbsp;559472‑9997),
            operating from Uppsala, is the data controller for personal data
            collected on this website and through direct enquiries.
          </p>
          <p>
            For data processed inside the TwentyThird platform on behalf of an
            organisation — a clinic, a research institution, an employer —
            WelloWork AB acts as processor and the customer organisation is the
            controller. That relationship is governed by a separate Data
            Processing Agreement.
          </p>
        </div>

        <FigureCard
          label="who controls your data"
          subtitle=""
          fig="Fig. 01"
          className="legal-df-card"
        >
          <div className="df-rows">
            <div className="df-row">
              <div className="df-box">
                <span className="df-role">Controller</span>
                <span className="df-entity">WelloWork AB</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
                <span className="df-connector-label">direct relationship</span>
              </div>
              <div className="df-box">
                <span className="df-role">Website Visitor</span>
                <span className="df-entity">You</span>
              </div>
            </div>
            <div className="df-row">
              <div className="df-box">
                <span className="df-role">Controller</span>
                <span className="df-entity">Customer Org</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
                <span className="df-connector-label">via DPA</span>
              </div>
              <div className="df-box">
                <span className="df-role">Processor</span>
                <span className="df-entity">WelloWork AB</span>
              </div>
              <div className="df-connector">
                <div className="df-line" />
              </div>
              <div className="df-box">
                <span className="df-role">Platform User</span>
                <span className="df-entity">You</span>
              </div>
            </div>
          </div>
        </FigureCard>

        <div className="legal-sub">
          <h3>
            What we <em>collect</em>
          </h3>
          <p>
            <strong>Contact and account data.</strong> Name, email address, and
            any information you provide when signing up or writing to us. Legal
            basis: performance of contract (Art.&nbsp;6(1)(b) GDPR).
          </p>
          <p>
            <strong>Session and platform data.</strong> Journal entries,
            responses, dream content, and linguistic patterns you share inside
            TwentyThird. This is the substrate of the analysis. Legal basis:
            explicit consent (Art.&nbsp;9(2)(a) GDPR), given at onboarding and
            revocable at any time. We treat this data as special-category
            health-adjacent data and apply corresponding safeguards regardless
            of formal classification.
          </p>
          <p>
            <strong>Technical data.</strong> IP address, browser type, device
            identifiers, and usage timestamps — collected automatically when you
            access the platform. Legal basis: legitimate interest
            (Art.&nbsp;6(1)(f) GDPR) to maintain security and diagnose errors.
          </p>
          <p>
            We do not collect data on race, ethnicity, political opinion, or
            religious belief. If content you share incidentally reveals such
            information, it is not processed as a distinct category.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            How we <em>use</em> it
          </h3>
          <p>
            We use your data to deliver and improve the TwentyThird service,
            send transactional messages you have requested, detect and prevent
            fraud or abuse, and comply with legal obligations.
          </p>
          <p>
            We do not use your data for advertising profiling. We do not sell
            it, license it, or share it with data brokers. We do not use it to
            train general-purpose AI models operated by third parties.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Who <em>sees</em> it
          </h3>
          <p>
            <strong>Within WelloWork AB:</strong> Clinicians and engineers who
            need access to maintain the service. Access is role-restricted and
            logged.
          </p>
          <p>
            <strong>Infrastructure providers:</strong> Supabase (database and
            authentication, EU region), Vercel (hosting, EU edge), and Postmark
            (transactional email). Each is bound by a Data Processing Agreement
            and processes data only on our documented instruction.
          </p>
          <p>
            <strong>Legal obligation:</strong> We disclose data to competent
            authorities only when required by law, and only to the extent
            required.
          </p>
          <p>
            No data is transferred outside the EU/EEA. If that changes, we will
            update this policy and obtain fresh consent where required.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>Retention</em>
          </h3>
          <p>
            Account and platform data is retained for as long as your account
            is active, plus 30 days after deletion to allow recovery. Technical
            logs are retained for 90 days. Contact enquiries are retained for
            24 months.
          </p>
          <p>
            After these periods, data is permanently deleted or irreversibly
            anonymised.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Your <em>rights</em>
          </h3>
          <p>
            You have the right to access the data we hold about you, correct
            inaccuracies, request deletion, restrict or object to processing,
            and receive a machine-readable copy for portability. Where
            processing is based on consent, you may withdraw it at any time
            without affecting the lawfulness of processing before withdrawal.
          </p>
          <p>
            To exercise any right:{" "}
            <a href="mailto:privacy@day-23.com" className="legal-link">
              privacy@day-23.com
            </a>
            . We respond within 30 days. If you are unsatisfied with our
            response, you may lodge a complaint with
            Integritetsskyddsmyndigheten (IMY), Sweden&rsquo;s data protection
            authority.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>Children</em>
          </h3>
          <p>
            TwentyThird is not directed at persons under 18. We do not
            knowingly collect data from minors. If we become aware that a minor
            has submitted data, we delete it promptly.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>Changes</em>
          </h3>
          <p>
            We update this policy when our practices change. Material changes
            are notified by email at least 14 days before they take effect. The
            version date appears at the bottom of this page.
          </p>
          <p className="legal-effective">
            Effective: {LEGAL_EFFECTIVE_DATE} · Governing law: Swedish law and
            the GDPR
          </p>
        </div>
      </section>
    </article>
  );
}

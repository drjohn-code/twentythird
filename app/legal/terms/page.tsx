import type { Metadata } from "next";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — TwentyThird",
  description:
    "The agreement governing your use of TwentyThird. Written to be read, not avoided.",
};

export default function TermsPage() {
  return (
    <article className="legal-article" id="terms">
      <section className="legal-section">
        <div className="legal-eyebrow">TERMS</div>
        <h2>
          The agreement, <em>stated plainly.</em>
        </h2>
        <p className="legal-lede">
          These terms govern your use of TwentyThird. They are written to be
          read, not avoided.
        </p>

        <div className="legal-sub">
          <h3>
            The <em>service</em>
          </h3>
          <p>
            TwentyThird is a psychodynamic AI platform operated by WelloWork AB.
            It provides analytical insight drawn from what you share. It is not
            a medical device. It does not constitute psychotherapy, psychiatric
            diagnosis, or clinical treatment. If you are in psychological
            distress, please contact a qualified clinician or an emergency
            service.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Your <em>account</em>
          </h3>
          <p>
            You must be 18 or older to use TwentyThird. You are responsible for
            maintaining the confidentiality of your credentials. You may not
            share your account or use the platform on behalf of another person
            without their explicit consent.
          </p>
          <p>
            You own the content you create — your journal entries, your
            responses. By submitting them, you grant WelloWork AB a limited
            licence to process them for the purposes described in the Privacy
            Policy. You may export or delete your content at any time.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Acceptable <em>use</em>
          </h3>
          <p>
            You may use TwentyThird for lawful personal and professional
            self-exploration. You may not use it to harm yourself or others, to
            attempt to circumvent the platform&rsquo;s safety systems, to
            reverse-engineer the underlying models, or to train competing AI
            systems.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms, without prior notice where required for safety.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Our <em>liability</em>
          </h3>
          <p>
            TwentyThird provides insight, not certainty. We do not warrant that
            the analysis is accurate, complete, or appropriate for your
            circumstances. To the extent permitted by Swedish law, our liability
            is limited to the amount you paid in the 3 months preceding the
            relevant claim.
          </p>
          <p>
            Nothing in these terms limits liability for death or personal injury
            caused by our negligence, or for fraud.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Governing law and <em>disputes</em>
          </h3>
          <p>
            These terms are governed by Swedish law. Disputes that cannot be
            resolved directly are referred to the courts of Uppsala, Sweden, as
            the court of first instance.
          </p>
          <p>
            If you are a consumer in the EU, you also have access to the EU
            Online Dispute Resolution platform at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="legal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>Changes</em>
          </h3>
          <p>
            We may update these terms. Continued use after the effective date of
            a material change constitutes acceptance. We notify material changes
            by email at least 14 days in advance.
          </p>
          <p className="legal-effective">
            Effective: {LEGAL_EFFECTIVE_DATE}
          </p>
        </div>
      </section>
    </article>
  );
}

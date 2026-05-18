import type { Metadata } from "next";
import { LEGAL_EFFECTIVE_DATE } from "../../../lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy — TwentyThird",
  description:
    "TwentyThird uses cookies for authentication and preference persistence only. No advertising cookies. No third-party trackers.",
};

export default function CookiesPage() {
  return (
    <article className="legal-article" id="cookies">
      <section className="legal-section">
        <div className="legal-eyebrow">COOKIES</div>
        <h2>
          What we store <em>in your browser.</em>
        </h2>
        <p className="legal-lede">
          TwentyThird uses cookies for authentication and preference
          persistence. We use no advertising cookies and no third-party
          trackers.
        </p>

        <div className="legal-sub">
          <h3>
            What a cookie <em>is</em>
          </h3>
          <p>
            A cookie is a small text file stored in your browser. We use them
            to keep you signed in and to remember your theme preference (dark or
            light). That is all.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Cookies <em>we set</em>
          </h3>
          <p>
            <strong>
              <code className="legal-code">sb-auth-token</code>
            </strong>{" "}
            — Set by Supabase. Maintains your authenticated session. Expires
            when you sign out or after 7 days of inactivity. Strictly
            necessary.
          </p>
          <p>
            <strong>
              <code className="legal-code">theme</code>
            </strong>{" "}
            — Stores your dark/light mode preference. Persists until cleared.
            Functional.
          </p>
          <p>
            We set no advertising cookies. We load no third-party tracking
            scripts — no Google Analytics, no Meta Pixel, no marketing tags of
            any kind.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            Your <em>choices</em>
          </h3>
          <p>
            You may clear cookies at any time through your browser settings.
            Clearing{" "}
            <code className="legal-code">sb-auth-token</code> will sign you
            out. Clearing <code className="legal-code">theme</code> will reset
            the display to the dark default.
          </p>
          <p>
            We do not use a cookie consent banner for strictly necessary or
            functional cookies under the ePrivacy Directive, as they require no
            consent. If we introduce any non-essential cookies in the future, we
            will obtain consent before setting them.
          </p>
        </div>

        <div className="legal-sub">
          <h3>
            <em>Contact</em>
          </h3>
          <p>
            Questions about cookies or any other data matter:{" "}
            <a href="mailto:privacy@day-23.com" className="legal-link">
              privacy@day-23.com
            </a>
          </p>
          <p className="legal-effective">
            Effective: {LEGAL_EFFECTIVE_DATE}
          </p>
        </div>
      </section>
    </article>
  );
}

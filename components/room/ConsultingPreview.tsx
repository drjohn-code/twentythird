import FigureCard from "@/components/figures/FigureCard";
import Hairline from "@/components/room/Hairline";
import Reveal from "@/components/layout/Reveal";

// ────────────────────────────────────────────────────────────────────
// ConsultingPreview — shown on /consulting for unsubscribed users.
// Three stacked sections: a printed sample sitting, what a session
// does, and what is included. No interaction, no pricing, no figures
// from the user's own record. Wrapped in a single Reveal so the whole
// preview lands together on enter.
// ────────────────────────────────────────────────────────────────────

export default function ConsultingPreview() {
  return (
    <Reveal as="section" className="consulting-preview" aria-label="what a consulting room sitting looks like">
      <div className="consulting-preview-section">
        <FigureCard
          label="the consulting room"
          subtitle="a sitting, previewed"
          fig="Fig. 08"
        >
          <div className="consulting-preview-transcript">
            <p className="consulting-preview-held">
              &ldquo;what part of you keeps choosing this?&rdquo;
            </p>
            <p className="consulting-preview-user">
              I keep ending things the week they get serious. I don&rsquo;t know
              why I do it.
            </p>
            <p className="consulting-preview-analyst">
              You name a pattern, then narrate it as a stranger&rsquo;s. The
              {" "}&lsquo;I don&rsquo;t know&rsquo; is doing work — it keeps the
              act on the far side of intention. Notice when the{" "}
              <em>withdrawal</em> begins. Often the foreclosure happens earlier
              than the leaving.
            </p>
          </div>
          <p className="consulting-preview-mark">
            EXAMPLE · NOT FROM YOUR RECORD
          </p>
        </FigureCard>
      </div>

      <Hairline className="consulting-preview-divider" />

      <div className="consulting-preview-section consulting-preview-panels">
        <article className="consulting-preview-panel glass">
          <p className="consulting-preview-panel-title">
            named, not narrated
          </p>
          <p className="consulting-preview-panel-body">
            The analyst will name what&rsquo;s happening in your speech — the
            slip, the qualifier, the half-said — and hold it there until you
            can see it.
          </p>
        </article>
        <article className="consulting-preview-panel glass">
          <p className="consulting-preview-panel-title">
            kept in the case file
          </p>
          <p className="consulting-preview-panel-body">
            Every sitting is written down. The next reading reads it. Patterns
            surface across weeks, not turns.
          </p>
        </article>
        <article className="consulting-preview-panel glass">
          <p className="consulting-preview-panel-title">
            one voice, no roster
          </p>
          <p className="consulting-preview-panel-body">
            Not a chatbot rotation. A single analytic voice, trained on your
            intake and refined by every catchup.
          </p>
        </article>
      </div>

      <Hairline className="consulting-preview-divider" />

      <div className="consulting-preview-section">
        <ul className="consulting-preview-list" aria-label="what the subscription includes">
          <li className="consulting-preview-list-row">
            <span className="consulting-preview-list-left">
              unlimited sittings with the analyst
            </span>
            <span className="consulting-preview-list-right">INCLUDED</span>
          </li>
          <li className="consulting-preview-list-row">
            <span className="consulting-preview-list-left">
              one clinical report each month
            </span>
            <span className="consulting-preview-list-right">
              INCLUDED · 12–18 PAGES
            </span>
          </li>
          <li className="consulting-preview-list-row">
            <span className="consulting-preview-list-left">
              up to two named connections
            </span>
            <span className="consulting-preview-list-right">INCLUDED</span>
          </li>
          <li className="consulting-preview-list-row">
            <span className="consulting-preview-list-left">
              the case file, kept always
            </span>
            <span className="consulting-preview-list-right">
              YOURS · ALWAYS
            </span>
          </li>
        </ul>
      </div>
    </Reveal>
  );
}

import FigureCard from "@/components/figures/FigureCard";

// ────────────────────────────────────────────────────────────────────
// ConsultingPreview — the transcript figure shown to unsubscribed
// users on /consulting. A left rail of reading "areas" with one row
// marked active (the partner area, since the printed sitting is about
// that), and a tightened three-turn transcript on the right. The
// analyst's middle reply references a specific reading from the case
// file — that is the proof-of-memory moment.
// ────────────────────────────────────────────────────────────────────

// decorative — preview-only; not tied to block slugs
const AREAS: { label: string; active?: boolean }[] = [
  { label: "family area" },
  { label: "partner area", active: true },
  { label: "work area" },
  { label: "dream area" },
  { label: "friends area" },
  { label: "self area" },
];

export default function ConsultingPreview() {
  return (
    <FigureCard
      label="the consulting room"
      subtitle="a sitting, previewed"
      fig="Fig. 08"
      className="consulting-preview-figure"
    >
      <div className="consulting-preview-grid">
        <aside
          className="consulting-preview-rail"
          aria-label="reading areas surfaced for this sitting"
        >
          <p className="consulting-preview-rail-eyebrow">READING FROM</p>
          <ul className="consulting-preview-rail-list">
            {AREAS.map(({ label, active }) => (
              <li
                key={label}
                className={
                  "consulting-preview-rail-row" +
                  (active ? " is-active" : "")
                }
              >
                <span className="consulting-preview-rail-label">{label}</span>
                {active ? (
                  <span
                    className="consulting-preview-rail-dot"
                    aria-label="active"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </aside>

        <div className="consulting-preview-main">
          <p className="consulting-preview-held">
            &ldquo;what part of you keeps choosing this?&rdquo;
          </p>

          <div className="consulting-preview-turns">
            <p className="consulting-preview-user">
              I keep ending things the week they get serious. I don&rsquo;t
              know why I do it.
            </p>
            <p className="consulting-preview-analyst">
              You name a pattern, then narrate it as a stranger&rsquo;s. The{" "}
              <em>&ldquo;I don&rsquo;t know&rdquo;</em> is doing work — it
              keeps the act on the far side of intention. Notice when the{" "}
              <em>withdrawal</em> begins. Often the foreclosure happens
              earlier than the leaving.
            </p>

            <p className="consulting-preview-user">
              Earlier how? Last time it felt like I just woke up one morning
              and knew.
            </p>
            <p className="consulting-preview-analyst">
              The morning is the verdict, not the trial. Your{" "}
              <strong>intimacy threshold</strong> reading from week 04 noted
              the same shape — a quiet rehearsal of leaving, two to three
              weeks before the conversation. The morning is when the body
              finally agrees with what you&rsquo;d already decided.
            </p>

            <p className="consulting-preview-user">
              That&rsquo;s the part that scares me. That it&rsquo;s already
              decided.
            </p>
            <p className="consulting-preview-analyst">
              <em>Decided</em> is the word. Not <em>chosen</em>. Something in
              the structure prefers the foreclosure to the test. We will keep
              going there.
            </p>
          </div>
        </div>
      </div>

      <p className="consulting-preview-mark">
        EXAMPLE · NOT FROM YOUR RECORD
      </p>
    </FigureCard>
  );
}

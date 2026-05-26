import FigureCard from "@/components/figures/FigureCard";

// ────────────────────────────────────────────────────────────────────
// ConsultingPreview — the transcript figure shown to unsubscribed
// users on /consulting. Two halves inside one FigureCard:
//
//   • Left rail — six "areas" the analyst is reading from, each with
//     two italic case-file snippets so the rail reads as a record,
//     not nav. The Partner area is marked active.
//
//   • Right column — a chat-style transcript. User turns sit in glass
//     bubbles with a YOU mono label; analyst turns are plain serif
//     paragraphs with an ANALYST mono label. Both align left. The
//     asymmetry — user in a bubble, analyst on the page — is the
//     design tell. The middle analyst reply references the intimacy
//     threshold reading from week 04 — that is the proof-of-memory
//     beat. A decorative "say it…" input sits below the transcript;
//     it is a <div>, not a form, and is aria-hidden.
//
// This chat-bubble grammar is local to this preview only. The live
// SessionView keeps its own transcript rules.
// ────────────────────────────────────────────────────────────────────

// decorative — preview only, not tied to block_readings
type Snippet = { wk: string; text: string };
type Area = { title: string; active?: boolean; snippets: [Snippet, Snippet] };

const AREAS: Area[] = [
  {
    title: "Family",
    snippets: [
      { wk: "WK 06", text: "the mother’s silence as a kind of instruction…" },
      { wk: "WK 02", text: "father came up unprompted, again…" },
    ],
  },
  {
    title: "Partner",
    active: true,
    snippets: [
      { wk: "WK 04", text: "the week-they-get-serious pattern surfaced…" },
      { wk: "WK 03", text: "“I just woke up and knew” — a verdict, not a trial…" },
    ],
  },
  {
    title: "Work",
    snippets: [
      { wk: "WK 05", text: "the promotion as exposure, not reward…" },
      { wk: "WK 01", text: "imposter language softened slightly…" },
    ],
  },
  {
    title: "Dream",
    snippets: [
      { wk: "WK 04", text: "recurring house dream, doors locked from inside…" },
      { wk: "WK 02", text: "the dream of being told to leave…" },
    ],
  },
  {
    title: "Friends",
    snippets: [
      { wk: "WK 06", text: "withdrawal noted around close friends too…" },
      { wk: "WK 03", text: "keeps the count of confidants low…" },
    ],
  },
  {
    title: "Self",
    snippets: [
      { wk: "WK 05", text: "the “I don’t know” as a structural refusal…" },
      { wk: "WK 02", text: "still calls it “the thing I do”…" },
    ],
  },
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
          aria-label="case file areas the analyst is reading from"
        >
          <p className="consulting-preview-rail-eyebrow">READING FROM</p>
          <ul className="consulting-preview-rail-list">
            {AREAS.map(({ title, active, snippets }) => (
              <li
                key={title}
                className={
                  "consulting-preview-rail-row" +
                  (active ? " is-active" : "")
                }
              >
                <div className="consulting-preview-rail-head">
                  <span className="consulting-preview-rail-label">{title}</span>
                  {active ? (
                    <span
                      className="consulting-preview-rail-dot"
                      aria-label="active"
                    />
                  ) : null}
                </div>
                <div className="consulting-preview-rail-snippets">
                  {snippets.map((s, i) => (
                    <p key={i} className="consulting-preview-rail-snippet">
                      <span className="consulting-preview-rail-wk">{s.wk}</span>
                      <span className="consulting-preview-rail-snippet-text">
                        {" · "}
                        {s.text}
                      </span>
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="consulting-preview-main">
          <p className="consulting-preview-held">
            &ldquo;what part of you keeps choosing this?&rdquo;
          </p>

          <div className="consulting-preview-turns">
            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">YOU</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  I keep ending things the week they get serious. I don&rsquo;t
                  know why I do it.
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">ANALYST</span>
              <p className="consulting-preview-analyst">
                You name a pattern, then narrate it as a stranger&rsquo;s. The{" "}
                <em>&ldquo;I don&rsquo;t know&rdquo;</em> is doing work — it
                keeps the act on the far side of intention. Notice when the{" "}
                <em>withdrawal</em> begins. Often the foreclosure happens
                earlier than the leaving.
              </p>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">YOU</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  Earlier how? Last time it felt like I just woke up one
                  morning and knew.
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">ANALYST</span>
              <p className="consulting-preview-analyst">
                The morning is the verdict, not the trial. Your{" "}
                <strong>intimacy threshold</strong> reading from week 04 noted
                the same shape — a quiet rehearsal of leaving, two to three
                weeks before the conversation. The morning is when the body
                finally agrees with what you&rsquo;d already decided.
              </p>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">YOU</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  That&rsquo;s the part that scares me. That it&rsquo;s already
                  decided.
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">ANALYST</span>
              <p className="consulting-preview-analyst">
                <em>Decided</em> is the word. Not <em>chosen</em>. Something in
                the structure prefers the foreclosure to the test. We will keep
                going there.
              </p>
            </div>
          </div>

          <div className="consulting-preview-faux-input" aria-hidden="true">
            <span className="consulting-preview-faux-input-prompt">
              say it…
            </span>
            <span className="consulting-preview-faux-input-affordance">
              say it →
            </span>
          </div>
        </div>
      </div>

      <p className="consulting-preview-mark">
        EXAMPLE · NOT FROM YOUR RECORD
      </p>
    </FigureCard>
  );
}

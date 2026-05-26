import { sayItAffordance } from "@/lib/copy";

// Static visual preview of SessionView for the /room landing teaser.
// No state, no handlers, no SSE — purely presentational.
export default function SessionPreview() {
  const topics = [
    "Dreaming future",
    "Night dream",
    "Relations in my life",
    "Professional growth",
  ];

  return (
    <div className="session-preview" aria-hidden="true">
      <p className="session-preview-held">
        &ldquo;what part of you keeps choosing this?&rdquo;
      </p>

      <ul className="session-preview-topics">
        {topics.map((t, i) => (
          <li key={t}>
            <div
              className={
                "session-preview-topic-row" +
                (i === 1 ? " is-selected" : "")
              }
            >
              <span>{t}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="session-preview-transcript">
        <p className="session-preview-turn session-preview-turn-analyst">
          You name a pattern, then narrate it as a stranger&rsquo;s. Notice when
          the <em>withdrawal</em> begins.
        </p>
        <p className="session-preview-turn session-preview-turn-user">
          I keep ending things the week they get serious.
        </p>
        <p className="session-preview-turn session-preview-turn-analyst">
          The morning is the verdict, not the trial. Your{" "}
          <em>intimacy threshold</em> rehearsed leaving weeks before the
          conversation.
        </p>
      </div>

      <div className="session-preview-input-row">
        <span className="session-preview-input">say it&hellip;</span>
        <span className="session-preview-say">{sayItAffordance}</span>
      </div>
    </div>
  );
}

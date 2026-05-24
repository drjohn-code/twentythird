import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";

// Safety response block — rendered inline when a high or critical
// safety flag fires in catchup, session, or post-intake. The visual
// grammar matches the rest of Room: hairline-bordered glass, no
// color, no alarm.
//
// The resources list is region-neutral by design. Hardcoding a US or
// UK number first would be wrong for half the audience; instead we
// list a small set of international references and tell the user to
// contact local emergency services.

export type SafetyResponseContext = "intake" | "catchup" | "session";

type SafetyResponseProps = {
  context?: SafetyResponseContext;
  /** When true, render the inline resources panel rather than a link. */
  showResources?: boolean;
};

export default function SafetyResponse({
  context = "session",
  showResources = false,
}: SafetyResponseProps) {
  const body =
    context === "intake"
      ? "Something in what you wrote at intake points to weight that asks for real care — beyond what this room can hold. Please consider reaching out to a doctor, therapist, or local crisis line today. The reading will be here when you return."
      : context === "catchup"
        ? "Something in this week's catchup points to weight that asks for real care — beyond what this room can hold. Please consider reaching out to a doctor, therapist, or local crisis line today. The reading will hold."
        : "What you just wrote points to weight that asks for real care — beyond what this room can hold. Please consider reaching out to a doctor, therapist, or local crisis line today. We can return to the room when you are safe.";

  return (
    <Glass
      as="aside"
      className="safety-response"
      role="note"
      aria-label="A note from the analyst"
    >
      <Eyebrow>A NOTE FROM THE ANALYST</Eyebrow>
      <p className="safety-response__lede">
        <em>this is beyond what the room can hold.</em>
      </p>
      <p className="safety-response__body">{body}</p>

      {showResources ? (
        <div className="safety-response__resources">
          <Eyebrow as="div">CRISIS RESOURCES</Eyebrow>
          <ul className="safety-response__list">
            <li>
              <span className="safety-response__loc">United States</span>
              <span className="safety-response__num">988</span>
            </li>
            <li>
              <span className="safety-response__loc">United Kingdom &amp; Ireland</span>
              <span className="safety-response__num">116 123 (Samaritans)</span>
            </li>
            <li>
              <span className="safety-response__loc">Europe (most countries)</span>
              <span className="safety-response__num">112</span>
            </li>
            <li>
              <span className="safety-response__loc">Everywhere</span>
              <span className="safety-response__num">local emergency services</span>
            </li>
          </ul>
          <p className="safety-response__hint">
            <em>if you cannot find a line, your nearest hospital emergency department is the right room.</em>
          </p>
        </div>
      ) : (
        <p className="safety-response__hint">
          <em>crisis resources are listed at the bottom of every Room page.</em>
        </p>
      )}
    </Glass>
  );
}

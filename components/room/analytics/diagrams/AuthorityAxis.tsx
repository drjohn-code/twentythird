type AuthorityAxisProps = {
  /** 0 = fully internalised severity, 1 = fully externalised authority. */
  position: number;
  size: "card" | "section";
};

/**
 * A single horizontal hairline. The user's tick sits proportional
 * to the balance of self-blame vs. other-blame markers in their
 * father-imago intake answers.
 */
export default function AuthorityAxis({
  position,
  size,
}: AuthorityAxisProps) {
  const pct = Math.max(0, Math.min(1, position)) * 100;
  return (
    <div className={`auth-axis auth-axis-${size}`}>
      <title>Father-imago axis — figure</title>
      <div className="auth-axis-labels">
        <span>INTERNALISED · SEVERITY</span>
        <span>EXTERNALISED · AUTHORITY</span>
      </div>
      <div className="auth-axis-track">
        <span
          className="auth-axis-tick"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="auth-axis-foot">
        <span className="auth-axis-foot-dim">0</span>
        <span className="auth-axis-foot-dim">1</span>
      </div>
    </div>
  );
}

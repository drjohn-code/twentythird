type Props = {
  /** Eyebrow label, e.g. "error" or "email not confirmed". */
  label?: string;
  /** The serif italic sentence shown below the label. */
  children: React.ReactNode;
  id?: string;
};

/**
 * The canonical inline-error grammar used above auth forms:
 *   - hairline border above
 *   - mono 11px uppercase label in --fg-mute
 *   - serif italic sentence in --fg-dim
 * No red, no icons. role="alert" so screen readers announce on mount.
 */
export default function InlineError({ label = "error", children, id }: Props) {
  return (
    <div className="auth-inline-error" role="alert" id={id}>
      <span className="auth-inline-error-label">{label}</span>
      <p className="auth-inline-error-body">{children}</p>
    </div>
  );
}

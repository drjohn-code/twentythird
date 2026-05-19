import type { ReactNode } from "react";

type FieldProps = {
  id?: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Wrap radio/checkbox groups so the legend reads as the label. */
  asFieldset?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + (optional) hint/error. The grammar of every form row. */
export default function Field({
  id,
  label,
  hint,
  error,
  asFieldset,
  children,
  className,
}: FieldProps) {
  const errorId = id ? `${id}-err` : undefined;
  const hintId = id ? `${id}-hint` : undefined;

  if (asFieldset) {
    return (
      <fieldset className={["auth-field onb-field", className].filter(Boolean).join(" ")}>
        <legend className="eyebrow">{label}</legend>
        {children}
        {hint ? (
          <p id={hintId} className="auth-hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="auth-hint field-error" role="alert">
            {error}
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <div className={["auth-field onb-field", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="auth-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="auth-hint field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

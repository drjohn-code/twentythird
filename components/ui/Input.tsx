import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/** Token-mapped text input — bg-glass, hair border, 3px radius. */
export default function Input({
  className,
  invalid,
  ...rest
}: InputProps) {
  return (
    <input
      {...rest}
      className={[
        "field-input",
        invalid ? "is-invalid" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={invalid || undefined}
    />
  );
}

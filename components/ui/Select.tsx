import type { SelectHTMLAttributes } from "react";

type Option = { value: string; label: string };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: Option[];
  placeholder?: string;
  invalid?: boolean;
};

/** Native select + serif italic ↓ caret in a sibling span. Not an SVG. */
export default function Select({
  className,
  invalid,
  options,
  placeholder,
  ...rest
}: SelectProps) {
  return (
    <div className="field-select-wrap onb-select-wrap">
      <select
        {...rest}
        className={[
          "field-input field-select",
          invalid ? "is-invalid" : null,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={invalid || undefined}
        defaultValue={rest.defaultValue ?? rest.value ?? ""}
      >
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className="field-select-caret onb-select-caret serif-i"
        aria-hidden="true"
      >
        ↓
      </span>
    </div>
  );
}

"use client";

import { type ReactNode } from "react";

type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  legend: ReactNode;
  max?: number;
  disabled?: boolean;
};

/** Wrapping flex of pill chips. Each chip is a button with aria-pressed. */
export default function MultiSelect({
  options,
  value,
  onChange,
  legend,
  max,
  disabled,
}: MultiSelectProps) {
  function toggle(v: string) {
    if (disabled) return;
    const has = value.includes(v);
    if (has) {
      onChange(value.filter((x) => x !== v));
      return;
    }
    if (typeof max === "number" && value.length >= max) return;
    onChange([...value, v]);
  }

  return (
    <fieldset className="multi-select" role="group">
      <legend className="vh-legend">{legend}</legend>
      <div className="multi-select-chips">
        {options.map((opt) => {
          const isOn = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              aria-disabled={disabled || undefined}
              className={["chip", isOn ? "is-on" : null]
                .filter(Boolean)
                .join(" ")}
              onClick={() => toggle(opt.value)}
              disabled={disabled}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

"use client";

import { type ReactNode } from "react";
import Radio from "./Radio";

type Option = { value: string; label: string };

type RadioGroupProps = {
  name: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  /** When the question title doubles as legend. */
  legend: ReactNode;
  layout?: "vertical" | "horizontal";
  disabled?: boolean;
};

/** Fieldset + visually-hidden legend; question title is the real legend. */
export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  legend,
  layout = "vertical",
  disabled,
}: RadioGroupProps) {
  return (
    <fieldset
      className={[
        "radio-group",
        layout === "horizontal" ? "is-horizontal" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      role="radiogroup"
    >
      <legend className="vh-legend">{legend}</legend>
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          checked={value === opt.value}
          onSelect={onChange}
          disabled={disabled}
        />
      ))}
    </fieldset>
  );
}

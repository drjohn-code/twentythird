"use client";

import { useId, type KeyboardEvent } from "react";

type RadioProps = {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  label: string;
  disabled?: boolean;
};

/** A single radio row — 14px outer circle + 6px inner fill when selected. */
export default function Radio({
  name,
  value,
  checked,
  onSelect,
  label,
  disabled,
}: RadioProps) {
  const id = useId();

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onSelect(value);
    }
  }

  return (
    <label
      htmlFor={id}
      className={[
        "radio-row",
        checked ? "is-checked" : null,
        disabled ? "is-disabled" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        id={id}
        type="button"
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        className="radio-dot"
        name={name}
        value={value}
        onClick={() => !disabled && onSelect(value)}
        onKeyDown={onKey}
        disabled={disabled}
      >
        <span className="radio-dot-inner" aria-hidden="true" />
      </button>
      <span className="radio-row-label">{label}</span>
    </label>
  );
}

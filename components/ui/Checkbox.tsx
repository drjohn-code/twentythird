"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

type CheckboxProps = {
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Row text — clickable, sits to the right of the box. */
  children: ReactNode;
  disabled?: boolean;
  ariaDescribedBy?: string;
};

/** 16px square; checked state fills bg-fg and renders a serif italic ✓. */
export default function Checkbox({
  name,
  checked,
  onChange,
  children,
  disabled,
  ariaDescribedBy,
}: CheckboxProps) {
  const id = useId();

  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  }

  return (
    <div
      className={[
        "checkbox-row",
        checked ? "is-checked" : null,
        disabled ? "is-disabled" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        className="checkbox-box"
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={onKey}
        disabled={disabled}
      >
        {checked ? (
          <span className="checkbox-mark serif-i" aria-hidden="true">
            ✓
          </span>
        ) : null}
      </button>
      <label htmlFor={id} className="checkbox-row-label">
        {children}
      </label>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={checked ? "on" : ""}
        />
      ) : null}
    </div>
  );
}

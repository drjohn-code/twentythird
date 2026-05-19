"use client";

import { useCallback, useId, type KeyboardEvent, type ReactNode } from "react";

type ScaleProps = {
  /** Question title — wired to aria-label on the slider. */
  legend: ReactNode;
  legendId?: string;
  value: number | null;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  onChange: (n: number) => void;
};

/**
 * Custom 1–10 slider. Not a native range — too OS-themed.
 * - Hairline track + N circular nodes.
 * - Selected node fills bg-fg; selected number renders above in serif italic.
 * - Arrow keys + Home/End navigate; role=slider with aria-value*.
 */
export default function Scale({
  legend,
  legendId,
  value,
  min,
  max,
  lowLabel,
  highLabel,
  onChange,
}: ScaleProps) {
  const id = useId();
  const labelId = legendId ?? `${id}-label`;
  const display = value ?? null;
  const announce =
    value === null
      ? "no value selected"
      : `${value} out of ${max} — ${value <= 3 ? lowLabel.toLowerCase() : value >= 8 ? highLabel.toLowerCase() : "middle of the range"}`;

  const setClamped = useCallback(
    (n: number) => {
      const v = Math.max(min, Math.min(max, Math.round(n)));
      onChange(v);
    },
    [min, max, onChange],
  );

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const v = value ?? Math.floor((min + max) / 2);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        setClamped(v + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        setClamped(v - 1);
        break;
      case "Home":
        e.preventDefault();
        setClamped(min);
        break;
      case "End":
        e.preventDefault();
        setClamped(max);
        break;
    }
  }

  const nodes: number[] = [];
  for (let i = min; i <= max; i++) nodes.push(i);

  return (
    <div className="scale" aria-labelledby={labelId}>
      <span id={labelId} className="vh-legend">
        {legend}
      </span>
      <div className="scale-display">
        <span
          className="scale-value serif-i"
          key={display ?? "none"}
          aria-hidden="true"
        >
          {display ?? "—"}
        </span>
      </div>
      <div
        className="scale-track-wrap"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        aria-valuetext={announce}
        onKeyDown={onKey}
      >
        <div className="scale-track" aria-hidden="true" />
        <div className="scale-nodes" aria-hidden="true">
          {nodes.map((n) => {
            const isOn = value !== null && n === value;
            return (
              <button
                key={n}
                type="button"
                tabIndex={-1}
                aria-label={`${n}`}
                className={["scale-node", isOn ? "is-on" : null]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setClamped(n)}
              >
                <span className="scale-node-dot" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="scale-labels" aria-hidden="true">
        <span className="mono">{lowLabel}</span>
        <span className="mono">{highLabel}</span>
      </div>
    </div>
  );
}

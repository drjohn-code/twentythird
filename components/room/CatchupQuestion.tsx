"use client";

import { useId, type ChangeEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { CatchupQuestion } from "@/lib/catchup-questions";

type Props = {
  question: CatchupQuestion;
  index: number;
  total: number;
  value: string | number | null;
  onChange: (next: string | number) => void;
};

const RICHNESS_HINT_THRESHOLD_WORDS = 25;

function wordCount(s: string): number {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/** A single Catchup question. Renders one of three shapes (open / closed / scale). */
export default function CatchupQuestion({
  question,
  index,
  total,
  value,
  onChange,
}: Props) {
  const titleId = useId();
  const t = useTranslations("catchup");

  return (
    <div className="catchup-question" aria-labelledby={titleId}>
      <div className="catchup-q-eyebrow">
        {t("questionEyebrow", {
          n: String(index + 1).padStart(2, "0"),
          total: String(total).padStart(2, "0"),
        })}
      </div>
      <h2 id={titleId} className="catchup-q-prompt">
        {t(`questions.${question.key}.prompt`)}
      </h2>

      {question.type === "open" ? (
        <OpenInput
          framing={t(`questions.${question.key}.framing`)}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      ) : null}

      {question.type === "closed" ? (
        <ClosedChoice
          name={question.key}
          questionKey={question.key}
          options={question.options}
          value={typeof value === "string" ? value : null}
          onChange={onChange}
        />
      ) : null}

      {question.type === "scale" ? (
        <ScaleInput
          min={question.min}
          max={question.max}
          lowLabel={t(`questions.${question.key}.lowLabel`)}
          highLabel={t(`questions.${question.key}.highLabel`)}
          value={typeof value === "number" ? value : null}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Open
// ────────────────────────────────────────────────────────────────────

function OpenInput({
  framing,
  value,
  onChange,
}: {
  framing?: string;
  value: string;
  onChange: (s: string) => void;
}) {
  const id = useId();
  const t = useTranslations("catchup");
  const words = wordCount(value);
  const showHint = words < RICHNESS_HINT_THRESHOLD_WORDS;

  return (
    <div className="catchup-open">
      {framing ? (
        <p className="catchup-open-framing">{framing}</p>
      ) : null}
      <textarea
        id={id}
        className="catchup-open-input"
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        rows={3}
        aria-describedby={showHint ? `${id}-hint` : undefined}
      />
      <div
        id={`${id}-hint`}
        className="catchup-open-hint"
        aria-hidden={!showHint}
        data-visible={showHint || undefined}
      >
        {t("openHint")}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Closed
// ────────────────────────────────────────────────────────────────────

function ClosedChoice({
  name,
  questionKey,
  options,
  value,
  onChange,
}: {
  name: string;
  questionKey: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("catchup");
  return (
    <ul className="catchup-closed" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const checked = value === opt.value;
        const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(opt.value);
          }
        };
        return (
          <li key={opt.value} className="catchup-closed-row">
            <button
              type="button"
              role="radio"
              aria-checked={checked}
              className={[
                "catchup-closed-btn",
                checked ? "is-checked" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(opt.value)}
              onKeyDown={onKey}
            >
              <span>{t(`questions.${questionKey}.options.${opt.value}`)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scale — hairline ticks, current value as serif italic numeral to the right
// ────────────────────────────────────────────────────────────────────

function ScaleInput({
  min,
  max,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const labelId = useId();
  const t = useTranslations("catchup");
  const ticks: number[] = [];
  for (let i = min; i <= max; i++) ticks.push(i);

  const setClamped = (n: number) => {
    onChange(Math.max(min, Math.min(max, n)));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = value ?? Math.floor((min + max) / 2);
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setClamped(v + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setClamped(v - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setClamped(min);
    } else if (e.key === "End") {
      e.preventDefault();
      setClamped(max);
    }
  };

  return (
    <div className="catchup-scale" aria-labelledby={labelId}>
      <span id={labelId} className="vh-legend">
        {t("scaleLegend", { low: lowLabel, high: highLabel })}
      </span>
      <div className="catchup-scale-row">
        <div
          className="catchup-scale-ticks"
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-valuetext={
            value === null
              ? t("noValue")
              : t("valueOf", { value, max })
          }
          onKeyDown={onKey}
        >
          {ticks.map((n) => {
            const isOn = value !== null && n === value;
            return (
              <button
                key={n}
                type="button"
                tabIndex={-1}
                aria-label={String(n)}
                className={[
                  "catchup-scale-tick",
                  isOn ? "is-on" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setClamped(n)}
              />
            );
          })}
        </div>
        <span className="catchup-scale-value" aria-hidden="true">
          {value ?? "—"}
        </span>
      </div>
      <div className="catchup-scale-ends" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

"use client";

import { useId, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Show a live word count beneath the field. */
  showWordCount?: boolean;
  invalid?: boolean;
};

function wordCount(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Token-mapped textarea + optional word-count meta. */
export default function Textarea({
  className,
  showWordCount,
  invalid,
  value,
  defaultValue,
  ...rest
}: TextareaProps) {
  const captionId = useId();
  const liveValue =
    typeof value === "string"
      ? value
      : typeof defaultValue === "string"
        ? defaultValue
        : "";
  const n = wordCount(liveValue);

  return (
    <div className="textarea-wrap">
      <textarea
        {...rest}
        value={value}
        defaultValue={defaultValue}
        className={[
          "field-input field-textarea",
          invalid ? "is-invalid" : null,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={invalid || undefined}
        aria-describedby={showWordCount ? captionId : rest["aria-describedby"]}
      />
      {showWordCount ? (
        <div className="textarea-meta" id={captionId}>
          <span className="textarea-meta-left" />
          <span className="textarea-meta-right">
            {n} {n === 1 ? "word" : "words"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

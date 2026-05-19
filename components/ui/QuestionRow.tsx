"use client";

import { type ReactNode } from "react";

type QuestionRowProps = {
  id: string;
  number: string;
  title: string;
  skipped: boolean;
  onToggleSkip: () => void;
  children: ReactNode;
};

/** Number + title + skip button + input slot. The grammar of every question. */
export default function QuestionRow({
  id,
  number,
  title,
  skipped,
  onToggleSkip,
  children,
}: QuestionRowProps) {
  return (
    <div
      className={["question-row", skipped ? "is-skipped" : null]
        .filter(Boolean)
        .join(" ")}
      id={`qrow-${id}`}
    >
      <div className="question-head">
        <div className="question-head-left">
          <span className="question-number mono">{number}</span>
          {skipped ? (
            <span className="question-skipped serif-i">skipped</span>
          ) : null}
        </div>
        <button
          type="button"
          className="question-skip mono"
          onClick={onToggleSkip}
          aria-pressed={skipped}
        >
          {skipped ? "UNDO" : "SKIP"}
        </button>
      </div>
      <h3 className="question-title serif">{title}</h3>
      {!skipped ? <div className="question-body">{children}</div> : null}
    </div>
  );
}

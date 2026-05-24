"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATCHUP_QUESTIONS,
  type CatchupAnswers,
  type CatchupQuestion as Question,
} from "@/lib/catchup-questions";
import CatchupQuestion from "@/components/room/CatchupQuestion";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import ReportMock from "@/components/figures/ReportMock";
import { getBlock, type BlockSlug } from "@/lib/blocks";

type Shifted = { slug: BlockSlug; deltaWeight: number; weight: number };

type SubmitResponse = {
  summary: string[];
  shifted: Shifted[];
};

type Props = {
  /** The ISO week number being captured. */
  weekNumber: number;
};

type Phase = "cover" | "question" | "submitting" | "summary";

export default function CatchupRunner({ weekNumber }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("cover");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<CatchupAnswers>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  const total = CATCHUP_QUESTIONS.length;
  const current: Question = CATCHUP_QUESTIONS[index];
  const isLast = index === total - 1;
  const weekLabel = `WEEK ${String(weekNumber).padStart(2, "0")}`;

  const progress = useMemo(() => {
    if (phase === "cover") return 0;
    if (phase === "summary") return 1;
    return (index + 1) / total;
  }, [phase, index, total]);

  function setCurrentAnswer(v: string | number) {
    setAnswers((prev) => ({ ...prev, [current.key]: v }));
  }

  function hasAnswerFor(q: Question, v: unknown): boolean {
    if (q.type === "scale") return typeof v === "number";
    return typeof v === "string" && v.trim().length > 0;
  }
  const canAdvance = hasAnswerFor(current, answers[current.key]);

  function onNext() {
    if (!canAdvance) return;
    if (isLast) return void submit();
    setIndex((i) => i + 1);
  }

  function onBack() {
    if (index === 0) {
      setPhase("cover");
      return;
    }
    setIndex((i) => i - 1);
  }

  async function submit() {
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/catchup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ week_number: weekNumber, answers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "could not submit catchup");
      }
      const data = (await res.json()) as SubmitResponse;
      setResult(data);
      setPhase("summary");
      // Background refresh so the rest of Room reflects the new state.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setPhase("question");
    }
  }

  return (
    <div className="catchup-runner">
      {/* Progress strip — hidden on the cover; full on the summary. */}
      <div
        className="catchup-progress"
        aria-hidden={phase === "cover" || undefined}
      >
        <span
          className="catchup-progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {phase === "cover" ? (
        <CoverScreen
          weekLabel={weekLabel}
          onBegin={() => setPhase("question")}
        />
      ) : null}

      {(phase === "question" || phase === "submitting") && current ? (
        <div className="catchup-stage">
          <CatchupQuestion
            question={current}
            value={(answers[current.key] as string | number | null) ?? null}
            onChange={setCurrentAnswer}
          />

          {error ? (
            <p className="catchup-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="catchup-controls">
            <button
              type="button"
              className="catchup-back"
              onClick={onBack}
              aria-label="previous question"
            >
              <span aria-hidden="true">←</span>
              <span>back</span>
            </button>

            <button
              type="button"
              className={[
                "catchup-next",
                !canAdvance ? "is-disabled" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={onNext}
              disabled={!canAdvance || phase === "submitting"}
            >
              <span>
                {phase === "submitting"
                  ? "submitting"
                  : isLast
                    ? "close the week"
                    : "next"}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : null}

      {phase === "summary" && result ? (
        <SummaryScreen
          weekLabel={weekLabel}
          summary={result.summary}
          shifted={result.shifted}
        />
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Cover screen
// ────────────────────────────────────────────────────────────────────

function CoverScreen({
  weekLabel,
  onBegin,
}: {
  weekLabel: string;
  onBegin: () => void;
}) {
  return (
    <div className="catchup-cover">
      <div className="catchup-cover-eyebrow">CATCHUP · {weekLabel}</div>
      <h1 className="catchup-cover-h">
        What stayed with you<span className="it">?</span>
      </h1>
      <p className="catchup-cover-lede">
        Eight short questions. Honest is better than long. Answers refine
        the reading; nothing in here is graded.
      </p>
      <div className="catchup-cover-cta">
        <button
          type="button"
          className="cta"
          onClick={onBegin}
        >
          <span>Begin</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Summary screen
// ────────────────────────────────────────────────────────────────────

function SummaryScreen({
  weekLabel,
  summary,
  shifted,
}: {
  weekLabel: string;
  summary: string[];
  shifted: Shifted[];
}) {
  const rows = shifted.slice(0, 5).map((s) => {
    const block = getBlock(s.slug);
    const pct = Math.round(s.weight * 100);
    return {
      k: block.subtitle,
      pct: `.${String(Math.max(0, Math.min(99, pct))).padStart(2, "0")}`,
      width: pct,
    };
  });

  return (
    <div className="catchup-summary">
      <div className="catchup-summary-eyebrow">{weekLabel} · READ BACK</div>
      <h2 className="catchup-summary-h">
        The week, <span className="it">in your own words.</span>
      </h2>
      <div className="catchup-summary-body">
        {summary.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="catchup-summary-figure">
          <ReportMock
            caseLabel={`case · ${weekLabel.toLowerCase()}`}
            prepared="just refined"
            rows={rows}
            footerLabel="readings shifted"
            footerValue={`${shifted.length} of 12`}
          />
        </div>
      ) : null}

      <div className="catchup-summary-cta">
        <CTA href="/room">Return to the room</CTA>
        <RowLink href="/case-file">read it again in the case file</RowLink>
      </div>
    </div>
  );
}

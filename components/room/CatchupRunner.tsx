"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import SafetyResponse from "@/components/room/SafetyResponse";
import { getBlock, type BlockSlug } from "@/lib/blocks";

type Shifted = { slug: BlockSlug; weight: number; deltaWeight: number };

type CatchupFeedback = {
  consider: string | null;
  recommend: "session" | "report" | "professional_care" | "rest" | null;
  recommend_reason: string | null;
};

type PollResponse = {
  id: string;
  status: "processing" | "ready" | "failed";
  summary: string[];
  feedback: CatchupFeedback | null;
  shifted: Shifted[];
};

type Props = {
  /** The ISO week number being captured. */
  weekNumber: number;
  /** Whether the user is currently subscribed. Drives recommend links. */
  isSubscribed: boolean;
};

type Phase = "cover" | "question" | "submitting" | "processing" | "summary";

export default function CatchupRunner({ weekNumber, isSubscribed }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("cover");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<CatchupAnswers>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PollResponse | null>(null);
  const pollHandle = useRef<number | null>(null);

  const total = CATCHUP_QUESTIONS.length;
  const current: Question = CATCHUP_QUESTIONS[index];
  const isLast = index === total - 1;
  const weekLabel = `WEEK ${String(weekNumber).padStart(2, "0")}`;

  const progress = useMemo(() => {
    if (phase === "cover") return 0;
    if (phase === "summary") return 1;
    if (phase === "processing") return 1;
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
      const data = (await res.json()) as { catchup_id: string };
      setPhase("processing");
      startPolling(data.catchup_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setPhase("question");
    }
  }

  function startPolling(id: string) {
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/catchup?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = (await res.json()) as PollResponse;
          if (data.status === "ready") {
            setResult(data);
            setPhase("summary");
            router.refresh();
            return;
          }
          if (data.status === "failed") {
            setError("the catchup is on file. the summary will arrive later.");
            setResult({
              ...data,
              summary:
                data.summary.length > 0
                  ? data.summary
                  : [
                      "The catchup is on file. The reading has been updated quietly; the longer summary will arrive on the next pass.",
                    ],
              feedback: data.feedback,
              shifted: data.shifted ?? [],
            });
            setPhase("summary");
            router.refresh();
            return;
          }
        }
      } catch {
        // ignore — retry
      }
      if (attempts > 60) {
        // Give up after ~2 minutes; the page can be reloaded.
        setError(
          "the room is briefly quiet — your catchup is on file. refresh in a minute.",
        );
        setPhase("question");
        return;
      }
      pollHandle.current = window.setTimeout(tick, 2000);
    };
    void tick();
  }

  useEffect(() => {
    return () => {
      if (pollHandle.current) window.clearTimeout(pollHandle.current);
    };
  }, []);

  return (
    <div className="catchup-runner">
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

      {phase === "processing" ? (
        <div className="catchup-processing">
          <p className="catchup-processing-line">
            <em>the week is being read.</em>
          </p>
        </div>
      ) : null}

      {phase === "summary" && result ? (
        <SummaryScreen
          weekLabel={weekLabel}
          summary={result.summary}
          shifted={result.shifted}
          feedback={result.feedback}
          isSubscribed={isSubscribed}
        />
      ) : null}
    </div>
  );
}

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
        <button type="button" className="cta" onClick={onBegin}>
          <span>Begin</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
}

function SummaryScreen({
  weekLabel,
  summary,
  shifted,
  feedback,
  isSubscribed,
}: {
  weekLabel: string;
  summary: string[];
  shifted: Shifted[];
  feedback: CatchupFeedback | null;
  isSubscribed: boolean;
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

  const isProfessionalCare = feedback?.recommend === "professional_care";

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

      {isProfessionalCare ? (
        <div className="catchup-summary-feedback">
          <SafetyResponse context="catchup" showResources />
        </div>
      ) : feedback ? (
        <FeedbackBlock feedback={feedback} isSubscribed={isSubscribed} />
      ) : null}

      <div className="catchup-summary-cta">
        <CTA href="/room">Return to the room</CTA>
        <RowLink href="/case-file">read it again in the case file</RowLink>
      </div>
    </div>
  );
}

function FeedbackBlock({
  feedback,
  isSubscribed,
}: {
  feedback: CatchupFeedback;
  isSubscribed: boolean;
}) {
  if (!feedback.consider && !feedback.recommend) return null;

  return (
    <div className="catchup-feedback">
      {feedback.consider ? (
        <div className="catchup-feedback-consider">
          <div className="eyebrow">SOMETHING TO HOLD</div>
          <p className="serif-i">{feedback.consider}</p>
        </div>
      ) : null}

      {feedback.recommend === "rest" && feedback.recommend_reason ? (
        <p className="catchup-feedback-rest">
          <em>{feedback.recommend_reason}</em>
        </p>
      ) : null}

      {feedback.recommend === "session" ? (
        <RowLink href={isSubscribed ? "/consulting" : "/subscribe/confirm"}>
          {isSubscribed
            ? "enter the consulting room"
            : "open the consulting room"}
        </RowLink>
      ) : null}

      {feedback.recommend === "report" ? (
        <RowLink href={isSubscribed ? "/readings#report" : "/reports/confirm"}>
          request a clinical report
        </RowLink>
      ) : null}
    </div>
  );
}

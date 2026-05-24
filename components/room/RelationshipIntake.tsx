"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RELATIONSHIP_INTAKE_QUESTIONS,
  isComplete,
  type RelationshipAnswers,
  type RelationshipQuestion,
} from "@/lib/relationship-intake-questions";

// RelationshipIntake — one question per screen, mirrors the Catchup
// runner's grammar (cover screen → questions → closing). Stored locally
// until the user finishes; posts once at the end so partial answers
// don't accidentally land in the inviter's reading.
//
// This component never references the inviter — the prompts are framed
// in the invitee's voice ("How long have you known each other?"). The
// only person it names is the connection itself.

type Props = {
  token: string;
  inviterFirstName: string;
};

type Stage = "cover" | "running" | "closing";

export default function RelationshipIntake({ token, inviterFirstName }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("cover");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<RelationshipAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = RELATIONSHIP_INTAKE_QUESTIONS.length;
  const progress = useMemo(
    () => (stage === "closing" ? 1 : index / total),
    [index, stage, total],
  );

  const current: RelationshipQuestion | null =
    stage === "running" ? RELATIONSHIP_INTAKE_QUESTIONS[index] ?? null : null;

  function setAnswer(key: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    if (!current) return;
    const v = answers[current.key];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      setError("a moment with this one before moving on.");
      return;
    }
    setError(null);
    if (index + 1 >= total) {
      setStage("closing");
      submit();
    } else {
      setIndex((i) => i + 1);
    }
  }

  function back() {
    if (index === 0) {
      setStage("cover");
      return;
    }
    setError(null);
    setIndex((i) => i - 1);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        if (!isComplete(answers)) {
          setError("a question is still open. one moment.");
          setStage("running");
          return;
        }
        const res = await fetch("/api/connections/relationship-intake", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, answers }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(humanError(data?.error));
          setStage("running");
          return;
        }
        // Stay on the closing screen — show the thank-you state.
      } catch {
        setError("could not save");
        setStage("running");
      }
    });
  }

  return (
    <section className="relintake">
      <div className="relintake-progress" aria-hidden="true">
        <span
          className="relintake-progress-fill"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {stage === "cover" ? (
        <CoverScreen
          inviterFirstName={inviterFirstName}
          onBegin={() => {
            setStage("running");
            setIndex(0);
            setError(null);
          }}
        />
      ) : null}

      {stage === "running" && current ? (
        <QuestionScreen
          question={current}
          value={answers[current.key]}
          onChange={(v) => setAnswer(current.key, v)}
          onNext={next}
          onBack={back}
          error={error}
          isFirst={index === 0}
          isLast={index + 1 >= total}
        />
      ) : null}

      {stage === "closing" ? (
        <ClosingScreen
          isPending={isPending}
          inviterFirstName={inviterFirstName}
          onReturn={() => {
            router.refresh();
          }}
          error={error}
        />
      ) : null}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Screens
// ────────────────────────────────────────────────────────────────────

function CoverScreen({
  inviterFirstName,
  onBegin,
}: {
  inviterFirstName: string;
  onBegin: () => void;
}) {
  return (
    <div className="relintake-cover">
      <p className="eyebrow">RELATIONSHIP INTAKE</p>
      <h1 className="relintake-h">
        What you say about{" "}
        <span className="it">{inviterFirstName.toLowerCase()}</span> stays
        between you and the analyst.
      </h1>
      <p className="relintake-lede">
        Twelve short questions. About five minutes. The answers feed{" "}
        {inviterFirstName.toLowerCase()}&apos;s reading; they will not see
        what you wrote, and you will not see what it produces.
      </p>
      <button type="button" className="relintake-cta" onClick={onBegin}>
        <span>begin</span>
        <span className="serif-i" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}

function QuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onBack,
  error,
  isFirst,
  isLast,
}: {
  question: RelationshipQuestion;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="relintake-q">
      <h2 className="relintake-q-prompt">{question.prompt}</h2>

      {question.type === "closed" ? (
        <ul className="relintake-choices">
          {question.options.map((o) => {
            const checked = value === o.value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  className={
                    "relintake-choice" + (checked ? " is-checked" : "")
                  }
                  onClick={() => onChange(o.value)}
                  aria-pressed={checked}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {question.type === "open" ? (
        <OpenInput
          question={question.key}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          hint={question.hint}
          hintWordsBelow={question.hintWordsBelow}
        />
      ) : null}

      {question.type === "scale" ? (
        <div className="relintake-scale">
          <div className="relintake-scale-ticks">
            {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
              const tickValue = question.min + i;
              const on = typeof value === "number" && tickValue <= value;
              return (
                <button
                  key={tickValue}
                  type="button"
                  className={"relintake-scale-tick" + (on ? " is-on" : "")}
                  onClick={() => onChange(tickValue)}
                  aria-label={`scale ${tickValue}`}
                />
              );
            })}
            <span className="relintake-scale-value">
              {typeof value === "number" ? value : "—"}
            </span>
          </div>
          <div className="relintake-scale-ends">
            <span>{question.labels.min}</span>
            <span>{question.labels.max}</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="relintake-error">{error}</p> : null}

      <div className="relintake-q-actions">
        <button
          type="button"
          className="relintake-back"
          onClick={onBack}
          disabled={isFirst ? false : undefined}
        >
          {isFirst ? "back to cover" : "back"}
        </button>
        <button type="button" className="relintake-next" onClick={onNext}>
          <span>{isLast ? "finish" : "next"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function OpenInput({
  question,
  value,
  onChange,
  hint,
  hintWordsBelow,
}: {
  question: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  hintWordsBelow?: number;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const showHint = hint && (hintWordsBelow === undefined || wordCount < hintWordsBelow);
  return (
    <div className="relintake-open">
      <textarea
        id={`relintake-${question}`}
        className="relintake-open-input"
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      {showHint ? <p className="relintake-hint">{hint}</p> : null}
    </div>
  );
}

function ClosingScreen({
  isPending,
  inviterFirstName,
  onReturn,
  error,
}: {
  isPending: boolean;
  inviterFirstName: string;
  onReturn: () => void;
  error: string | null;
}) {
  return (
    <div className="relintake-closing">
      {isPending ? (
        <p className="relintake-h-italic">
          a moment — the answers are being recorded.
        </p>
      ) : error ? (
        <>
          <p className="relintake-h-italic">{error}</p>
          <button type="button" className="relintake-cta" onClick={onReturn}>
            <span>try again</span>
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : (
        <>
          <h2 className="relintake-h">
            That is enough <span className="it">for now.</span>
          </h2>
          <p className="relintake-lede">
            What you said about {inviterFirstName.toLowerCase()} will inform
            their reading from their next session forward. They will not see
            it; you will not see what it produces.
          </p>
          <p className="relintake-lede serif-i">
            you can close this window.
          </p>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

function humanError(code: string | undefined | null): string {
  switch (code) {
    case "incomplete_answers":
      return "a question is still open. one moment.";
    case "invalid_answers":
      return "something did not parse — please check the answers.";
    case "connection_pending":
    case "connection_declined":
    case "connection_expired":
    case "connection_ended":
      return "this invite is no longer accepting answers.";
    case "invite_not_found":
      return "this invite link is not recognised.";
    default:
      return "could not save the answers.";
  }
}

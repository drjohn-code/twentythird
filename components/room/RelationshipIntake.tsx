"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("invite");
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
      setError(t("relIntake.errors.unanswered"));
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
          setError(t("relIntake.errors.questionOpen"));
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
          setError(humanError(data?.error, t));
          setStage("running");
          return;
        }
        // Stay on the closing screen — show the thank-you state.
      } catch {
        setError(t("relIntake.errors.couldNotSave"));
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
  const t = useTranslations("invite");
  return (
    <div className="relintake-cover">
      <p className="eyebrow">{t("relIntake.eyebrow")}</p>
      <h1 className="relintake-h">
        {t.rich("relIntake.cover.headline", {
          name: inviterFirstName.toLowerCase(),
          it: (chunks) => <span className="it">{chunks}</span>,
        })}
      </h1>
      <p className="relintake-lede">
        {t("relIntake.cover.lede", { name: inviterFirstName.toLowerCase() })}
      </p>
      <button type="button" className="relintake-cta" onClick={onBegin}>
        <span>{t("relIntake.begin")}</span>
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
  const t = useTranslations("invite");
  return (
    <div className="relintake-q">
      <h2 className="relintake-q-prompt">
        {t(`relIntake.questions.${question.key}.prompt`)}
      </h2>

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
                  {t(`relIntake.questions.${question.key}.options.${o.value}`)}
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
                  aria-label={t("relIntake.scaleAria", { value: tickValue })}
                />
              );
            })}
            <span className="relintake-scale-value">
              {typeof value === "number" ? value : "—"}
            </span>
          </div>
          <div className="relintake-scale-ends">
            <span>{t(`relIntake.questions.${question.key}.lowLabel`)}</span>
            <span>{t(`relIntake.questions.${question.key}.highLabel`)}</span>
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
          {isFirst ? t("relIntake.backToCover") : t("relIntake.back")}
        </button>
        <button type="button" className="relintake-next" onClick={onNext}>
          <span>{isLast ? t("relIntake.finish") : t("relIntake.next")}</span>
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
  const t = useTranslations("invite");
  return (
    <div className="relintake-closing">
      {isPending ? (
        <p className="relintake-h-italic">{t("relIntake.closing.recording")}</p>
      ) : error ? (
        <>
          <p className="relintake-h-italic">{error}</p>
          <button type="button" className="relintake-cta" onClick={onReturn}>
            <span>{t("relIntake.closing.tryAgain")}</span>
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : (
        <>
          <h2 className="relintake-h">
            {t.rich("relIntake.closing.headline", {
              it: (chunks) => <span className="it">{chunks}</span>,
            })}
          </h2>
          <p className="relintake-lede">
            {t("relIntake.closing.lede", {
              name: inviterFirstName.toLowerCase(),
            })}
          </p>
          <p className="relintake-lede serif-i">
            {t("relIntake.closing.closeWindow")}
          </p>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

function humanError(
  code: string | undefined | null,
  t: (key: string) => string,
): string {
  switch (code) {
    case "incomplete_answers":
      return t("relIntake.errors.questionOpen");
    case "invalid_answers":
      return t("relIntake.errors.invalidAnswers");
    case "connection_pending":
    case "connection_declined":
    case "connection_expired":
    case "connection_ended":
      return t("relIntake.errors.notAccepting");
    case "invite_not_found":
      return t("relIntake.errors.notFound");
    default:
      return t("relIntake.errors.couldNotSaveAnswers");
  }
}

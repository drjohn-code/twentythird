"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import InlineError from "@/components/ui/InlineError";
import {
  STEPS,
  TOTAL_STEPS,
  getStep,
  stepKey,
  type Field,
  type StepDef,
} from "@/lib/onboarding/steps";

type Props = {
  initialStep: number;
  initialCompletedSteps: number;
  initialData: Record<string, Record<string, unknown>>;
};

type AllData = Record<string, Record<string, unknown>>;

/**
 * Adapt a step's lede when an earlier optional step was skipped.
 * Kept in the client (not in steps.ts) so the data module stays clean.
 */
function adaptedLede(step: StepDef, data: AllData): string | undefined {
  if (step.id === 5) {
    const pattern = data.step_4?.pattern;
    if (!pattern || (typeof pattern === "string" && pattern.trim() === "")) {
      return "If a pattern came to mind, when did it first appear.";
    }
  }
  if (step.id === 7) {
    const figure = data.step_6?.figure;
    if (!figure || (typeof figure === "string" && figure.trim() === "")) {
      return "If a figure came to mind, what does their voice still say.";
    }
  }
  return step.lede;
}

function renderField(
  field: Field,
  value: unknown,
  onChange: (name: string, v: unknown) => void,
  errorId?: string,
) {
  const id = `onb-${field.name}`;
  const describedBy = [
    field.hint ? `${id}-hint` : null,
    errorId ?? null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  if (field.kind === "text") {
    return (
      <div className="auth-field onb-field" key={field.name}>
        <label htmlFor={id} className="eyebrow">
          {field.label}
        </label>
        <input
          id={id}
          name={field.name}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          maxLength={field.maxLength}
          required={field.required}
          aria-required={field.required || undefined}
          autoComplete={field.autoComplete ?? "off"}
          aria-describedby={describedBy}
        />
        {field.hint ? (
          <p id={`${id}-hint`} className="auth-hint">
            {field.hint}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div className="auth-field onb-field" key={field.name}>
        <label htmlFor={id} className="eyebrow">
          {field.label}
        </label>
        <textarea
          id={id}
          name={field.name}
          rows={field.rows ?? 4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          maxLength={field.maxLength}
          required={field.required}
          aria-required={field.required || undefined}
          aria-describedby={describedBy}
        />
        {field.hint ? (
          <p id={`${id}-hint`} className="auth-hint">
            {field.hint}
          </p>
        ) : null}
      </div>
    );
  }

  // select
  return (
    <div className="auth-field onb-field onb-select" key={field.name}>
      <label htmlFor={id} className="eyebrow">
        {field.label}
      </label>
      <div className="onb-select-wrap">
        <select
          id={id}
          name={field.name}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          aria-required={field.required || undefined}
          aria-describedby={describedBy}
        >
          <option value="" disabled>
            —
          </option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="onb-select-caret serif-i" aria-hidden="true">
          ↓
        </span>
      </div>
    </div>
  );
}

export default function OnboardingClient({
  initialStep,
  initialCompletedSteps,
  initialData,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<number>(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number>(
    initialCompletedSteps,
  );
  const [data, setData] = useState<AllData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const stepDef = useMemo(() => getStep(step), [step]);
  const stepAnswers = useMemo(() => {
    return (data[stepKey(step)] ?? {}) as Record<string, unknown>;
  }, [data, step]);

  function setAnswer(name: string, v: unknown) {
    setData((prev) => ({
      ...prev,
      [stepKey(step)]: {
        ...(prev[stepKey(step)] ?? {}),
        [name]: v,
      },
    }));
  }

  async function save(payload: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, answers: payload }),
      });
      if (!res.ok) {
        setError("Couldn't save that step. Try again.");
        setSaving(false);
        return false;
      }
      const body = (await res.json()) as {
        step: number;
        data: AllData;
      };
      setData(body.data);
      setCompletedSteps(Math.max(completedSteps, body.step));
      setSaving(false);
      return true;
    } catch {
      setError("Network error. Your answers are still here — try again.");
      setSaving(false);
      return false;
    }
  }

  async function complete(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) {
        setError("Couldn't finish onboarding. Try again.");
        setSaving(false);
        return false;
      }
      setSaving(false);
      return true;
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
      return false;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stepDef) return;

    // Client-side required check.
    for (const f of stepDef.fields) {
      if (f.required) {
        const v = stepAnswers[f.name];
        if (v === undefined || v === null || v === "") {
          setError("That field is required.");
          return;
        }
      }
    }

    startTransition(async () => {
      const ok = await save(stepAnswers);
      if (!ok) return;

      if (step >= TOTAL_STEPS) {
        const done = await complete();
        if (done) router.push("/");
        return;
      }

      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    });
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  if (!stepDef) return null;

  const lede = adaptedLede(stepDef, data);
  const errorId = error ? "onb-error" : undefined;
  const busy = saving || isPending;

  return (
    <main className="onb-shell">
      <div className="onb-progress" aria-label={`step ${step} of ${TOTAL_STEPS}`}>
        {STEPS.map((s) => (
          <span
            key={s.id}
            className={
              "onb-tick" +
              (s.id <= completedSteps ? " is-done" : "") +
              (s.id === step ? " is-current" : "")
            }
            aria-hidden="true"
          />
        ))}
      </div>

      <section className="onb-panel glass">
        <div className="eyebrow onb-eyebrow">{stepDef.eyebrow}</div>
        <h1 className="serif onb-headline">
          {stepDef.headline.map((seg, i) =>
            seg.italic ? (
              <em key={i}>{seg.text}</em>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </h1>
        {lede ? <p className="auth-lede onb-lede">{lede}</p> : null}

        {error ? <InlineError id={errorId}>{error}</InlineError> : null}

        <form onSubmit={handleSubmit} className="onb-form" noValidate>
          {stepDef.fields.map((f) =>
            renderField(f, stepAnswers[f.name], setAnswer, errorId),
          )}

          <div className="onb-divider" aria-hidden="true" />

          <div className="onb-foot">
            <button
              type="button"
              onClick={goBack}
              disabled={step <= 1 || busy}
              className="auth-rowlink auth-rowlink-button"
            >
              <span aria-hidden="true">←</span> back
            </button>
            <button
              type="submit"
              className="pill onb-continue"
              disabled={busy}
              aria-busy={busy || undefined}
            >
              <span>{step >= TOTAL_STEPS ? "Finish" : "Continue"}</span>
              {busy ? (
                <em className="auth-submit-pending">…</em>
              ) : (
                <span aria-hidden="true"> →</span>
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

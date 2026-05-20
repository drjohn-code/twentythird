"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import MultiSelect from "@/components/ui/MultiSelect";
import QuestionRow from "@/components/ui/QuestionRow";
import RadioGroup from "@/components/ui/RadioGroup";
import Scale from "@/components/ui/Scale";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import RowLink from "@/components/ui/RowLink";
import CTAGhost from "@/components/ui/CTAGhost";
import SaveIndicator from "@/components/onboarding/SaveIndicator";
import {
  saveStep,
  submitIntake,
  type SaveStepResult,
} from "@/app/onboarding/intake/[step]/actions";
import {
  DASHBOARD_PATH,
  INTAKE_INTRO_PATH,
} from "@/lib/onboarding/routing";
import { SKIPPED_KEY } from "@/lib/onboarding/schema";
import type {
  AnswerValue,
  CloseQuestion,
  OpenQuestion,
  StepDef,
  StepPayload,
} from "@/lib/types/intake";

type StepFormProps = {
  step: StepDef;
  initialPayload: StepPayload;
  isLast: boolean;
};

const AUTOSAVE_MS = 800;
const SUBMIT_HOLD_MS = 1200;

type Values = Record<string, AnswerValue | undefined>;

function defaultFor(q: CloseQuestion | OpenQuestion): AnswerValue {
  if (q.kind === "multi") return [];
  return null;
}

/** True if a value is meaningful enough to persist. */
function isEmptyAnswer(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v.length === 0) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function reduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function StepForm({
  step,
  initialPayload,
  isLast,
}: StepFormProps) {
  const router = useRouter();
  const all: (CloseQuestion | OpenQuestion)[] = useMemo(
    () => [...step.closeQuestions, ...step.openQuestions],
    [step],
  );

  // Persisted shape:
  //   answered  → initialPayload[qid] holds the value
  //   skipped   → qid appears in initialPayload.skipped
  //   absent / null → unanswered (null is tolerated for legacy rows)
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {};
    for (const q of all) {
      const saved = initialPayload[q.id];
      if (saved === undefined || saved === null) {
        v[q.id] = defaultFor(q);
      } else {
        v[q.id] = saved as AnswerValue;
      }
    }
    return v;
  });

  const [skipped, setSkipped] = useState<Record<string, boolean>>(() => {
    const rawSkipped = initialPayload[SKIPPED_KEY];
    const skipSet = new Set<string>(
      Array.isArray(rawSkipped) ? (rawSkipped as string[]) : [],
    );
    const s: Record<string, boolean> = {};
    for (const q of all) {
      s[q.id] = skipSet.has(q.id);
    }
    return s;
  });

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [completedThrough, setCompletedThrough] = useState<number>(0);
  const [submitting, startSubmit] = useTransition();
  const [submitLabel, setSubmitLabel] = useState<"normal" | "reading">("normal");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const buildPayload = useCallback((): StepPayload => {
    const out: StepPayload = {};
    const skipList: string[] = [];
    for (const q of all) {
      if (skipped[q.id]) {
        skipList.push(q.id);
        continue;
      }
      const v = values[q.id];
      if (isEmptyAnswer(v)) continue;
      out[q.id] = v as AnswerValue;
    }
    if (skipList.length > 0) {
      out[SKIPPED_KEY] = skipList;
    }
    return out;
  }, [all, values, skipped]);

  const persist = useCallback(async () => {
    setSaveState("saving");
    const res: SaveStepResult = await saveStep(step.number, buildPayload());
    if (res.ok) {
      setSaveState("saved");
      setSavedAt(new Date(res.savedAt));
      setCompletedThrough(res.completedThrough);
      isDirtyRef.current = false;
    } else {
      setSaveState("error");
    }
  }, [step.number, buildPayload]);

  // Debounced autosave on change.
  useEffect(() => {
    if (!isDirtyRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist();
    }, AUTOSAVE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values, skipped, persist]);

  function markDirty() {
    isDirtyRef.current = true;
    if (saveState !== "saving") setSaveState("idle");
  }

  function setValue(qid: string, v: AnswerValue) {
    setValues((prev) => ({ ...prev, [qid]: v }));
    if (skipped[qid]) setSkipped((prev) => ({ ...prev, [qid]: false }));
    markDirty();
  }

  function toggleSkip(qid: string) {
    setSkipped((prev) => ({ ...prev, [qid]: !prev[qid] }));
    markDirty();
  }

  async function flushBeforeNavigate(): Promise<void> {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isDirtyRef.current && saveState !== "error") return;
    await persist();
  }

  async function onContinue() {
    await flushBeforeNavigate();
    if (saveState === "error") return;
    router.push(`${INTAKE_INTRO_PATH}/${step.number + 1}`);
  }

  async function onBack() {
    await flushBeforeNavigate();
    router.push(`${INTAKE_INTRO_PATH}/${step.number - 1}`);
  }

  async function onSaveAndExit(e: React.MouseEvent) {
    e.preventDefault();
    await flushBeforeNavigate();
    router.push(DASHBOARD_PATH);
  }

  function onSubmitFinal() {
    startSubmit(async () => {
      await flushBeforeNavigate();
      if (saveState === "error") return;
      setSubmitLabel("reading");
      const res = await submitIntake();
      if (!res.ok) {
        setSubmitLabel("normal");
        setSaveState("error");
        return;
      }
      // Deliberate hold so the moment feels weighted — skipped under
      // prefers-reduced-motion (CSS already kills the rest of the
      // animation language).
      if (!reduceMotion()) {
        await new Promise((r) => setTimeout(r, SUBMIT_HOLD_MS));
      }
      router.push(DASHBOARD_PATH);
    });
  }

  function renderInput(q: CloseQuestion | OpenQuestion) {
    if (skipped[q.id]) return null;
    if (q.kind === "single") {
      const v = (values[q.id] ?? null) as string | null;
      return (
        <RadioGroup
          name={q.id}
          legend={q.title}
          options={q.options}
          value={v}
          onChange={(val) => setValue(q.id, val)}
          layout={q.layout ?? "vertical"}
        />
      );
    }
    if (q.kind === "multi") {
      const v = (values[q.id] ?? []) as string[];
      return (
        <MultiSelect
          legend={q.title}
          options={q.options}
          value={v}
          onChange={(next) => setValue(q.id, next)}
          max={q.max}
        />
      );
    }
    if (q.kind === "scale") {
      const v = (values[q.id] ?? null) as number | null;
      return (
        <Scale
          legend={q.title}
          value={v}
          min={q.min}
          max={q.max}
          lowLabel={q.lowLabel}
          highLabel={q.highLabel}
          onChange={(n) => setValue(q.id, n)}
        />
      );
    }
    if (q.kind === "number") {
      const v = values[q.id];
      const str =
        v === null || v === undefined ? "" : String(v as number);
      return (
        <div className="number-field">
          <Input
            type="number"
            inputMode="numeric"
            min={q.min}
            max={q.max}
            value={str}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setValue(q.id, null);
                return;
              }
              const n = Number(raw);
              if (Number.isFinite(n)) setValue(q.id, n);
            }}
            className="number-input"
          />
          <span className="number-unit mono">{q.unit}</span>
        </div>
      );
    }
    // open
    const v = (values[q.id] ?? "") as string;
    return (
      <Textarea
        showWordCount
        value={v}
        onChange={(e) => setValue(q.id, e.target.value)}
        placeholder=""
        aria-label={q.title}
      />
    );
  }

  return (
    <div className="step-form">
      <div className="step-form-meta">
        <SaveIndicator state={saveState} savedAt={savedAt} />
      </div>

      <section className="question-group">
        <header className="vh question-group-head">
          <span className="lhs">
            <span>CLOSE QUESTIONS</span>{" "}
            <em>pick what&apos;s true</em>
          </span>
          <span className="mono">
            {String(step.closeQuestions.length).padStart(2, "0")} questions
          </span>
        </header>
        <div className="question-group-body">
          {step.closeQuestions.map((q) => (
            <QuestionRow
              key={q.id}
              id={q.id}
              number={q.number}
              title={q.title}
              skipped={!!skipped[q.id]}
              onToggleSkip={() => toggleSkip(q.id)}
            >
              {renderInput(q)}
            </QuestionRow>
          ))}
        </div>
      </section>

      {step.openQuestions.length > 0 ? (
        <section className="question-group">
          <header className="vh question-group-head">
            <span className="lhs">
              <span>OPEN QUESTIONS</span>{" "}
              <em>write what surfaces</em>
            </span>
            <span className="mono">
              {String(step.openQuestions.length).padStart(2, "0")} questions
            </span>
          </header>
          <div className="question-group-body">
            {step.openQuestions.map((q) => (
              <QuestionRow
                key={q.id}
                id={q.id}
                number={q.number}
                title={q.title}
                skipped={!!skipped[q.id]}
                onToggleSkip={() => toggleSkip(q.id)}
              >
                {renderInput(q)}
              </QuestionRow>
            ))}
          </div>
        </section>
      ) : null}

      <div className="step-foot-divider" aria-hidden="true" />

      <div className="step-foot">
        <CTAGhost href={DASHBOARD_PATH} prefix="or">
          <button
            type="button"
            onClick={onSaveAndExit}
            className="step-save-exit"
          >
            save and return later
          </button>
        </CTAGhost>

        <div className="step-foot-actions">
          {step.number > 1 ? (
            <RowLink
              href={`${INTAKE_INTRO_PATH}/${step.number - 1}`}
              arrow="left"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  void onBack();
                }}
                className="step-back-btn"
              >
                Step {step.number - 1}
              </button>
            </RowLink>
          ) : (
            <span />
          )}

          {isLast ? (
            <button
              type="button"
              className="pill step-continue"
              onClick={onSubmitFinal}
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              {submitLabel === "reading" ? (
                <em className="serif-i">reading…</em>
              ) : (
                <>
                  <span>Save &amp; submit</span>
                  <span aria-hidden="true" className="serif-i">
                    →
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="pill step-continue"
              onClick={onContinue}
              disabled={saveState === "saving"}
              aria-busy={saveState === "saving" || undefined}
            >
              <span>Continue to Step {step.number + 1}</span>
              <span aria-hidden="true" className="serif-i">
                →
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Surface server-side completion bumps to consumers if needed */}
      <span className="vh" aria-hidden="true" data-completed-through={completedThrough} />
    </div>
  );
}

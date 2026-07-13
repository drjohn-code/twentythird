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
import { useTranslations } from "next-intl";
import MultiSelect from "@/components/ui/MultiSelect";
import QuestionRow from "@/components/ui/QuestionRow";
import RadioGroup from "@/components/ui/RadioGroup";
import Scale from "@/components/ui/Scale";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import RowLink from "@/components/ui/RowLink";
import SaveExitModalTrigger from "@/components/onboarding/SaveExitModal";
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
import {
  assertNever,
  type AnswerValue,
  type CloseQuestion,
  type OpenQuestion,
  type StepDef,
  type StepPayload,
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
  if (q.kind === "per_option_number") return {};
  return null;
}

/** True if a value is meaningful enough to persist. */
function isEmptyAnswer(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && v.length === 0) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && Object.keys(v).length === 0) return true;
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
  const t = useTranslations("onboarding");
  const ti = useTranslations("intake");
  const slug = step.slug;

  // Resolve the localized display label for a question field by its stable
  // id. Storage keys, option values, validation and the lib data are
  // untouched — only the rendered text comes from the catalog.
  const qTitle = useCallback(
    (id: string) => ti(`questions.${slug}.${id}.title`),
    [ti, slug],
  );
  const qSubtitle = useCallback(
    (id: string) => ti(`questions.${slug}.${id}.subtitle`),
    [ti, slug],
  );
  // Same option `value`s, localized labels.
  const localizedOptions = useCallback(
    (id: string, options: { value: string; label: string }[]) =>
      options.map((o) => ({
        value: o.value,
        label: ti(`questions.${slug}.${id}.options.${o.value}`),
      })),
    [ti, slug],
  );

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
      router.refresh();
    });
  }

  function renderInput(q: CloseQuestion | OpenQuestion) {
    if (skipped[q.id]) return null;
    if (q.kind === "single") {
      const v = (values[q.id] ?? null) as string | null;
      return (
        <RadioGroup
          name={q.id}
          legend={qTitle(q.id)}
          options={localizedOptions(q.id, q.options)}
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
          legend={qTitle(q.id)}
          options={localizedOptions(q.id, q.options)}
          value={v}
          onChange={(next) => setValue(q.id, next)}
          max={q.maxSelections}
        />
      );
    }
    if (q.kind === "scale") {
      const v = (values[q.id] ?? null) as number | null;
      return (
        <Scale
          legend={qTitle(q.id)}
          value={v}
          min={q.min}
          max={q.max}
          lowLabel={ti(`questions.${slug}.${q.id}.lowLabel`)}
          highLabel={ti(`questions.${slug}.${q.id}.highLabel`)}
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
          <span className="number-unit mono">
            {ti(`questions.${slug}.${q.id}.unit`)}
          </span>
        </div>
      );
    }
    if (q.kind === "per_option_number") {
      const parent = all.find((sib) => sib.id === q.dependsOn);
      const parentOptions =
        parent && "options" in parent ? parent.options : [];
      const selected = (values[q.dependsOn] ?? []) as string[];
      const raw = (values[q.id] ?? {}) as Record<string, number>;
      if (selected.length === 0) {
        return (
          <p className="per-option-empty mono">
            {ti(`questions.${slug}.${q.dependsOn}.title`)}
          </p>
        );
      }
      return (
        <div className="per-option-number-group">
          {selected.map((optValue) => {
            const opt = parentOptions.find((o) => o.value === optValue);
            const label = opt
              ? ti(`questions.${slug}.${q.dependsOn}.options.${opt.value}`)
              : optValue;
            const current = raw[optValue];
            const str = current === undefined ? "" : String(current);
            return (
              <div className="per-option-number-row" key={optValue}>
                <span className="per-option-label mono">{label}</span>
                <div className="number-field">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={q.min}
                    max={q.max}
                    value={str}
                    onChange={(e) => {
                      const val = e.target.value;
                      const next = { ...raw };
                      if (val === "") {
                        delete next[optValue];
                      } else {
                        const n = Number(val);
                        if (Number.isFinite(n)) next[optValue] = n;
                      }
                      setValue(q.id, next);
                    }}
                    className="number-input"
                  />
                  <span className="number-unit mono">
                    {ti(`questions.${slug}.${q.id}.unit`)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    if (q.kind === "open") {
      const v = (values[q.id] ?? "") as string;
      return (
        <Textarea
          showWordCount
          value={v}
          onChange={(e) => setValue(q.id, e.target.value)}
          placeholder=""
          aria-label={qTitle(q.id)}
        />
      );
    }
    return assertNever(q);
  }

  return (
    <div className="step-form">
      <div className="step-form-meta">
        <SaveIndicator state={saveState} savedAt={savedAt} />
      </div>

      <section className="question-group">
        <header className="vh question-group-head">
          <span className="lhs">
            <span>{t("questions.closeTitle")}</span>{" "}
            <em>{t("questions.closeHint")}</em>
          </span>
          <span className="mono">
            {String(step.closeQuestions.length).padStart(2, "0")}{" "}
            {t("questions.countLabel", { count: step.closeQuestions.length })}
          </span>
        </header>
        <div className="question-group-body">
          {step.closeQuestions.map((q) => (
            <QuestionRow
              key={q.id}
              id={q.id}
              number={q.number}
              title={qTitle(q.id)}
              subtitle={qSubtitle(q.id)}
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
              <span>{t("questions.openTitle")}</span>{" "}
              <em>{t("questions.openHint")}</em>
            </span>
            <span className="mono">
              {String(step.openQuestions.length).padStart(2, "0")}{" "}
              {t("questions.countLabel", { count: step.openQuestions.length })}
            </span>
          </header>
          <div className="question-group-body">
            {step.openQuestions.map((q) => (
              <QuestionRow
                key={q.id}
                id={q.id}
                number={q.number}
                title={qTitle(q.id)}
                subtitle={qSubtitle(q.id)}
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
        <SaveExitModalTrigger
          onBeforeNavigate={flushBeforeNavigate}
          step={step.number}
        />

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
                {t("step.backTo", { n: step.number - 1 })}
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
                <em className="serif-i">{t("step.submitReading")}</em>
              ) : (
                <>
                  <span>{t("step.submit")}</span>
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
              <span>{t("step.continueTo", { n: step.number + 1 })}</span>
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

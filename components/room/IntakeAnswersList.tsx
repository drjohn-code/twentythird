"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  AnyQuestion,
  AnswerValue,
  MultiQuestion,
  OpenQuestion,
  ScaleQuestion,
  SingleQuestion,
  NumberQuestion,
} from "@/lib/types/intake";
import { dispatchSettingsSaved } from "@/components/room/SettingsSaveStrip";

// IntakeAnswersList — Settings → Your intake.
//
// Each question appears as a row: serif italic question, plain serif
// answer, and an `edit →` row-link that opens an inline editor. On
// save, POST /api/settings/intake writes a versioned row and bumps
// reading depth; the save-strip pulses; the local state updates.

export type QuestionWithAnswer = {
  question: AnyQuestion;
  /** Current effective answer — latest versioned edit, falling back to original intake. */
  answer: AnswerValue | null;
  /** Step number (1–10) — used to group the rows. */
  stepNumber: number;
  /** Step slug, e.g. "origins". */
  stepSlug: string;
  /** Step eyebrow for the group header (e.g. "ORIGINS · DEVELOPMENTAL IMPRINTING"). */
  stepEyebrow: string;
};

type IntakeAnswersListProps = {
  items: QuestionWithAnswer[];
};

export default function IntakeAnswersList({ items }: IntakeAnswersListProps) {
  const t = useTranslations("caseFile");
  const ti = useTranslations("intake");
  // Local copy so we can mutate after save without re-fetching.
  const [rows, setRows] = useState(items);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Group by step number.
  const groups = new Map<number, QuestionWithAnswer[]>();
  for (const r of rows) {
    if (!groups.has(r.stepNumber)) groups.set(r.stepNumber, []);
    groups.get(r.stepNumber)!.push(r);
  }

  return (
    <div className="intake-answers">
      {Array.from(groups.entries()).map(([step, group]) => (
        <section key={step} className="intake-answers-group">
          <div className="intake-answers-group-eyebrow">
            {String(step).padStart(2, "0")} ·{" "}
            {ti(`steps.${group[0].stepSlug}.eyebrow`)}
          </div>
          <ol className="intake-answers-list">
            {group.map((row) => {
              const key = row.question.id;
              const isOpen = openKey === key;
              const slug = row.stepSlug;
              return (
                <li key={key} className="intake-answers-row">
                  <div className="intake-answers-row-head">
                    <p className="intake-answers-q">
                      {stripTrailingPeriod(
                        ti(`questions.${slug}.${row.question.id}.title`),
                      )}
                    </p>
                    <div className="intake-answers-row-actions">
                      <button
                        type="button"
                        className="intake-answers-edit"
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        aria-expanded={isOpen}
                      >
                        <span>{isOpen ? t("intakeClose") : t("intakeEdit")}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                  <p className="intake-answers-a">
                    {formatAnswer(ti, slug, row.question, row.answer)}
                  </p>

                  {isOpen ? (
                    <InlineEditor
                      slug={slug}
                      question={row.question}
                      initial={row.answer}
                      onCancel={() => setOpenKey(null)}
                      onSaved={(value) => {
                        setRows((prev) =>
                          prev.map((p) =>
                            p.question.id === key ? { ...p, answer: value } : p,
                          ),
                        );
                        setOpenKey(null);
                        dispatchSettingsSaved();
                      }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Inline editor — one question at a time. Renders per kind.
// ────────────────────────────────────────────────────────────────────

type InlineEditorProps = {
  slug: string;
  question: AnyQuestion;
  initial: AnswerValue | null;
  onCancel: () => void;
  onSaved: (value: AnswerValue) => void;
};

function InlineEditor({
  slug,
  question,
  initial,
  onCancel,
  onSaved,
}: InlineEditorProps) {
  const t = useTranslations("caseFile");
  const ti = useTranslations("intake");
  const [value, setValue] = useState<AnswerValue | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submit() {
    setError(null);
    if (value === null || value === undefined) {
      setError("an answer is required to save");
      return;
    }
    if (Array.isArray(value) && value.length === 0) {
      setError("pick at least one option, or close without saving");
      return;
    }
    if (typeof value === "string" && value.trim().length === 0) {
      setError("write a sentence, or close without saving");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/intake", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            question_key: question.id,
            answer: value,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(data?.error ?? "save failed");
          return;
        }
        onSaved(value);
      } catch {
        setError("save failed");
      }
    });
  }

  return (
    <div className="intake-answers-editor">
      <p className="intake-answers-editor-sub">
        {ti(`questions.${slug}.${question.id}.subtitle`)}
      </p>
      <EditorControl
        slug={slug}
        question={question}
        value={value}
        onChange={setValue}
      />
      {error ? <p className="intake-answers-editor-error">{error}</p> : null}
      <div className="intake-answers-editor-actions">
        <button
          type="button"
          className="intake-answers-save"
          onClick={submit}
          disabled={isPending}
        >
          <span>{isPending ? t("intakeSaving") : t("intakeSave")}</span>
          <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="intake-answers-cancel"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("intakeCancel")}
        </button>
      </div>
    </div>
  );
}

function EditorControl({
  slug,
  question,
  value,
  onChange,
}: {
  slug: string;
  question: AnyQuestion;
  value: AnswerValue | null;
  onChange: (v: AnswerValue | null) => void;
}) {
  const t = useTranslations("caseFile");
  switch (question.kind) {
    case "single":
      return (
        <SingleEditor
          slug={slug}
          q={question}
          value={typeof value === "string" ? value : null}
          onChange={(v) => onChange(v)}
        />
      );
    case "multi":
      return (
        <MultiEditor
          slug={slug}
          q={question}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => onChange(v)}
        />
      );
    case "scale":
      return (
        <ScaleEditor
          slug={slug}
          q={question}
          value={typeof value === "number" ? value : null}
          onChange={(v) => onChange(v)}
        />
      );
    case "number":
      return (
        <NumberEditor
          slug={slug}
          q={question}
          value={typeof value === "number" ? value : null}
          onChange={(v) => onChange(v)}
        />
      );
    case "open":
      return (
        <OpenEditor
          slug={slug}
          q={question}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
        />
      );
    case "per_option_number":
      return (
        <p className="intake-answers-editor-unsupported">
          {t("intakeUnsupported")}
        </p>
      );
  }
}

function SingleEditor({
  slug,
  q,
  value,
  onChange,
}: {
  slug: string;
  q: SingleQuestion;
  value: string | null;
  onChange: (v: string) => void;
}) {
  const ti = useTranslations("intake");
  return (
    <ul className="intake-edit-choices">
      {q.options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              className={
                "intake-edit-choice" + (selected ? " is-checked" : "")
              }
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
            >
              {ti(`questions.${slug}.${q.id}.options.${opt.value}`)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MultiEditor({
  slug,
  q,
  value,
  onChange,
}: {
  slug: string;
  q: MultiQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const t = useTranslations("caseFile");
  const ti = useTranslations("intake");
  const limit = q.maxSelections ?? q.options.length;
  return (
    <>
      <ul className="intake-edit-choices">
        {q.options.map((opt) => {
          const selected = value.includes(opt.value);
          const wouldExceed = !selected && value.length >= limit;
          return (
            <li key={opt.value}>
              <button
                type="button"
                className={
                  "intake-edit-choice" + (selected ? " is-checked" : "")
                }
                onClick={() => {
                  if (selected) {
                    onChange(value.filter((v) => v !== opt.value));
                  } else if (!wouldExceed) {
                    onChange([...value, opt.value]);
                  }
                }}
                aria-pressed={selected}
                disabled={wouldExceed}
              >
                {ti(`questions.${slug}.${q.id}.options.${opt.value}`)}
              </button>
            </li>
          );
        })}
      </ul>
      {q.maxSelections ? (
        <p className="intake-edit-hint">{t("intakePickUpTo", { count: q.maxSelections })}</p>
      ) : null}
    </>
  );
}

function ScaleEditor({
  slug,
  q,
  value,
  onChange,
}: {
  slug: string;
  q: ScaleQuestion;
  value: number | null;
  onChange: (v: number) => void;
}) {
  const t = useTranslations("caseFile");
  const ti = useTranslations("intake");
  const ticks = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
  return (
    <div className="intake-edit-scale">
      <div className="intake-edit-scale-ticks">
        {ticks.map((tick) => (
          <button
            type="button"
            key={tick}
            className={
              "intake-edit-scale-tick" + (value === tick ? " is-on" : "")
            }
            onClick={() => onChange(tick)}
            aria-label={t("intakeScaleSetTo", { value: tick })}
          />
        ))}
        <span className="intake-edit-scale-value">
          {value ?? "—"}
        </span>
      </div>
      <div className="intake-edit-scale-ends">
        <span>{ti(`questions.${slug}.${q.id}.lowLabel`)}</span>
        <span>{ti(`questions.${slug}.${q.id}.highLabel`)}</span>
      </div>
    </div>
  );
}

function NumberEditor({
  slug,
  q,
  value,
  onChange,
}: {
  slug: string;
  q: NumberQuestion;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const ti = useTranslations("intake");
  return (
    <div className="intake-edit-number">
      <input
        type="number"
        className="intake-edit-number-input"
        value={value ?? ""}
        min={q.min}
        max={q.max}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
      <span className="intake-edit-number-unit">
        {ti(`questions.${slug}.${q.id}.unit`).toLowerCase()}
      </span>
    </div>
  );
}

function OpenEditor({
  slug,
  q,
  value,
  onChange,
}: {
  slug: string;
  q: OpenQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const ti = useTranslations("intake");
  return (
    <textarea
      className="intake-edit-open"
      value={value}
      rows={5}
      onChange={(e) => onChange(e.target.value)}
      placeholder=""
      aria-label={ti(`questions.${slug}.${q.id}.title`)}
    />
  );
}

// ────────────────────────────────────────────────────────────────────
// Read-side formatting
// ────────────────────────────────────────────────────────────────────

function formatAnswer(
  ti: ReturnType<typeof useTranslations>,
  slug: string,
  q: AnyQuestion,
  v: AnswerValue | null,
): string {
  if (v === null || v === undefined) return "—";
  switch (q.kind) {
    case "single": {
      const opt = q.options.find((o) => o.value === v);
      return opt
        ? ti(`questions.${slug}.${q.id}.options.${opt.value}`)
        : String(v);
    }
    case "multi": {
      if (!Array.isArray(v)) return "—";
      if (v.length === 0) return "—";
      const labels = v.map((val) =>
        q.options.some((o) => o.value === val)
          ? ti(`questions.${slug}.${q.id}.options.${val}`)
          : val,
      );
      return labels.join(" · ");
    }
    case "scale":
      return typeof v === "number" ? `${v} / ${q.max}` : "—";
    case "number":
      return typeof v === "number"
        ? `${v} ${ti(`questions.${slug}.${q.id}.unit`).toLowerCase()}`
        : "—";
    case "open":
      return typeof v === "string" && v.length > 0 ? v : "—";
    case "per_option_number":
      return "—";
  }
}

function stripTrailingPeriod(s: string): string {
  return s.replace(/\.$/, "");
}

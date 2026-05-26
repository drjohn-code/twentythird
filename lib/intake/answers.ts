// Shared intake-answer assembly + completion math.
//
// Settings, the new /intake page, and the per-step editor all need
// the same merged view: original intake_responses payload + the
// latest versioned edit per question from intake_answers.

import { STEPS } from "@/lib/onboarding/steps";
import { depthStatusFor } from "@/lib/depth";
import type { DepthStatus } from "@/lib/copy";
import type {
  AnyQuestion,
  AnswerValue,
  StepDef,
} from "@/lib/types/intake";

export type IntakeResponseRow = {
  step_number: number;
  payload: Record<string, unknown> | null;
};

export type IntakeAnswerRow = {
  question_key: string;
  answer: { value: AnswerValue } | null;
  version: number;
};

export type QuestionWithAnswer = {
  question: AnyQuestion;
  answer: AnswerValue | null;
  stepNumber: number;
  stepSlug: string;
  stepEyebrow: string;
};

/**
 * Word-count threshold for an open answer to be counted as "with
 * enough context." Tuned conservatively — most thoughtful open
 * answers exceed it. Promote to settings later if needed.
 */
export const OPEN_RICHNESS_WORDS_MIN = 12;

export function buildIntakeAnswers(
  responses: IntakeResponseRow[],
  edits: IntakeAnswerRow[],
): QuestionWithAnswer[] {
  const latestEdit = new Map<string, AnswerValue>();
  for (const e of edits) {
    if (latestEdit.has(e.question_key)) continue;
    if (e.answer && "value" in e.answer) {
      latestEdit.set(e.question_key, e.answer.value);
    }
  }

  const responsesByStep = new Map<number, Record<string, unknown>>();
  for (const r of responses) {
    responsesByStep.set(r.step_number, r.payload ?? {});
  }

  const out: QuestionWithAnswer[] = [];
  for (const step of STEPS) {
    const payload = responsesByStep.get(step.number) ?? {};
    const allQs: AnyQuestion[] = [
      ...step.closeQuestions,
      ...step.openQuestions,
    ] as AnyQuestion[];
    for (const q of allQs) {
      if (q.kind === "per_option_number") continue;
      const edited = latestEdit.get(q.id);
      const original = payload[q.id];
      const effective =
        edited !== undefined ? edited : (original as AnswerValue | undefined);
      out.push({
        question: q,
        answer: effective ?? null,
        stepNumber: step.number,
        stepSlug: step.slug,
        stepEyebrow: step.eyebrow,
      });
    }
  }
  return out;
}

export type StepCompletion = {
  step: StepDef;
  answered: number;
  total: number;
  ratio: number;
  status: DepthStatus;
};

/**
 * Per-step completion stats. Closed answers count as answered if
 * present; open answers count only if they clear OPEN_RICHNESS_WORDS_MIN.
 * per_option_number questions are excluded (edited inside the intake
 * walkthrough itself).
 */
export function computeStepCompletions(
  rows: QuestionWithAnswer[],
): StepCompletion[] {
  const byStep = new Map<number, QuestionWithAnswer[]>();
  for (const r of rows) {
    if (!byStep.has(r.stepNumber)) byStep.set(r.stepNumber, []);
    byStep.get(r.stepNumber)!.push(r);
  }

  return STEPS.map((step) => {
    const items = byStep.get(step.number) ?? [];
    let answered = 0;
    for (const item of items) {
      if (isSatisfactorilyAnswered(item.question, item.answer)) answered += 1;
    }
    const total = items.length;
    const ratio = total > 0 ? answered / total : 0;
    return {
      step,
      answered,
      total,
      ratio,
      status: depthStatusFor(ratio),
    };
  });
}

export function isSatisfactorilyAnswered(
  q: AnyQuestion,
  v: AnswerValue | null,
): boolean {
  if (v === null || v === undefined) return false;
  switch (q.kind) {
    case "single":
      return typeof v === "string" && v.length > 0;
    case "multi":
      return Array.isArray(v) && v.length > 0;
    case "scale":
    case "number":
      return typeof v === "number" && Number.isFinite(v);
    case "open":
      if (typeof v !== "string") return false;
      return v.trim().split(/\s+/).filter(Boolean).length >= OPEN_RICHNESS_WORDS_MIN;
    case "per_option_number":
      return false;
  }
}

/**
 * Derive a short, capitalized title from a step's slug.
 * "self-relation" → "Self-relation"; "origins" → "Origins".
 */
export function titleForStep(step: StepDef): string {
  const slug = step.slug;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * The second segment of the step eyebrow becomes the short subtitle.
 * "ORIGINS · DEVELOPMENTAL IMPRINTING" → "developmental imprinting".
 * Falls back to the slug if the eyebrow doesn't have a separator.
 */
export function subtitleForStep(step: StepDef): string {
  const parts = step.eyebrow.split("·").map((p) => p.trim());
  const tail = parts.slice(1).join(" · ");
  return (tail || step.slug).toLowerCase();
}

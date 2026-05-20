// Validation for the onboarding flow.
//
// - Account form: name + birth year + gender + terms.
// - Step payload: built dynamically from the step's questions so we
//   only accept known ids and values. Missing answers are treated as
//   skips (= null), which is the whole point of the no-wrong-answer
//   architecture.

import { z } from "zod";
import {
  TOTAL_STEPS,
  getStep,
  isValidStepNumber,
} from "@/lib/onboarding/steps";
import type {
  AnswerValue,
  CloseQuestion,
  OpenQuestion,
  StepPayload,
} from "@/lib/types/intake";

// ---------------------------------------------------------------
// Account form
// ---------------------------------------------------------------

const MIN_BIRTH_YEAR = 1900;
export const MAX_BIRTH_YEAR = new Date().getUTCFullYear() - 13;

export const accountSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120),
  birth_year: z
    .coerce.number()
    .int()
    .min(MIN_BIRTH_YEAR)
    .max(MAX_BIRTH_YEAR),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]),
  terms_accepted: z
    .union([z.literal("on"), z.literal("true"), z.literal(true)])
    .transform(() => true),
});

export type AccountInput = z.infer<typeof accountSchema>;

// ---------------------------------------------------------------
// Step payload — built from the step's question definitions
// ---------------------------------------------------------------

function questionValidator(q: CloseQuestion | OpenQuestion) {
  switch (q.kind) {
    case "single": {
      const allowed = new Set(q.options.map((o) => o.value));
      return z
        .string()
        .refine((v) => allowed.has(v), `Unknown option for ${q.id}`);
    }
    case "multi": {
      const allowed = new Set(q.options.map((o) => o.value));
      return z
        .array(z.string().refine((v) => allowed.has(v), `Unknown option for ${q.id}`))
        .max(q.maxSelections ?? q.options.length);
    }
    case "scale": {
      return z.number().int().min(q.min).max(q.max);
    }
    case "number": {
      let schema = z.number();
      if (typeof q.min === "number") schema = schema.min(q.min);
      if (typeof q.max === "number") schema = schema.max(q.max);
      return schema;
    }
    case "open": {
      return z.string().max(5000);
    }
  }
}

/** Reserved key in the payload: the list of explicitly-skipped question ids. */
export const SKIPPED_KEY = "skipped" as const;

/** Build a schema for one step's payload object.
 *
 * Persisted shape:
 *   - keys are question ids → answer values (string / number / string[])
 *   - reserved sibling key `skipped: string[]` lists explicitly-skipped qids
 *   - missing key = unanswered; null is NOT a valid persisted value
 */
export function stepPayloadSchema(stepNumber: number) {
  const step = getStep(stepNumber);
  if (!step) throw new Error(`Unknown step ${stepNumber}`);
  const qs = [...step.closeQuestions, ...step.openQuestions];
  const qidSet = new Set(qs.map((q) => q.id));
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of qs) {
  if (q && q.id) {
    const validator = questionValidator(q);
    if (validator) { 
      shape[q.id] = validator.optional();
  }
  shape[SKIPPED_KEY] = z
    .array(
      z
        .string()
        .refine((v) => qidSet.has(v), "Unknown question id in skipped"),
    )
    .optional();
  return z.object(shape).strict();
}

/** Filter unknown keys, validate, and emit the canonical persisted shape:
 *   - answered questions only (omit absent / empty)
 *   - explicit skips collected into `skipped: string[]`
 *   - null is dropped entirely
 */
export function normaliseStepPayload(
  stepNumber: number,
  raw: unknown,
): StepPayload {
  const step = getStep(stepNumber);
  if (!step) throw new Error(`Unknown step ${stepNumber}`);
  const schema = stepPayloadSchema(stepNumber);

  const qs = [...step.closeQuestions, ...step.openQuestions];
  const allowed = new Set<string>(qs.map((q) => q.id));
  allowed.add(SKIPPED_KEY);

  const filtered: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? Object.fromEntries(
          Object.entries(raw as Record<string, unknown>).filter(([k, v]) => {
            if (!allowed.has(k)) return false;
            // Tolerate clients that still send null for unanswered keys —
            // strip them here so the schema (which forbids null) doesn't reject.
            if (v === null) return false;
            return true;
          }),
        )
      : {};

  const parsed = schema.parse(filtered) as Record<string, unknown>;

  const skipFromInput = Array.isArray(parsed[SKIPPED_KEY])
    ? (parsed[SKIPPED_KEY] as string[])
    : [];
  const skipSet = new Set(skipFromInput);

  const out: StepPayload = {};
  const skipList: string[] = [];
  for (const q of qs) {
    if (skipSet.has(q.id)) {
      skipList.push(q.id);
      continue;
    }
    const v = parsed[q.id];
    if (v === undefined) continue;
    if (typeof v === "string" && v.length === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[q.id] = v as AnswerValue;
  }
  if (skipList.length > 0) {
    out[SKIPPED_KEY] = skipList;
  }
  return out;
}

export function isValidStepParam(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!isValidStepNumber(n)) return null;
  return n;
}

export const STEPS_COUNT = TOTAL_STEPS;

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
        .refine((v) => allowed.has(v), `Unknown option for ${q.id}`)
        .nullable();
    }
    case "multi": {
      const allowed = new Set(q.options.map((o) => o.value));
      return z
        .array(z.string().refine((v) => allowed.has(v), `Unknown option for ${q.id}`))
        .max(q.max ?? q.options.length)
        .nullable();
    }
    case "scale": {
      return z
        .number()
        .int()
        .min(q.min)
        .max(q.max)
        .nullable();
    }
    case "number": {
      let schema = z.number();
      if (typeof q.min === "number") schema = schema.min(q.min);
      if (typeof q.max === "number") schema = schema.max(q.max);
      return schema.nullable();
    }
    case "open": {
      return z.string().max(5000).nullable();
    }
  }
}

/** Build a schema for one step's payload object. */
export function stepPayloadSchema(stepNumber: number) {
  const step = getStep(stepNumber);
  if (!step) throw new Error(`Unknown step ${stepNumber}`);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of [...step.closeQuestions, ...step.openQuestions]) {
    // Every question is optional (the whole flow is opt-in answers).
    // A missing key is treated as a skip = null at normalisation.
    shape[q.id] = questionValidator(q).optional();
  }
  return z.object(shape).strict();
}

/** Drop unknown keys, coerce missing keys to null, then validate. */
export function normaliseStepPayload(
  stepNumber: number,
  raw: unknown,
): StepPayload {
  const step = getStep(stepNumber);
  if (!step) throw new Error(`Unknown step ${stepNumber}`);
  const schema = stepPayloadSchema(stepNumber);

  // Filter unknown keys first so .strict() doesn't fail on garbage.
  const allowed = new Set(
    [...step.closeQuestions, ...step.openQuestions].map((q) => q.id),
  );
  const filtered: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? Object.fromEntries(
          Object.entries(raw as Record<string, unknown>).filter(([k]) =>
            allowed.has(k),
          ),
        )
      : {};

  const parsed = schema.parse(filtered);

  // Coerce missing keys to null so the row is shape-complete.
  const out: StepPayload = {};
  for (const q of [...step.closeQuestions, ...step.openQuestions]) {
    const v = (parsed as Record<string, unknown>)[q.id];
    out[q.id] = (v === undefined ? null : (v as AnswerValue));
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

// Shared types for the 10-step intake.
//
// One row per (user, step) lives in intake_responses; the column
// `payload` is a jsonb document shaped like { [questionId]: AnswerValue }.
// Question ids are conventionally `q{step}_{n}` (e.g. q1_1, q1_2…).

export type StepSlug =
  | "origins"
  | "attachment"
  | "authority"
  | "belonging"
  | "persona"
  | "desire"
  | "achievement"
  | "escape"
  | "self-relation"
  | "future-fantasy";

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Option = { value: string; label: string };

export type SingleQuestion = {
  kind: "single";
  id: string;
  number: string;
  title: string;
  options: Option[];
  /** Renders horizontally as chips when there are ≤ 4 short options. */
  layout?: "vertical" | "horizontal";
};

export type MultiQuestion = {
  kind: "multi";
  id: string;
  number: string;
  title: string;
  options: Option[];
  max?: number;
};

export type ScaleQuestion = {
  kind: "scale";
  id: string;
  number: string;
  title: string;
  min: 1;
  max: 10;
  lowLabel: string;
  highLabel: string;
};

export type NumberQuestion = {
  kind: "number";
  id: string;
  number: string;
  title: string;
  unit: string;
  min?: number;
  max?: number;
};

export type OpenQuestion = {
  kind: "open";
  id: string;
  number: string;
  title: string;
  placeholderEcho?: string;
};

export type CloseQuestion =
  | SingleQuestion
  | MultiQuestion
  | ScaleQuestion
  | NumberQuestion;

export type AnyQuestion = CloseQuestion | OpenQuestion;

export type StepDef = {
  number: StepNumber;
  slug: StepSlug;
  /** Eyebrow: e.g. "SECTION 01 · ORIGINS · DEVELOPMENTAL IMPRINTING" */
  eyebrow: string;
  /** Headline parts; exactly one segment must be italic. */
  headline: { text: string; italic?: boolean }[];
  /** Two-sentence lede: claim + mechanism. */
  lede: string;
  /** Minutes (8–14). Shown in the side meta block. */
  estMinutes: number;
  closeQuestions: CloseQuestion[];
  openQuestions: OpenQuestion[];
};

// ---------------------------------------------------------------
// Answer values
// ---------------------------------------------------------------

export type SingleAnswer = string;
export type MultiAnswer = string[];
export type ScaleAnswer = number;
export type NumberAnswer = number;
export type OpenAnswer = string;

export type AnswerValue =
  | SingleAnswer
  | MultiAnswer
  | ScaleAnswer
  | NumberAnswer
  | OpenAnswer
  | null;

/** Per-step payload — every question id mapped to its answer (or null
 *  for skipped). Validation happens in lib/onboarding/schema.ts. */
export type StepPayload = Record<string, AnswerValue>;

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type IntakeStatus =
  | "not_started"
  | "in_progress"
  | "processing"
  | "ready"
  | "failed";

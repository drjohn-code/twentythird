// Weekly Catchup — eight question seed set.
//
// One-per-screen flow in the Room dashboard. Three question shapes:
//
//   - "open"   — free text, serif italic prompt above a Textarea
//   - "closed" — 2–5 hairline-bordered selectable rows, single-select
//   - "scale"  — 1..7 ticks with two labeled endpoints
//
// Single source of truth for the runner, the question renderer, and
// the catchup API route. The keys (`question_key`) are persisted as
// the jsonb shape `{ [key]: value }` on `catchups.answers`; do not
// rename them without writing a migration.

export type ClosedOption = {
  /** Stable identifier persisted with the answer. */
  value: string;
  /** Italic-style label shown in the row. */
  label: string;
};

export type CatchupQuestionBase = {
  /** Stable key used as the jsonb field name in `catchups.answers`. */
  key: string;
  /** Mono eyebrow shown above the question, e.g. "QUESTION 03 · 08". */
  eyebrow: string;
  /** Plain-serif prompt — the question itself. No trailing punctuation rules. */
  prompt: string;
};

export type OpenQuestion = CatchupQuestionBase & {
  type: "open";
  /** Optional italic serif framing line above the textarea. */
  italicFraming?: string;
};

export type ClosedQuestion = CatchupQuestionBase & {
  type: "closed";
  options: ClosedOption[];
};

export type ScaleQuestion = CatchupQuestionBase & {
  type: "scale";
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
};

export type CatchupQuestion = OpenQuestion | ClosedQuestion | ScaleQuestion;

/** Empty/unanswered shape — `null` means the question has not been touched. */
export type CatchupAnswer = string | number | null;

export const CATCHUP_QUESTIONS: readonly CatchupQuestion[] = [
  {
    key: "stayed_with",
    type: "open",
    eyebrow: "QUESTION 01 · 08",
    prompt: "What stayed with you from the week?",
    italicFraming: "a phrase, an image, a sentence someone said.",
  },
  {
    key: "closeness",
    type: "closed",
    eyebrow: "QUESTION 02 · 08",
    prompt: "How close did you let anyone get?",
    options: [
      { value: "not_at_all", label: "not at all" },
      { value: "briefly", label: "briefly" },
      { value: "with_hesitation", label: "with hesitation" },
      { value: "openly", label: "openly" },
      { value: "too_far", label: "too far" },
    ],
  },
  {
    key: "loop",
    type: "open",
    eyebrow: "QUESTION 03 · 08",
    prompt: "Did you catch yourself in a familiar loop?",
    italicFraming: "where, and how it ended.",
  },
  {
    key: "loudest_voice",
    type: "closed",
    eyebrow: "QUESTION 04 · 08",
    prompt: "Which voice was loudest this week?",
    options: [
      { value: "demand", label: "the demand" },
      { value: "doubt", label: "the doubt" },
      { value: "desire", label: "the desire" },
      { value: "watcher", label: "the watcher" },
      { value: "none", label: "none of these" },
    ],
  },
  {
    key: "dream",
    type: "open",
    eyebrow: "QUESTION 05 · 08",
    prompt: "Was there a dream worth writing down?",
    italicFraming: "if so, the fragment that lingered.",
  },
  {
    key: "acted_on_desire",
    type: "scale",
    eyebrow: "QUESTION 06 · 08",
    prompt: "How far did you act on what you actually wanted?",
    min: 1,
    max: 7,
    lowLabel: "not at all",
    highLabel: "completely",
  },
  {
    key: "work_catch",
    type: "closed",
    eyebrow: "QUESTION 07 · 08",
    prompt: "Where did work catch you?",
    options: [
      { value: "start", label: "the start" },
      { value: "middle", label: "the middle" },
      { value: "finish", label: "the finish" },
      { value: "visibility", label: "the visibility" },
      { value: "nowhere", label: "nowhere" },
    ],
  },
  {
    key: "avoided_question",
    type: "open",
    eyebrow: "QUESTION 08 · 08",
    prompt: "What is the question you don't want to answer right now?",
    italicFraming: "the one that keeps slipping past.",
  },
];

/** A shaped answer set keyed by `question_key`. Open → string, Closed → string, Scale → number. */
export type CatchupAnswers = Record<string, string | number>;

/** True when every question has a non-empty answer. */
export function isComplete(answers: Partial<CatchupAnswers>): boolean {
  return CATCHUP_QUESTIONS.every((q) => {
    const v = answers[q.key];
    if (q.type === "scale") return typeof v === "number";
    if (typeof v !== "string") return false;
    return v.trim().length > 0;
  });
}

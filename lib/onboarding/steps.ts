// Onboarding step definitions — single source of truth for copy and
// field shape. The page renders these in order; the API stores each
// step's answers under a stable top-level key (step_1, step_2, ...)
// inside onboarding_responses.data, so partial state is always
// coherent and additive.
//
// Editing rules (do not break):
//   - Each headline contains exactly one italic segment.
//   - No: "we believe", "imagine", "unlock", "journey", "Project 23",
//     no wellness clichés.
//   - Labels follow the eyebrow grammar (mono 11px uppercase). No
//     placeholder text inside the inputs themselves.
//   - Field kinds are limited to: text, textarea, select.
//   - Escalation: factual at 1–2, relational/historical at 4–7,
//     interpretive/forward at 8–10. Do not lead with the most
//     exposing question.
//   - One frame per idea. If a step is doing two things, split it.
//
// TODO(copy): Lines below tagged TODO(copy) are headlines the
// operator should review before launch. They are clinically loaded
// enough that an editorial pass is worth more than a Claude pass.

export type HeadlineSegment = { text: string; italic?: boolean };

export type SelectOption = { value: string; label: string };

export type Field =
  | {
      kind: "text";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
      maxLength?: number;
      autoComplete?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
      maxLength?: number;
      rows?: number;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
      options: SelectOption[];
    };

export type StepDef = {
  id: number; // 1..10
  eyebrow: string; // "STEP 01 · OF 10"
  headline: HeadlineSegment[];
  lede?: string;
  fields: Field[];
};

export const TOTAL_STEPS = 10 as const;

export const STEPS: StepDef[] = [
  {
    id: 1,
    eyebrow: "STEP 01 · OF 10",
    headline: [
      { text: "First, your " },
      { text: "name", italic: true },
      { text: "." },
    ],
    lede: "What we'll call you. You can change it later in your profile.",
    fields: [
      {
        kind: "text",
        name: "preferred_name",
        label: "PREFERRED NAME",
        required: true,
        maxLength: 80,
        autoComplete: "given-name",
      },
    ],
  },
  {
    id: 2,
    eyebrow: "STEP 02 · OF 10",
    headline: [
      { text: "Where you are on the " },
      { text: "timeline", italic: true },
      { text: "." },
    ],
    lede: "Age shapes which patterns are worth looking at first.",
    fields: [
      {
        kind: "select",
        name: "age_range",
        label: "AGE RANGE",
        required: true,
        options: [
          { value: "18-24", label: "18–24" },
          { value: "25-34", label: "25–34" },
          { value: "35-44", label: "35–44" },
          { value: "45-54", label: "45–54" },
          { value: "55-64", label: "55–64" },
          { value: "65+", label: "65+" },
        ],
      },
    ],
  },
  {
    id: 3,
    eyebrow: "STEP 03 · OF 10",
    headline: [
      { text: "What brought you " },
      { text: "into this room", italic: true },
      { text: "." },
    ],
    lede: "One reason. The honest one usually arrives second.",
    fields: [
      {
        kind: "textarea",
        name: "reason",
        label: "IN YOUR WORDS",
        rows: 4,
        maxLength: 1200,
      },
    ],
  },
  {
    id: 4,
    eyebrow: "STEP 04 · OF 10",
    headline: [
      { text: "A pattern that " },
      { text: "keeps returning", italic: true },
      { text: "." },
    ],
    lede:
      "Something — a thought, a behaviour, a kind of relationship — that has appeared more than once.",
    fields: [
      {
        kind: "textarea",
        name: "pattern",
        label: "THE PATTERN",
        rows: 4,
        maxLength: 1200,
      },
    ],
  },
  {
    id: 5,
    eyebrow: "STEP 05 · OF 10",
    headline: [
      { text: "Where you first " },
      { text: "noticed it", italic: true },
      { text: "." },
    ],
    lede: "The earliest moment you can place. Approximate is fine.",
    fields: [
      {
        kind: "textarea",
        name: "earliest_instance",
        label: "EARLIEST INSTANCE",
        rows: 4,
        maxLength: 1200,
      },
    ],
  },
  {
    id: 6,
    eyebrow: "STEP 06 · OF 10",
    headline: [
      { text: "The figure whose " },
      { text: "judgement still lands", italic: true },
      { text: "." },
    ],
    lede:
      "A parent, sibling, teacher, partner — someone whose opinion still has weight you didn't grant it.",
    fields: [
      {
        kind: "text",
        name: "figure",
        label: "WHO",
        maxLength: 120,
      },
    ],
  },
  {
    id: 7,
    eyebrow: "STEP 07 · OF 10",
    headline: [
      { text: "What their " },
      { text: "voice still says", italic: true },
      { text: "." },
    ],
    lede: "Quote it if you can. Paraphrase if you can't.",
    fields: [
      {
        kind: "textarea",
        name: "internalised_line",
        label: "THE LINE",
        rows: 4,
        maxLength: 800,
      },
    ],
  },
  {
    id: 8,
    eyebrow: "STEP 08 · OF 10",
    headline: [
      { text: "A dream or image that " },
      { text: "keeps appearing", italic: true },
      { text: "." },
    ],
    lede: "Recurring or recent. Describe it in present tense.",
    fields: [
      {
        kind: "textarea",
        name: "recurring_image",
        label: "THE IMAGE",
        rows: 4,
        maxLength: 1200,
      },
    ],
  },
  {
    id: 9,
    eyebrow: "STEP 09 · OF 10",
    headline: [
      { text: "What you'd " },
      { text: "no longer be doing", italic: true },
      { text: " in a year." },
    ],
    lede: "The behaviour you'd be free of. Be specific.",
    fields: [
      {
        kind: "textarea",
        name: "what_ends",
        label: "WHAT ENDS",
        rows: 4,
        maxLength: 800,
      },
    ],
  },
  {
    id: 10,
    eyebrow: "STEP 10 · OF 10",
    headline: [
      { text: "What you'd be doing " },
      { text: "instead", italic: true },
      { text: "." },
    ],
    lede: "Concrete. The actual texture of an afternoon.",
    fields: [
      {
        kind: "textarea",
        name: "what_begins",
        label: "WHAT BEGINS",
        rows: 4,
        maxLength: 800,
      },
    ],
  },
];

export function getStep(id: number): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}

export function stepKey(id: number): string {
  return `step_${id}`;
}

if (process.env.NODE_ENV !== "production") {
  for (const s of STEPS) {
    const italics = s.headline.filter((seg) => seg.italic).length;
    if (italics !== 1) {
      console.warn(
        `[onboarding] step ${s.id} has ${italics} italic segments (expected 1)`,
      );
    }
  }
}

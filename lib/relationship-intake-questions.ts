// Relationship intake — the 12 short questions the invitee answers
// after accepting a connection. Designed to take about five minutes.
//
// These questions are about the inviter (from the invitee's vantage),
// not about the invitee. The answers feed the inviter's readings. The
// invitee never sees what the answers produce.
//
// Same schema grammar as the catchup questions: closed / open / scale.
// No "per_option_number" or branching — the intake stays flat.

export type RelClosedOption = { value: string; label: string };

export type RelClosedQuestion = {
  key: string;
  type: "closed";
  prompt: string;
  hint?: string;
  options: RelClosedOption[];
};

export type RelOpenQuestion = {
  key: string;
  type: "open";
  prompt: string;
  hint?: string;
  /** Soft minimum — the analyst's hint disappears once the user passes it. */
  hintWordsBelow?: number;
};

export type RelScaleQuestion = {
  key: string;
  type: "scale";
  prompt: string;
  hint?: string;
  /** Inclusive. */
  min: number;
  max: number;
  labels: { min: string; max: string };
};

export type RelationshipQuestion =
  | RelClosedQuestion
  | RelOpenQuestion
  | RelScaleQuestion;

export type RelationshipAnswers = Record<
  string,
  string | number | undefined
>;

export const RELATIONSHIP_INTAKE_QUESTIONS: readonly RelationshipQuestion[] = [
  {
    key: "duration",
    type: "closed",
    prompt: "How long have you known each other?",
    options: [
      { value: "under_one_year", label: "less than a year" },
      { value: "one_to_three", label: "one to three years" },
      { value: "four_to_ten", label: "four to ten years" },
      { value: "eleven_to_twenty", label: "eleven to twenty years" },
      { value: "more_than_twenty", label: "more than twenty years" },
    ],
  },
  {
    key: "closeness_now",
    type: "scale",
    prompt: "How close do the two of you feel right now?",
    min: 1,
    max: 7,
    labels: { min: "at a distance", max: "as close as it gets" },
  },
  {
    key: "repair_initiator",
    type: "closed",
    prompt: "When you disagree, who tends to seek repair first?",
    options: [
      { value: "i_do", label: "I almost always do" },
      { value: "usually_me", label: "usually me" },
      { value: "evenly", label: "we move toward each other evenly" },
      { value: "usually_them", label: "usually them" },
      { value: "they_do", label: "they almost always do" },
    ],
  },
  {
    key: "they_withdraw_at",
    type: "closed",
    prompt: "When something is hard, where do they tend to go?",
    options: [
      { value: "toward", label: "toward you, to talk it through" },
      { value: "quiet", label: "into quiet, then back" },
      { value: "work", label: "into work or distraction" },
      { value: "alone", label: "fully alone, behind a door" },
      { value: "elsewhere", label: "to other people first" },
    ],
  },
  {
    key: "what_they_dont_see",
    type: "open",
    prompt: "What is something you wish they understood about themselves?",
    hint: "longer answers deepen the reading",
    hintWordsBelow: 25,
  },
  {
    key: "what_you_offer",
    type: "open",
    prompt: "In one phrase, what do you do for them that they cannot do for themselves?",
    hint: "a sentence is enough",
    hintWordsBelow: 10,
  },
  {
    key: "their_loudest_voice",
    type: "closed",
    prompt: "Which voice seems to drive them most often?",
    options: [
      { value: "demand", label: "the demand — what should be done" },
      { value: "doubt", label: "the doubt — whether it is enough" },
      { value: "desire", label: "the desire — what they actually want" },
      { value: "watcher", label: "the watcher — how it will be seen" },
      { value: "uncertain", label: "I don't know yet" },
    ],
  },
  {
    key: "where_work_catches",
    type: "closed",
    prompt: "Where does their work usually catch?",
    options: [
      { value: "start", label: "the start — getting in" },
      { value: "middle", label: "the middle — staying with it" },
      { value: "finish", label: "the finish — letting it go" },
      { value: "visibility", label: "the visibility — letting it be seen" },
      { value: "nowhere", label: "nowhere I can see from outside" },
    ],
  },
  {
    key: "they_avoid",
    type: "open",
    prompt: "Is there a topic they consistently steer away from? Name it lightly.",
    hint: "a phrase is fine",
  },
  {
    key: "they_at_their_best",
    type: "open",
    prompt: "When are they most themselves?",
    hint: "the answer can be a moment, a setting, or a posture",
  },
  {
    key: "what_youve_changed",
    type: "open",
    prompt:
      "Is there something about them you have quietly accepted you will not change?",
    hint: "honest beats generous here",
  },
  {
    key: "future_together",
    type: "scale",
    prompt: "How much of the future you imagine includes them?",
    min: 1,
    max: 7,
    labels: { min: "very little", max: "almost all of it" },
  },
] as const;

export type RelationshipQuestionKey =
  (typeof RELATIONSHIP_INTAKE_QUESTIONS)[number]["key"];

/**
 * Strict-ish completion check. Every key must have an answer. Closed
 * answers must be one of the listed options; scales must be in range;
 * open answers must be non-empty after trim.
 */
export function isComplete(answers: RelationshipAnswers): boolean {
  for (const q of RELATIONSHIP_INTAKE_QUESTIONS) {
    const v = answers[q.key];
    if (v === undefined || v === null) return false;
    if (q.type === "closed") {
      if (typeof v !== "string") return false;
      if (!q.options.some((o) => o.value === v)) return false;
    } else if (q.type === "scale") {
      if (typeof v !== "number" || !Number.isFinite(v)) return false;
      if (v < q.min || v > q.max) return false;
    } else {
      // open
      if (typeof v !== "string" || v.trim().length === 0) return false;
    }
  }
  return true;
}

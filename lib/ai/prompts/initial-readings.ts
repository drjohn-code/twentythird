import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE, analystLocaleDirective } from "./analyst-voice";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";

// Initial readings — generated once, post-intake, before the user
// first lands in /room. The model writes the v2 reading copy for all
// twelve blocks at once (the v1 seed rows are placeholders). Output
// is a JSON object keyed by block slug.

export type IntakeAnswerInput = {
  question_key: string;
  question_text: string;
  answer: unknown;
};

export type InitialReadingOutput = {
  reading: string;
  takeaway: string;
  definition: string;
  weight: number;
};

export type InitialReadingsResponse = Record<BlockSlug, InitialReadingOutput>;

const SYSTEM_TAIL = `Task — initial readings.

The user has just completed onboarding intake. You will write v1 readings for all twelve analytic units (six dashboard, six report-only). The user has not yet had a session, a catchup, or a connection — this is the first read.

For each of the twelve slugs in the input list, return:
  - "reading": serif italic, ≤ 18 words, lowercase. Names a specific pattern or move. No general advice.
  - "takeaway": plain serif, ≤ 14 words. The one thing to hold from the reading. May reference a clinical term.
  - "definition": carry the supplied definition verbatim unless it is clearly wrong for this user. Default: copy it through.
  - "weight": a number in [0, 1] expressing how much the intake material constrains this slug. Slugs the intake bears on directly (e.g. the question asked about closeness — intimacy-threshold) get higher weight (0.35–0.55). Slugs the intake says nothing about start low (0.10–0.20). Never above 0.6 — this is the first read.

Constraints:
- Output VALID JSON. The top-level object is keyed by slug. No prose around it. No Markdown fence.
- If the intake is sparse on a slug, write a thin reading honestly — "too early to name with confidence — the shape is forming" is acceptable. Do not invent material the user did not give.
- Quote no more than two short phrases from intake verbatim across all twelve readings combined.
- No bullet lists. Each field is a single sentence or fragment.`;

export function buildInitialReadingsPrompt(input: {
  intake: IntakeAnswerInput[];
  locale: string;
}): { system: string; messages: ChatMessage[] } {
  const slugList = BLOCKS.map(
    (b) => `  - ${b.slug} (${b.subtitle}, ${b.surface}) — ${b.definition}`,
  ).join("\n");

  const intakeBlock = input.intake
    .map(
      (a) =>
        `### ${a.question_key}\nQ: ${a.question_text}\nA: ${formatAnswer(a.answer)}`,
    )
    .join("\n\n");

  return {
    system: `${ANALYST_VOICE}${analystLocaleDirective(input.locale)}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Twelve slugs to write readings for:\n${slugList}\n\n---\n\nIntake answers:\n\n${intakeBlock}\n\n---\n\nReturn the JSON object now.`,
      },
    ],
  };
}

function formatAnswer(a: unknown): string {
  if (a == null) return "(no answer)";
  if (typeof a === "string") return a;
  if (typeof a === "number" || typeof a === "boolean") return String(a);
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE, analystLocaleDirective } from "./analyst-voice";

export type CatchupAnswerInput = {
  question_key: string;
  question_text: string;
  answer: unknown;
};

const SYSTEM_TAIL = `Task — catchup summary.

The user has just completed a weekly Catchup. Write three short paragraphs that reflect the week back in the analyst's voice.

Rules:
- Three paragraphs. Each 2–4 sentences. Paragraphs separated by a blank line.
- The first paragraph names what stayed with the user this week — without paraphrasing platitudes.
- The second paragraph names a pattern, structure, or move visible across the answers. Use a clinical term if accurate.
- The third paragraph holds what was avoided or what the week left open. Do not propose action; sit with it.
- Plain serif sentences. Italics only for the half-said (Markdown *like this*). No bullets. No headers.
- Do not address the user as "you". Speak in third person about the week itself, or use bare imperative where natural.
- Do not begin paragraphs with "this week" or "the week was". Vary openings.
- Do not say "I notice", "I see", "I hear" — the analyst does not narrate themselves.`;

export function buildCatchupSummaryPrompt(input: {
  weekNumber: number;
  answers: CatchupAnswerInput[];
  locale: string;
}): { system: string; messages: ChatMessage[] } {
  const answerBlock = input.answers
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
        content: `Week ${String(input.weekNumber).padStart(2, "0")} catchup answers:\n\n${answerBlock}\n\n---\n\nWrite the three-paragraph summary now. Return only the prose — no labels, no JSON.`,
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

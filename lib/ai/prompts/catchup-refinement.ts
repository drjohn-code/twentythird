import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";
import type { CatchupAnswerInput } from "./catchup-summary";

export type RefinementReadingInput = {
  slug: BlockSlug;
  reading: string;
  takeaway: string;
  weight: number;
};

export type RefinementOutput = {
  reading: string;
  takeaway: string;
  weight: number;
};

export type CatchupRefinementResponse = Record<BlockSlug, RefinementOutput>;

const SYSTEM_TAIL = `Task — refine the twelve readings after a catchup.

The user just completed a weekly catchup. You will produce v(n+1) reading copy for all twelve analytic units. Some shift; most barely move. Honesty about lack of motion is more valuable than fabricated motion.

For each of the twelve slugs in the input, return:
  - "reading": serif italic, ≤ 18 words, lowercase. Names a specific pattern or move from the current reading carried forward, sharpened, or replaced as the week's material warrants.
  - "takeaway": plain serif, ≤ 14 words. The one thing to hold.
  - "weight": a number in [0, 1]. Bump weight UP for slugs the catchup bore on directly (typically by 0.04–0.12). Leave others within 0.02 of their prior value. Never set above 0.95 — readings stay open.

Rules:
- Output VALID JSON keyed by slug. No prose, no Markdown fence.
- Do not invent material the catchup did not give. If a slug saw nothing, keep its previous reading nearly verbatim.
- Quote no more than two short phrases from the catchup verbatim across the entire output.
- If the catchup contradicts a prior reading, replace it cleanly. Do not hedge.
- If a connection summary is supplied, you may weave its frame into the relevant relational slugs (intimacy-threshold, relational-pattern, transference) — sparingly, in clinical naming, not gossip.`;

export function buildCatchupRefinementPrompt(input: {
  weekNumber: number;
  answers: CatchupAnswerInput[];
  previous: RefinementReadingInput[];
  connectionContexts: Array<{ role: string; summary: string }>;
}): { system: string; messages: ChatMessage[] } {
  const slugList = BLOCKS.map(
    (b) => `- ${b.slug} (${b.subtitle}, ${b.surface})`,
  ).join("\n");

  const previousBlock = input.previous
    .map(
      (r) =>
        `- ${r.slug} (weight ${r.weight.toFixed(2)}):\n    reading: ${r.reading}\n    takeaway: ${r.takeaway}`,
    )
    .join("\n");

  const answersBlock = input.answers
    .map(
      (a) =>
        `### ${a.question_key}\nQ: ${a.question_text}\nA: ${formatAnswer(a.answer)}`,
    )
    .join("\n\n");

  const connectionsBlock =
    input.connectionContexts.length === 0
      ? "(no active connections)"
      : input.connectionContexts
          .map((c) => `- role: ${c.role}\n  ${c.summary}`)
          .join("\n");

  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Twelve slugs (all required in your output):\n${slugList}\n\n# Previous readings\n${previousBlock}\n\n# Week ${String(input.weekNumber).padStart(2, "0")} catchup answers\n${answersBlock}\n\n# Active connection context\n${connectionsBlock}\n\nReturn the JSON object keyed by slug now.`,
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

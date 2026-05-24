import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";
import type { BlockSlug } from "@/lib/blocks";

// Reading lede — long-form paragraph rendered on /readings under the
// figure for each dashboard block. Cached on block_readings.lede;
// regenerated when superseded_at moves forward.

export type ReadingLedeInput = {
  slug: BlockSlug;
  subtitle: string;
  definition: string;
  reading: string;
  takeaway: string;
  /** Tells the model which figure pattern sits next to this lede so the writing complements it. */
  figureType:
    | "pattern-list"
    | "dream-text"
    | "report-mock"
    | "script-revision";
  /** A small selection of recent intake / catchup excerpts that bear on this slug. */
  excerpts: Array<{ source: string; text: string }>;
};

const SYSTEM_TAIL = `Task — the long-form lede for a single reading on the /readings page.

You write 3–4 serif sentences that sit alongside a figure. The lede frames what the figure shows: the figure is the data; the lede is the analyst's reading of it.

Rules:
- 3–4 sentences. Plain serif (the renderer styles the page). Sentence case.
- Italics (Markdown *like this*) only for the half-said.
- Open with a structural observation, not a definition. The definition is rendered separately above the lede.
- Reference the figure type implicitly. For "pattern-list", note recurrence and outcome. For "dream-text", note grammar (condensation, displacement). For "report-mock", note the multi-metric profile. For "script-revision", note the cost of the old line and what the rewrite makes possible.
- Reference user material when it is in the excerpts. Quote at most one short phrase.
- Do not address the user as "you" except sparingly. The lede is third-person about the pattern, not second-person about the person.
- Do not propose action.`;

export function buildReadingLedePrompt(input: ReadingLedeInput): {
  system: string;
  messages: ChatMessage[];
} {
  const excerptsBlock =
    input.excerpts.length === 0
      ? "(no excerpts available)"
      : input.excerpts.map((e) => `- (${e.source}) ${e.text}`).join("\n");

  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Slug: ${input.slug} (${input.subtitle})
Definition: ${input.definition}
Current reading: ${input.reading}
Current takeaway: ${input.takeaway}
Figure type: ${input.figureType}

Excerpts that bear on this slug:
${excerptsBlock}

Write the 3–4 sentence lede now. Return only the prose.`,
      },
    ],
  };
}

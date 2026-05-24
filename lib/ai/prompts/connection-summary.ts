import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";

// Connection summary — generated once when a connection completes
// relationship intake. Stored on connections.context_summary and
// injected into session, catchup refinement, and report prompts.

export type ConnectionSummaryInput = {
  role:
    | "partner"
    | "closest_friend"
    | "parent"
    | "sibling"
    | "co_parent";
  inviterFirstName: string | null;
  connectionFirstName: string | null;
  answers: Array<{
    question_key: string;
    question_text: string;
    answer: unknown;
  }>;
};

const SYSTEM_TAIL = `Task — connection context summary.

A connection (someone the user has invited into their reading) has completed relationship intake about the user. You write a single paragraph that gives downstream prompts a working frame for the relationship.

Rules:
- One paragraph. 3–5 sentences. Plain serif.
- Third person about the relationship dynamic. Name what the connection reports, in clinical voice — what the connection sees in the user, how closeness is met, where the friction lies.
- Italics (Markdown *like this*) only for the half-said.
- Do not address the user. Do not address the connection.
- Do not quote the connection's words verbatim — paraphrase precisely.
- No advice. No prescriptions. This is a frame, not a recommendation.`;

export function buildConnectionSummaryPrompt(input: ConnectionSummaryInput): {
  system: string;
  messages: ChatMessage[];
} {
  const answersBlock = input.answers
    .map(
      (a) =>
        `### ${a.question_key}\nQ: ${a.question_text}\nA: ${formatAnswer(a.answer)}`,
    )
    .join("\n\n");

  const inviter = input.inviterFirstName ?? "the user";
  const connection = input.connectionFirstName ?? "the connection";

  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Role: ${input.role}
Inviter (the user): ${inviter}
Connection: ${connection}

Relationship intake answers (the connection writing about the inviter):

${answersBlock}

Write the single-paragraph summary now. Return only the prose.`,
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

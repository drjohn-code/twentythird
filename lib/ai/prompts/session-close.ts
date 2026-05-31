import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE, analystLocaleDirective } from "./analyst-voice";

export type SessionCloseInput = {
  topic: string | null;
  heldQuestion: string;
  /** Full transcript of the session that is about to close. */
  transcript: Array<{ role: "user" | "analyst" | "system"; text: string }>;
  locale: string;
};

const SYSTEM_TAIL = `Task — the ritual closing paragraph at the end of a Consulting Room session.

You write exactly one short paragraph. It marks the end of the hour without summarizing what was said.

Rules:
- 2–4 sentences. Serif. Lowercase.
- Italics (Markdown *like this*) only for the half-said.
- Name one thing that will continue to work on the user between now and the next session — without prescribing it.
- The line "that's our hour." is added separately by the system. Do not include it.
- Do not list what was discussed. Do not summarize. Do not praise.
- Do not propose homework, journaling prompts, or rituals.
- If the session was empty (zero user turns), acknowledge that the room was held open without judgement.
- No question marks. The closing does not ask.`;

export function buildSessionClosePrompt(input: SessionCloseInput): {
  system: string;
  messages: ChatMessage[];
} {
  const transcriptBlock =
    input.transcript.length === 0
      ? "(the room was held open; no turns were taken)"
      : input.transcript
          .map((t) => `${t.role.toUpperCase()}: ${t.text}`)
          .join("\n\n");

  return {
    system: `${ANALYST_VOICE}${analystLocaleDirective(input.locale)}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${input.topic ?? "general"}\nHeld question: ${input.heldQuestion}\n\nFull transcript:\n\n${transcriptBlock}\n\n---\n\nWrite the closing paragraph now. Return only the prose.`,
      },
    ],
  };
}

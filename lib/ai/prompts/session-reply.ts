import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE, analystLocaleDirective } from "./analyst-voice";

export type SessionReplyInput = {
  topic: string | null;
  heldQuestion: string;
  /** All prior turns in the session, oldest first. */
  transcript: Array<{ role: "user" | "analyst" | "system"; text: string }>;
  /** Latest current readings, dashboard slugs. */
  readings: Array<{ slug: string; reading: string }>;
  /** Active connection context summaries. */
  connectionContexts: Array<{ role: string; firstName: string | null; summary: string }>;
  /** When safety severity is "medium", we inject extra guidance. */
  mediumSafetyDistress: boolean;
  locale: string;
};

const BASE_SYSTEM_TAIL = `Task — single analyst reply during a Consulting Room session.

You produce one short reply in the analyst's voice — never more. The reply is rendered serif, lowercase, with italics for the half-said.

Rules:
- ≤ 60 words. Two short sentences is typical. Three is the ceiling.
- Lowercase. Italics (Markdown *like this*) only for the half-said.
- Do not summarize what the user just said back to them in full. The analyst names the structural move or the linguistic site of the work — not the content.
- May reference a clinical concept (transference, condensation, intimacy threshold, etc.) when it is what is actually happening. Never to display knowledge.
- May quote one short phrase back to the user verbatim, sparingly, to mark the linguistic site.
- Do not propose actions, exercises, or homework. The analyst listens.
- Do not begin with "ah", "well", "okay", or any acknowledger. Begin with the work.
- Do not end with a question mark unless the question is the work. One question per reply maximum.
- The held question and topic are the frame of the session. Stay inside that frame unless the user pulls elsewhere.
- The current readings shape interpretation but are never quoted to the user. They are background.
- Connection context, if present, may be referenced by first name and role (sparingly, with care). Never disclose what the connection wrote.`;

const MEDIUM_SAFETY_ADD = `

Additional guidance — the user is expressing significant distress this session. Your reply explicitly names the weight of what they have said, and, once across the session, gently notes that ongoing support outside this room may help. Do not preach. Do not list resources. The naming itself is the work.`;

export function buildSessionReplyPrompt(input: SessionReplyInput): {
  system: string;
  messages: ChatMessage[];
} {
  const system =
    `${ANALYST_VOICE}${analystLocaleDirective(input.locale)}\n\n${BASE_SYSTEM_TAIL}` +
    (input.mediumSafetyDistress ? MEDIUM_SAFETY_ADD : "");

  const messages: ChatMessage[] = [];

  // Frame the room as a single opening user message, then play the
  // transcript back as alternating turns. Anything in the transcript
  // beyond what the model needs (system entries, the latest user
  // turn) is included verbatim.
  const frame: string[] = [];
  frame.push(`Topic: ${input.topic ?? "general"}`);
  frame.push(`Held question: ${input.heldQuestion}`);
  frame.push("Current readings (background, do not quote):");
  for (const r of input.readings) {
    frame.push(`- ${r.slug}: ${r.reading}`);
  }
  if (input.connectionContexts.length > 0) {
    frame.push("Connections in context:");
    for (const c of input.connectionContexts) {
      const who = c.firstName ?? "(unnamed)";
      frame.push(`- ${who} (${c.role}): ${c.summary}`);
    }
  }
  messages.push({ role: "user", content: frame.join("\n") });
  messages.push({
    role: "assistant",
    content: "(the analyst is in the room, listening)",
  });

  for (const t of input.transcript) {
    if (t.role === "user") {
      messages.push({ role: "user", content: t.text });
    } else if (t.role === "analyst") {
      messages.push({ role: "assistant", content: t.text });
    }
  }

  return { system, messages };
}

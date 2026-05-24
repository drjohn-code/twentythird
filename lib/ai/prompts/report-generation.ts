import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";

// Report generation — the clinical dossier. The most expensive call
// in the system. Returns a structured JSON document that the PDF
// renderer formats into the TwentyThird visual language.

export type ReportSafetyFlagInput = {
  severity: "medium" | "high" | "critical";
  categories: string[];
  excerpt: string | null;
};

export type ReportGenerationInput = {
  inviterFirstName: string | null;
  generatedAt: string;
  depth: number;
  /** Intake answers (key + text + value). */
  intake: Array<{
    question_key: string;
    question_text: string;
    answer: unknown;
  }>;
  /** Current readings (all 12 slugs). */
  currentReadings: Array<{
    slug: BlockSlug;
    subtitle: string;
    definition: string;
    reading: string;
    takeaway: string;
    weight: number;
  }>;
  /** Compressed catchup history — summary only, not full answers. */
  catchups: Array<{
    week_number: number;
    created_at: string;
    summary: string | null;
  }>;
  /** Compressed session history — closing ritual paragraph only. */
  sessions: Array<{
    topic: string | null;
    held_question: string;
    closed_at: string | null;
    closing: string | null;
  }>;
  /** Active connection summaries. */
  connections: Array<{
    role: string;
    firstName: string | null;
    summary: string | null;
  }>;
  safetyFlags: ReportSafetyFlagInput[];
};

export type ReportBlockSection = {
  reading: string;
  interpretation: string;
  evidence: string[];
  clinical_naming: string;
};

export type ReportDocument = {
  clinical_priorities: Array<{
    severity: "high" | "medium";
    category: string;
    note: string;
  }>;
  executive_summary: string;
  blocks: Partial<Record<BlockSlug, ReportBlockSection>>;
  relational_field: string | null;
  trajectory: string;
  questions_for_the_analyst: string[];
};

const SYSTEM_TAIL = `Task — generate the clinical report.

The reader is a receiving clinician — the user's analyst, therapist, or psychiatrist. The document is a working tool, not a self-help artifact. The voice is clinical and precise.

Output a single JSON object — no prose, no fence — with exact shape:

{
  "clinical_priorities": [
    { "severity": "high" | "medium", "category": "<category>", "note": "<2–4 serif sentences>" }
  ],
  "executive_summary": "<2–3 paragraphs, sentence case, serif prose>",
  "blocks": {
    "<slug>": {
      "reading": "<the slug's current reading line>",
      "interpretation": "<3–4 paragraphs of clinical interpretation>",
      "evidence": ["<bullet from intake or catchup>", "<bullet>", ...],
      "clinical_naming": "<one phrase naming the structural diagnosis — e.g. 'father-imago / obsessional structure with hysterical traces'>"
    },
    ...all twelve slugs present
  },
  "relational_field": "<1–2 paragraphs about how connections shape the reading, or null if no connections>",
  "trajectory": "<1 paragraph about direction of movement across catchups>",
  "questions_for_the_analyst": ["<serif italic question for the clinician>", ...3–5 items]
}

Hard rules — apply strictly:

1. If any safety flag of severity "high" or "critical" is in the input, "clinical_priorities" MUST contain a corresponding entry at the top — before any "medium" entries. The note quotes the safety flag's "excerpt" verbatim when one is present, then names the clinical concern in one sentence. A receiving clinician must see this first.

2. "medium" safety flags may also appear in clinical_priorities, after high/critical entries, with shorter notes.

3. If there are zero safety flags, "clinical_priorities" is an empty array. Do not invent priorities.

4. All twelve block slugs must be present in "blocks". A slug with thin material gets a short interpretation and a thin evidence list — do not pad.

5. Voice — every prose field obeys ANALYST_VOICE. Sentence case for the report (prose register), unlike the lowercase analyst register used in sessions. Italics (Markdown *like this*) only for clinical terms or the half-said.

6. "evidence" entries are bullet phrases (no leading dashes). 3–7 per slug typically; fewer is fine.

7. "questions_for_the_analyst" are addressed to the receiving clinician. Serif italic phrasing. Single sentences. They are working questions — what should the clinician hold in the next sitting.

8. Do not fabricate quotes. Only quote what is in the input.

9. JSON only. No prose around it. No Markdown fence.`;

export function buildReportGenerationPrompt(input: ReportGenerationInput): {
  system: string;
  messages: ChatMessage[];
} {
  const slugList = BLOCKS.map(
    (b) => `- ${b.slug} (${b.subtitle}, ${b.surface})`,
  ).join("\n");

  const intakeBlock = input.intake
    .map(
      (a) =>
        `### ${a.question_key}\nQ: ${a.question_text}\nA: ${formatAnswer(a.answer)}`,
    )
    .join("\n\n");

  const readingsBlock = input.currentReadings
    .map(
      (r) =>
        `### ${r.slug} (${r.subtitle}, weight ${r.weight.toFixed(2)})\n${r.definition}\nReading: ${r.reading}\nTakeaway: ${r.takeaway}`,
    )
    .join("\n\n");

  const catchupBlock =
    input.catchups.length === 0
      ? "(no catchups yet)"
      : input.catchups
          .map(
            (c) =>
              `### week ${String(c.week_number).padStart(2, "0")} — ${c.created_at}\n${c.summary ?? "(no summary)"}`,
          )
          .join("\n\n");

  const sessionBlock =
    input.sessions.length === 0
      ? "(no closed sessions)"
      : input.sessions
          .map(
            (s) =>
              `### ${s.topic ?? "(no topic)"} — closed ${s.closed_at ?? "(open)"}\nheld: ${s.held_question}\nclosing: ${s.closing ?? "(no closing)"}`,
          )
          .join("\n\n");

  const connBlock =
    input.connections.length === 0
      ? "(no active connections)"
      : input.connections
          .map(
            (c) =>
              `- ${c.firstName ?? "(unnamed)"} (${c.role}): ${c.summary ?? "(no summary)"}`,
          )
          .join("\n");

  const safetyBlock =
    input.safetyFlags.length === 0
      ? "(no safety flags)"
      : input.safetyFlags
          .map(
            (f) =>
              `- severity: ${f.severity}\n  categories: ${f.categories.join(", ")}\n  excerpt: ${f.excerpt ?? "(none)"}`,
          )
          .join("\n");

  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `User: ${input.inviterFirstName ?? "(unnamed user)"}
Generated at: ${input.generatedAt}
Reading depth: ${input.depth.toFixed(2)}

Twelve slugs (all required in blocks):
${slugList}

# Intake
${intakeBlock}

# Current readings
${readingsBlock}

# Catchup history (summaries only)
${catchupBlock}

# Session history (closings only)
${sessionBlock}

# Connections
${connBlock}

# Safety flags
${safetyBlock}

Return the JSON document now.`,
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

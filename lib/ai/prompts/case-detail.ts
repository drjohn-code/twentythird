import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";

// Case-file entry detail view — short two-section read.
//
// Renders inside /case-file/[id] for catchup and session entries. The
// view is strictly capped — 40 words per section, 80 words total —
// because the long-form analyst reflection lives elsewhere. This pass
// is the brief that a clinician would skim.

export type ClosedAnswerInput = {
  question_key: string;
  question_text: string;
  answer_value: string;
  answer_label: string;
};

export type OpenAnswerInput = {
  question_key: string;
  question_text: string;
  answer: string;
  meaningful: boolean;
};

export type SessionTurnInput = {
  role: "user" | "analyst" | "system";
  text: string;
};

export type IntakeSnippet = {
  step_slug: string;
  one_line: string;
};

export type CaseDetailPromptInput = {
  entryKind: "catchup" | "session";
  /** ISO 8601 of the entry's occurrence — gives the model a date anchor. */
  occurredAt: string;
  entryTitle: string;
  /** Closed-question answers (scale, single, multi). May be empty for sessions. */
  closedAnswers: ClosedAnswerInput[];
  /** Open-text answers + meaningful flag. May be empty for sessions. */
  openAnswers: OpenAnswerInput[];
  /** Session transcript turns — only present for entryKind = 'session'. */
  transcript?: SessionTurnInput[];
  /** Compact intake context lines, one per step. */
  intake: IntakeSnippet[];
};

export type CaseDetailResponse = {
  summary: string;
  recommendation: string;
};

const SYSTEM_TAIL = `Task — case-file entry detail view.

You write a two-section read for a clinician scanning a single case-file entry. The view sits inside the Case File at /case-file/[id]. The long-form analyst reflection lives elsewhere; this pass is the brief.

Return a single JSON object — no prose, no fence — with exact shape:

{
  "summary":        <string — section 1, ≤ 40 words, lowercase, plain serif>,
  "recommendation": <string — section 2, ≤ 40 words, lowercase, plain serif>
}

Section 1 — summary of the user's answers
- Genuinely summarise what was answered. Do NOT paraphrase the user's literal words back. Do NOT quote.
- Cover both the closed answers (scales / picks) and the open answers, in proportion to what's there.
- If ALL open answers were flagged "meaningful: false", DO NOT invent any open-answer content. Write a single short line that the closed answers were recorded but the open responses did not contain meaningful input, and ask quietly for fuller answers next time.
- If SOME open answers were meaningful and some not, summarise the meaningful ones and quietly omit the rest. Do not call out the omission unless it matters.
- For sessions: summarise the held question and the shape of the conversation. Do not quote turns.
- ≤ 40 words. Lowercase. One short paragraph. No bullets, no headers.

Section 2 — recommendation
- Actionable but quiet. Draw on intake context + any meaningful answers in this entry. Never draw on non-meaningful open answers.
- If there is genuinely nothing actionable that rests on real data, say so plainly — do not fabricate a generic recommendation.
- Italic phrases only for the half-said (Markdown *like this*). One flourish max.
- ≤ 40 words. Lowercase. One short paragraph.

Hard rules:
- Hard cap: 40 words per section. The server enforces this — if you overshoot, the surplus is truncated.
- No fabrication. No filler. No coach-speak. No "you've got this", "trust yourself", "lean in".
- No "we believe", "imagine", "unlock", "journey". No exclamation marks.
- Do not address the user as "you" in the summary — speak about what was recorded. The recommendation may use direct address sparingly.

JSON only. No commentary.`;

export function buildCaseDetailPrompt(input: CaseDetailPromptInput): {
  system: string;
  messages: ChatMessage[];
} {
  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      { role: "user", content: renderUserMessage(input) },
    ],
  };
}

function renderUserMessage(input: CaseDetailPromptInput): string {
  const parts: string[] = [];

  parts.push(`# Entry`);
  parts.push(`- kind: ${input.entryKind}`);
  parts.push(`- title: ${input.entryTitle}`);
  parts.push(`- occurred_at: ${input.occurredAt}`);

  if (input.intake.length > 0) {
    parts.push(`\n# Intake context`);
    for (const s of input.intake) {
      parts.push(`- ${s.step_slug}: ${s.one_line}`);
    }
  } else {
    parts.push(`\n# Intake context`);
    parts.push(`- (no intake snapshot available)`);
  }

  if (input.closedAnswers.length > 0) {
    parts.push(`\n# Closed answers`);
    for (const a of input.closedAnswers) {
      parts.push(
        `- [${a.question_key}] ${a.question_text}\n    → ${a.answer_label} (${a.answer_value})`,
      );
    }
  }

  if (input.openAnswers.length > 0) {
    parts.push(`\n# Open answers`);
    for (const a of input.openAnswers) {
      const flag = a.meaningful ? "meaningful" : "NOT meaningful";
      const body = a.meaningful ? a.answer : "(skipped — non-meaningful input)";
      parts.push(
        `- [${a.question_key}] ${a.question_text}\n    flag: ${flag}\n    answer: ${body}`,
      );
    }
  }

  if (input.entryKind === "session" && input.transcript && input.transcript.length > 0) {
    parts.push(`\n# Session transcript (most recent first, last 12 turns)`);
    const recent = input.transcript.slice(-12);
    for (const t of recent) {
      const text = t.text.length > 280 ? `${t.text.slice(0, 277)}…` : t.text;
      parts.push(`- ${t.role}: ${text}`);
    }
  }

  parts.push(
    `\n# Output\nReturn the JSON object now. Both fields ≤ 40 words. Honest about non-meaningful input.`,
  );

  return parts.join("\n");
}

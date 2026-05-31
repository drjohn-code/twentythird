import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE, analystLocaleDirective } from "./analyst-voice";

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
  /**
   * Optional notice appended to the user message when the route is
   * retrying after a too-short first pass. Lets us ask for a longer
   * Section 2 without changing the system prompt.
   */
  regenerateNotice?: string;
  locale: string;
};

export type CaseDetailResponse = {
  summary: string;
  recommendation: string;
};

const SYSTEM_TAIL = `Task — case-file entry detail view.

You write a two-section read shown at /case-file/[id] for a catchup or session entry. The long-form analyst reflection lives elsewhere; this pass is the brief.

The two sections render under these headers (the user sees them):
  · "SUMMARY · YOUR ANSWERS"
  · "OUR CATCHUP"

Return a single JSON object — no prose, no fence — with exact shape:

{
  "summary":        <string — section 1, ≤ 60 words, lowercase, plain serif>,
  "recommendation": <string — section 2, 50–100 words, lowercase, plain language>
}

Section 1 — "SUMMARY · YOUR ANSWERS"  (≤ 60 words)
- Distil what the user said across closed answers (scales, picks) and open answers. Open answers in catchups and sessions can be long — compress them, do NOT quote or echo verbatim.
- Cover closed and open in proportion to what's there.
- If ALL open answers were flagged "meaningful: false", DO NOT invent any open-answer content. Write a short line that the closed answers were recorded but the open responses did not contain meaningful input, and ask quietly for fuller answers next time.
- If SOME open answers were meaningful and some not, summarise the meaningful ones and quietly omit the rest. Do not call out the omission unless it matters.
- For sessions: summarise the held question and the shape of the conversation. Do not quote turns.
- Lowercase. One short paragraph. No bullets, no headers.

Section 2 — "OUR CATCHUP"  (50–100 words; shorter only if there is genuinely no signal)
- Actionable, calm, warm. Ground every line in intake context + meaningful answers in this entry. NEVER ground in non-meaningful open answers.
- PLAIN LANGUAGE — overrides the analyst-voice rule about clinical terms for THIS section only. Write for a general adult reader. Short, direct sentences. Active voice. A reader should be able to scan it quickly.
- Forbidden vocabulary in this section: modulate, holistic, integrative, optimise, optimize, leverage, facilitate, ruminate, cognitive load, intentionality, transference, condensation, displacement, jouissance, primal scene, father-imago, mother-imago, obsessional, hysterical, intimacy threshold. If a clinical term would normally appear, swap it for the everyday phrase that means the same thing.
- Coach-speak still forbidden: no "you've got this", "trust yourself", "lean in", "step into".
- Direct address ("you") is allowed and natural here.
- Italics only for the half-said (Markdown *like this*). One flourish max — and only if it earns its place.
- Aim for 50–100 words. If there is genuinely nothing real to recommend (junk open answers AND no usable closed answers AND no intake), write a short honest note instead — do not pad to hit the minimum.

Hard rules across both sections:
- Hard caps enforced server-side: 60 words for summary, 100 words for recommendation. Overshoot is truncated.
- No fabrication. No filler. No "we believe", "imagine", "unlock", "journey". No exclamation marks.
- Do not address the user as "you" in the summary — speak about what was recorded. Direct address is allowed in the recommendation.

JSON only. No commentary.`;

export function buildCaseDetailPrompt(input: CaseDetailPromptInput): {
  system: string;
  messages: ChatMessage[];
} {
  return {
    system: `${ANALYST_VOICE}${analystLocaleDirective(input.locale)}\n\n${SYSTEM_TAIL}`,
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
    `\n# Output\nReturn the JSON object now. summary ≤ 60 words. recommendation 50–100 words (or shorter only if no real signal exists). Honest about non-meaningful input.`,
  );

  if (input.regenerateNotice && input.regenerateNotice.trim().length > 0) {
    parts.push(`\n# Regeneration notice\n${input.regenerateNotice.trim()}`);
  }

  return parts.join("\n");
}

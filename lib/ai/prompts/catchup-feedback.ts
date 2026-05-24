import type { ChatMessage } from "@/lib/ai/router";
import { ANALYST_VOICE } from "./analyst-voice";
import type { CatchupAnswerInput } from "./catchup-summary";

export type SafetySeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type CatchupFeedbackInput = {
  weekNumber: number;
  answers: CatchupAnswerInput[];
  /** Current six dashboard block readings, slug → reading line. */
  currentReadings: Array<{ slug: string; reading: string; weight: number }>;
  /** Number of consulting sessions in the last 21 days. */
  recentSessionCount: number;
  /** Total catchups including this one. */
  totalCatchups: number;
  /** Total reports the user has generated to date. */
  totalReports: number;
  depthBand: "thin" | "partial" | "steady" | "deep";
  isSubscribed: boolean;
  highestSafetySeverity: SafetySeverity;
};

export type CatchupFeedbackResponse = {
  consider: string | null;
  recommend: "session" | "report" | "professional_care" | "rest" | null;
  recommend_reason: string | null;
};

const SYSTEM_TAIL = `Task — catchup feedback.

You decide whether the analyst surfaces a quiet "something to hold" line and an optional recommendation after this catchup. Quiet is allowed — many weeks deserve no recommendation.

Output a single JSON object — no prose, no fence — with exact shape:

{
  "consider": <serif italic line, ≤ 18 words, lowercase, OR null>,
  "recommend": "session" | "report" | "professional_care" | "rest" | null,
  "recommend_reason": <single serif sentence, plain, OR null>
}

Hard rules — apply in this order:

1. If "highestSafetySeverity" is "high" or "critical", recommend MUST be "professional_care" and consider MUST be null. recommend_reason is one sentence in the analyst voice noting that what surfaced asks for real care beyond the room.

2. Otherwise, if the user has had zero sessions in the last 21 days AND is subscribed AND the week's answers contain pressing material — recommend "session".

3. Otherwise, if the user has never generated a report AND totalCatchups ≥ 4 AND depthBand is "steady" or "deep" — recommend "report".

4. If the week's answers indicate the user is overworked, deflated, or asking for stillness ("I just need to rest", "I cannot do another thing") — recommend "rest". A rest recommendation has a serif italic line as recommend_reason that does the work itself — no action.

5. Otherwise, recommend is null. consider may still be set if a single thing in the week deserves to be held — but only if it is genuinely worth surfacing. Default to all-nulls when the week is quiet or unremarkable.

Voice rules for the strings:
- consider is one short serif italic line addressed to the user's week, not the user themselves. Example shape: "the word *should* did most of the work this week."
- recommend_reason is one short clinical sentence. Plain serif. Names what the recommendation rests on.
- Both fields obey ANALYST_VOICE. No coach-speak. No wellness clichés.

JSON only. No commentary.`;

export function buildCatchupFeedbackPrompt(input: CatchupFeedbackInput): {
  system: string;
  messages: ChatMessage[];
} {
  return {
    system: `${ANALYST_VOICE}\n\n${SYSTEM_TAIL}`,
    messages: [
      {
        role: "user",
        content: `Week ${String(input.weekNumber).padStart(2, "0")} feedback inputs:

# Catchup answers
${input.answers
  .map((a) => `## ${a.question_key}\nQ: ${a.question_text}\nA: ${formatAnswer(a.answer)}`)
  .join("\n\n")}

# Current dashboard readings
${input.currentReadings.map((r) => `- ${r.slug} (weight ${r.weight.toFixed(2)}): ${r.reading}`).join("\n")}

# Context
- recentSessionCount (last 21d): ${input.recentSessionCount}
- totalCatchups (including this one): ${input.totalCatchups}
- totalReports: ${input.totalReports}
- depthBand: ${input.depthBand}
- isSubscribed: ${input.isSubscribed}
- highestSafetySeverity: ${input.highestSafetySeverity}

Return the JSON now.`,
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

// Dev-only: prove the analyst speaks the user's language. Builds a real
// Consulting-Room reply and a real generated report with locale "de" via
// the actual prompt builders + router, and prints the German output.
//
// Run: node --conditions=react-server --env-file=.env.local --import tsx \
//        scripts/i18n/spot-check-de.ts
import { callAI } from "@/lib/ai/router";
import { buildSessionReplyPrompt } from "@/lib/ai/prompts/session-reply";
import { buildReportGenerationPrompt } from "@/lib/ai/prompts/report-generation";
import { BLOCKS } from "@/lib/blocks";

async function main(): Promise<void> {
  // 1 — Consulting-Room reply (session_reply), locale "de".
  const sr = buildSessionReplyPrompt({
    topic: "Work avoidance",
    heldQuestion: "Why do I stall right before finishing?",
    transcript: [
      {
        role: "user",
        text: "I keep getting to the last ten percent of a project and then I stop. I find other things to do — anything but finishing it.",
      },
    ],
    readings: [
      {
        slug: "professional-block",
        reading: "the finish line is where the doubt arrives, never the start.",
      },
    ],
    connectionContexts: [],
    mediumSafetyDistress: false,
    locale: "de",
  });
  const reply = await callAI("session_reply", {
    system: sr.system,
    messages: sr.messages,
    maxTokens: 300,
    temperature: 0.7,
  });
  console.log("=== CONSULTING-ROOM REPLY (de) ===");
  console.log(reply.text.trim());

  // 2 — Generated report (report_generation), locale "de".
  const rg = buildReportGenerationPrompt({
    inviterFirstName: "Anna",
    generatedAt: "2026-05-29",
    depth: 0.42,
    intake: [
      {
        question_key: "q1_1",
        question_text: "Which words best describe the home you grew up in.",
        answer: ["strict", "achievement_focused"],
      },
      {
        question_key: "q1_2",
        question_text: "As a child, what role did you naturally take.",
        answer: "responsible_one",
      },
      {
        question_key: "q6_3",
        question_text: "How far do you act on what you actually want.",
        answer: 3,
      },
    ],
    currentReadings: BLOCKS.map((b) => ({
      slug: b.slug,
      subtitle: b.subtitle,
      definition: b.definition,
      reading: "approaches the finish, then engineers a small stall.",
      takeaway: "the block is at visibility, not effort.",
      weight: 0.35,
    })),
    catchups: [],
    sessions: [],
    connections: [],
    safetyFlags: [],
    locale: "de",
  });
  const report = await callAI("report_generation", {
    system: rg.system,
    messages: rg.messages,
    jsonMode: true,
    maxTokens: 8000,
    temperature: 0.6,
    timeoutMs: 180_000,
  });
  console.log("\n=== GENERATED REPORT (de) ===");
  const doc = JSON.parse(report.text) as {
    executive_summary?: string;
    trajectory?: string;
    blocks?: Record<string, { interpretation?: string; clinical_naming?: string }>;
  };
  console.log("executive_summary:\n" + (doc.executive_summary ?? "(none)"));
  console.log("\ntrajectory:\n" + (doc.trajectory ?? "(none)"));
  const firstBlock = Object.entries(doc.blocks ?? {})[0];
  if (firstBlock) {
    console.log(
      `\nblock [${firstBlock[0]}].interpretation:\n` +
        (firstBlock[1].interpretation ?? "(none)"),
    );
    console.log(
      `block [${firstBlock[0]}].clinical_naming:\n` +
        (firstBlock[1].clinical_naming ?? "(none)"),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

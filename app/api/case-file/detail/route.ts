import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/router";
import {
  buildCaseDetailPrompt,
  type CaseDetailPromptInput,
  type CaseDetailResponse,
  type ClosedAnswerInput,
  type IntakeSnippet,
  type OpenAnswerInput,
  type SessionTurnInput,
} from "@/lib/ai/prompts/case-detail";
import {
  enforceWordCap,
  isMeaningful,
} from "@/lib/case-file/answer-validator";
import {
  CATCHUP_QUESTIONS,
  type CatchupQuestion,
} from "@/lib/catchup-questions";
import { STEPS } from "@/lib/onboarding/steps";
import type { AnyQuestion } from "@/lib/types/intake";

// POST /api/case-file/detail — lazy-generate the two-section detail
// view for a catchup or session entry, then cache it on the row.
//
// Body: { entry_id, entry_kind: "catchup" | "session" }
//
// Returns: { summary, recommendation }
//
// Behaviour:
//   - If detail_summary + detail_recommendation are already cached,
//     return them straight away — no model call.
//   - Otherwise: load the entry, the user's intake, run the meaningful-
//     answer validator on each open answer, build the prompt, call
//     callAI("case_detail", { jsonMode: true }), enforce 40-word caps
//     server-side (truncate at the last sentence inside the limit),
//     and persist the result.

const MAX_WORDS_PER_SECTION = 40;

type Body = {
  entry_id?: unknown;
  entry_kind?: unknown;
};

type CatchupRow = {
  id: string;
  week_number: number;
  answers: Record<string, unknown> | null;
  detail_summary: string | null;
  detail_recommendation: string | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  topic: string | null;
  held_question: string;
  transcript: SessionTurnInput[] | null;
  closed_at: string | null;
  detail_summary: string | null;
  detail_recommendation: string | null;
  created_at: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const entryId = typeof body.entry_id === "string" ? body.entry_id : "";
  const entryKind =
    body.entry_kind === "catchup" || body.entry_kind === "session"
      ? body.entry_kind
      : null;

  if (!entryId || !entryKind) {
    return NextResponse.json(
      { error: "entry_id and entry_kind required" },
      { status: 400 },
    );
  }

  if (entryKind === "catchup") {
    return handleCatchup(supabase, user.id, entryId);
  }
  return handleSession(supabase, user.id, entryId);
}

// ────────────────────────────────────────────────────────────────────
// Catchup
// ────────────────────────────────────────────────────────────────────

async function handleCatchup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entryId: string,
): Promise<NextResponse> {
  const { data: row } = await supabase
    .from("catchups")
    .select(
      "id, week_number, answers, detail_summary, detail_recommendation, created_at",
    )
    .eq("user_id", userId)
    .eq("id", entryId)
    .maybeSingle<CatchupRow>();

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (row.detail_summary && row.detail_recommendation) {
    return NextResponse.json({
      summary: row.detail_summary,
      recommendation: row.detail_recommendation,
    });
  }

  const answers = row.answers ?? {};
  const { closedAnswers, openAnswers } = splitCatchupAnswers(answers);

  const intake = await loadIntakeSnippets(supabase, userId);

  const promptInput: CaseDetailPromptInput = {
    entryKind: "catchup",
    entryTitle: `Catchup · week ${String(row.week_number).padStart(2, "0")}`,
    occurredAt: row.created_at,
    closedAnswers,
    openAnswers,
    intake,
  };

  const detail = await generateDetail(promptInput, userId);
  if (!detail) {
    return NextResponse.json(
      { error: "generation failed" },
      { status: 502 },
    );
  }

  await supabase
    .from("catchups")
    .update({
      detail_summary: detail.summary,
      detail_recommendation: detail.recommendation,
    })
    .eq("id", row.id)
    .eq("user_id", userId);

  return NextResponse.json(detail);
}

function splitCatchupAnswers(answers: Record<string, unknown>): {
  closedAnswers: ClosedAnswerInput[];
  openAnswers: OpenAnswerInput[];
} {
  const closedAnswers: ClosedAnswerInput[] = [];
  const openAnswers: OpenAnswerInput[] = [];

  for (const q of CATCHUP_QUESTIONS) {
    const raw = answers[q.key];
    if (raw == null || raw === "") continue;

    if (q.type === "open") {
      const text = typeof raw === "string" ? raw : String(raw);
      const flag = isMeaningful(text);
      openAnswers.push({
        question_key: q.key,
        question_text: q.prompt,
        answer: text,
        meaningful: flag.meaningful,
      });
    } else {
      closedAnswers.push(formatClosedAnswer(q, raw));
    }
  }

  return { closedAnswers, openAnswers };
}

function formatClosedAnswer(
  q: CatchupQuestion,
  raw: unknown,
): ClosedAnswerInput {
  if (q.type === "scale") {
    const n = typeof raw === "number" ? raw : Number(raw);
    return {
      question_key: q.key,
      question_text: q.prompt,
      answer_value: String(n),
      answer_label: `${n} of ${q.max} (${q.lowLabel} ↔ ${q.highLabel})`,
    };
  }
  if (q.type === "closed") {
    const value = typeof raw === "string" ? raw : String(raw);
    const option = q.options.find((o) => o.value === value);
    return {
      question_key: q.key,
      question_text: q.prompt,
      answer_value: value,
      answer_label: option?.label ?? value,
    };
  }
  // Fallback (shouldn't hit — open answers go elsewhere).
  return {
    question_key: q.key,
    question_text: q.prompt,
    answer_value: String(raw),
    answer_label: String(raw),
  };
}

// ────────────────────────────────────────────────────────────────────
// Session
// ────────────────────────────────────────────────────────────────────

async function handleSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entryId: string,
): Promise<NextResponse> {
  const { data: row } = await supabase
    .from("sessions")
    .select(
      "id, topic, held_question, transcript, closed_at, detail_summary, detail_recommendation, created_at",
    )
    .eq("user_id", userId)
    .eq("id", entryId)
    .maybeSingle<SessionRow>();

  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Sessions that are still open have nothing finished to summarise.
  if (!row.closed_at) {
    return NextResponse.json(
      { error: "session not closed yet" },
      { status: 409 },
    );
  }

  if (row.detail_summary && row.detail_recommendation) {
    return NextResponse.json({
      summary: row.detail_summary,
      recommendation: row.detail_recommendation,
    });
  }

  const transcript = (row.transcript ?? []).filter(
    (t) => t.role === "user" || t.role === "analyst",
  );
  const userText = transcript
    .filter((t) => t.role === "user")
    .map((t) => t.text.trim())
    .filter(Boolean)
    .join("\n\n");

  // For sessions the user's input is the transcript itself; we run the
  // validator on the combined user text and project it back as a single
  // open-answer entry so the prompt's "all non-meaningful" branch fires
  // when the session was silent or junk.
  const openAnswers: OpenAnswerInput[] =
    userText.length === 0
      ? [
          {
            question_key: "session_user_input",
            question_text: row.held_question || "the held question",
            answer: "(empty session)",
            meaningful: false,
          },
        ]
      : [
          {
            question_key: "session_user_input",
            question_text: row.held_question || "the held question",
            answer: userText,
            meaningful: isMeaningful(userText).meaningful,
          },
        ];

  const intake = await loadIntakeSnippets(supabase, userId);

  const promptInput: CaseDetailPromptInput = {
    entryKind: "session",
    entryTitle: row.topic ?? "Consultation",
    occurredAt: row.closed_at,
    closedAnswers: [],
    openAnswers,
    transcript,
    intake,
  };

  const detail = await generateDetail(promptInput, userId);
  if (!detail) {
    return NextResponse.json(
      { error: "generation failed" },
      { status: 502 },
    );
  }

  await supabase
    .from("sessions")
    .update({
      detail_summary: detail.summary,
      detail_recommendation: detail.recommendation,
    })
    .eq("id", row.id)
    .eq("user_id", userId);

  return NextResponse.json(detail);
}

// ────────────────────────────────────────────────────────────────────
// Intake snippets — one short line per step, just enough fingerprint
// for the model to ground recommendations.
// ────────────────────────────────────────────────────────────────────

type IntakePayloadRow = {
  step_number: number;
  step_slug: string;
  payload: Record<string, unknown> | null;
};

async function loadIntakeSnippets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<IntakeSnippet[]> {
  const { data } = await supabase
    .from("intake_responses")
    .select("step_number, step_slug, payload")
    .eq("user_id", userId);

  const rows = (data ?? []) as IntakePayloadRow[];
  const byStep = new Map<number, IntakePayloadRow>();
  for (const r of rows) byStep.set(r.step_number, r);

  const out: IntakeSnippet[] = [];
  for (const step of STEPS) {
    const row = byStep.get(step.number);
    if (!row || !row.payload) continue;
    const line = summariseStep(step.closeQuestions as AnyQuestion[], row.payload);
    if (line) out.push({ step_slug: step.slug, one_line: line });
  }
  return out;
}

function summariseStep(
  questions: AnyQuestion[],
  payload: Record<string, unknown>,
): string {
  const fragments: string[] = [];

  for (const q of questions) {
    const value = payload[q.id];
    if (value == null) continue;
    if (q.kind === "scale" || q.kind === "number") {
      if (typeof value === "number" && Number.isFinite(value)) {
        fragments.push(`${shortenTitle(q.title)}: ${value}`);
      }
    } else if (q.kind === "single") {
      if (typeof value === "string") {
        const opt = q.options.find((o) => o.value === value);
        fragments.push(`${shortenTitle(q.title)}: ${opt?.label ?? value}`);
      }
    } else if (q.kind === "multi") {
      if (Array.isArray(value) && value.length > 0) {
        const labels = value
          .map((v) => {
            const opt = q.options.find((o) => o.value === v);
            return opt?.label ?? String(v);
          })
          .join(", ");
        fragments.push(`${shortenTitle(q.title)}: ${labels}`);
      }
    }
  }

  return fragments.slice(0, 4).join(" · ");
}

function shortenTitle(title: string): string {
  return title.replace(/\.$/, "").toLowerCase();
}

// ────────────────────────────────────────────────────────────────────
// AI call + word-cap enforcement
// ────────────────────────────────────────────────────────────────────

async function generateDetail(
  input: CaseDetailPromptInput,
  userId: string,
): Promise<CaseDetailResponse | null> {
  const { system, messages } = buildCaseDetailPrompt(input);
  try {
    const { text } = await callAI("case_detail", {
      system,
      messages,
      jsonMode: true,
      maxTokens: 400,
      temperature: 0.35,
      userId,
      timeoutMs: 45_000,
    });
    return parseAndCap(text);
  } catch {
    return null;
  }
}

function parseAndCap(raw: string): CaseDetailResponse | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const summary =
    typeof obj.summary === "string" && obj.summary.trim().length > 0
      ? enforceWordCap(obj.summary.trim(), MAX_WORDS_PER_SECTION)
      : "";
  const recommendation =
    typeof obj.recommendation === "string" &&
    obj.recommendation.trim().length > 0
      ? enforceWordCap(obj.recommendation.trim(), MAX_WORDS_PER_SECTION)
      : "";
  if (!summary || !recommendation) return null;
  return { summary, recommendation };
}

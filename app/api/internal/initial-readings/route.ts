import { NextResponse } from "next/server";
import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { STEPS } from "@/lib/onboarding/steps";
import {
  buildInitialReadingsPrompt,
  type IntakeAnswerInput,
  type InitialReadingsResponse,
} from "@/lib/ai/prompts/initial-readings";
import { callAI } from "@/lib/ai/router";
import { classifySafety } from "@/lib/ai/safety";
import { recomputeDepthFor } from "@/lib/depth";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";

// POST /api/internal/initial-readings
//
// Service-role authenticated (header X-Internal-Token must match
// AI_INTERNAL_TOKEN). Triggered from submitIntake() after a user
// finishes onboarding. Runs in the background — the HTTP response
// returns as soon as users_meta.initial_readings_status flips to
// 'generating', the work continues in waitUntil().
//
// Steps:
//   1. Load all intake_responses for the user.
//   2. Run classifySafety on every free-text answer.
//   3. Generate v2 readings for all 12 slugs in one model call.
//   4. Insert new block_readings rows, supersede the v1 placeholders.
//   5. Recompute depth.
//   6. Mark initial_readings_status = 'ready'.
//
// Failures are caught and recorded: status flips to 'failed', the
// user sees a quiet retry affordance in /room.

type InitialReadingsBody = { user_id?: string };

const TOKEN_HEADER = "x-internal-token";

function tokenOk(req: Request): boolean {
  const required = process.env.AI_INTERNAL_TOKEN;
  if (!required) return false;
  return req.headers.get(TOKEN_HEADER) === required;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!tokenOk(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "service role unavailable" },
      { status: 503 },
    );
  }

  let body: InitialReadingsBody;
  try {
    body = (await request.json()) as InitialReadingsBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const userId = body.user_id;
  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  // Flip to generating up front. If the column was missing in legacy
  // rows the update is a no-op; the user simply does not see a
  // pending state and gets v1 seed copy until this completes.
  await admin
    .from("users_meta")
    .update({ initial_readings_status: "generating" })
    .eq("user_id", userId);

  // Fire-and-forget the background work — but await within a try so
  // unexpected throws can flip the row to failed.
  void runInitialReadingsJob(userId);

  return NextResponse.json({ ok: true, started: true }, { status: 202 });
}

async function runInitialReadingsJob(userId: string): Promise<void> {
  const admin = adminClient();
  if (!admin) return;

  try {
    const intake = await loadIntake(userId);

    // Safety pass — every free-text answer. Failures here are
    // tolerated; classifySafety has its own fallback that writes a
    // low-severity flag on classifier failure.
    const freeText = intake.filter(isOpenAnswer);
    await Promise.all(
      freeText.map((a) =>
        classifySafety(stringifyAnswer(a.answer), userId, "intake").catch(
          () => undefined,
        ),
      ),
    );

    // Generate the readings.
    const { system, messages } = buildInitialReadingsPrompt({ intake });
    const { text } = await callAI("initial_readings", {
      system,
      messages,
      jsonMode: true,
      maxTokens: 3500,
      temperature: 0.4,
      userId,
      timeoutMs: 90_000,
    });

    const parsed = parseInitialReadingsResponse(text);

    // Load current v1 (or latest) rows so we can supersede them.
    const { data: existing } = await admin
      .from("block_readings")
      .select("id, block_slug, version")
      .eq("user_id", userId)
      .is("superseded_at", null);

    const existingBySlug = new Map<
      string,
      { id: string; version: number }
    >();
    for (const row of (existing ?? []) as Array<{
      id: string;
      block_slug: string;
      version: number;
    }>) {
      existingBySlug.set(row.block_slug, {
        id: row.id,
        version: row.version,
      });
    }

    const nowIso = new Date().toISOString();

    for (const block of BLOCKS) {
      const reading = parsed[block.slug];
      if (!reading) continue;
      const prior = existingBySlug.get(block.slug);
      const nextVersion = (prior?.version ?? 1) + 1;
      const safeWeight = clamp01(reading.weight ?? 0.15);

      const { error: insErr } = await admin.from("block_readings").insert({
        user_id: userId,
        block_slug: block.slug,
        reading: reading.reading,
        takeaway: reading.takeaway,
        definition: reading.definition || block.definition,
        weight: safeWeight,
        version: nextVersion,
        last_refined_source: "intake",
      });
      if (insErr) continue;

      if (prior) {
        await admin
          .from("block_readings")
          .update({ superseded_at: nowIso })
          .eq("id", prior.id);
      }
    }

    await recomputeDepthFor(userId, admin);

    await admin
      .from("users_meta")
      .update({ initial_readings_status: "ready" })
      .eq("user_id", userId);
  } catch {
    await admin
      .from("users_meta")
      .update({ initial_readings_status: "failed" })
      .eq("user_id", userId);
  }
}

async function loadIntake(userId: string): Promise<IntakeAnswerInput[]> {
  const admin = adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("intake_responses")
    .select("step_number, payload")
    .eq("user_id", userId);

  const rows = (data ?? []) as Array<{
    step_number: number;
    payload: Record<string, unknown> | null;
  }>;

  const out: IntakeAnswerInput[] = [];
  for (const row of rows) {
    const step = STEPS.find((s) => s.number === row.step_number);
    if (!step) continue;
    const payload = row.payload ?? {};
    const all = [...step.closeQuestions, ...step.openQuestions];
    for (const q of all) {
      const value = (payload as Record<string, unknown>)[q.id];
      if (value === undefined) continue;
      out.push({
        question_key: q.id,
        question_text: q.title,
        answer: value,
      });
    }
  }
  return out;
}

function isOpenAnswer(a: IntakeAnswerInput): boolean {
  // Open answers in the intake are stored as strings under their
  // q{step}_{n} key; close answers are arrays, scales, or option
  // strings. Treat strings of meaningful length as open free text.
  if (typeof a.answer !== "string") return false;
  return a.answer.trim().length >= 8;
}

function stringifyAnswer(a: unknown): string {
  if (typeof a === "string") return a;
  if (a == null) return "";
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

function parseInitialReadingsResponse(raw: string): InitialReadingsResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("initial_readings returned non-JSON");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("initial_readings returned non-object");
  }
  const out = {} as InitialReadingsResponse;
  const map = parsed as Record<string, unknown>;
  for (const block of BLOCKS) {
    const raw = map[block.slug];
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    out[block.slug as BlockSlug] = {
      reading: typeof r.reading === "string" ? r.reading : "",
      takeaway: typeof r.takeaway === "string" ? r.takeaway : "",
      definition:
        typeof r.definition === "string" ? r.definition : block.definition,
      weight: typeof r.weight === "number" ? r.weight : 0.15,
    };
  }
  return out;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.15;
  if (n < 0) return 0;
  if (n > 0.95) return 0.95;
  return n;
}

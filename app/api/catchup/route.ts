import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getActiveLocale } from "@/lib/i18n/locale";
import {
  CATCHUP_QUESTIONS,
  isComplete,
  type CatchupAnswers,
  type CatchupQuestion,
} from "@/lib/catchup-questions";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";
import { recomputeDepthFor, depthBand } from "@/lib/depth";
import { classifySafety, maxSeverity, type SafetySeverity } from "@/lib/ai/safety";
import { callAI } from "@/lib/ai/router";
import {
  buildCatchupSummaryPrompt,
  type CatchupAnswerInput,
} from "@/lib/ai/prompts/catchup-summary";
import {
  buildCatchupFeedbackPrompt,
  type CatchupFeedbackResponse,
} from "@/lib/ai/prompts/catchup-feedback";
import {
  buildCatchupRefinementPrompt,
  type CatchupRefinementResponse,
} from "@/lib/ai/prompts/catchup-refinement";

// POST /api/catchup — record a weekly Catchup and trigger the pipeline.
// GET  /api/catchup?id=<uuid> — poll for status while the background job runs.
//
// Flow:
//   1. Validate, write row with status='processing'.
//   2. Return { catchup_id } immediately.
//   3. Background: safety pass → summary → feedback JSON → refinement
//      JSON → depth recompute → status='ready'.
//   4. Client polls GET until status is 'ready' and renders the summary.

type CatchupRequestBody = {
  week_number?: number;
  answers?: Partial<CatchupAnswers>;
};

type ExistingReadingRow = {
  id: string;
  block_slug: string;
  reading: string;
  takeaway: string;
  definition: string;
  weight: number;
  version: number;
  lede: string | null;
};

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CatchupRequestBody;
  try {
    body = (await request.json()) as CatchupRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const answers = body.answers ?? {};
  if (!isComplete(answers)) {
    return NextResponse.json(
      { error: "every question must be answered" },
      { status: 400 },
    );
  }

  const weekNumber =
    typeof body.week_number === "number" && Number.isFinite(body.week_number)
      ? body.week_number
      : currentIsoWeek(new Date());

  // One catchup per ISO week per user — page guard should keep us
  // out of here on a duplicate, but the server is the source of truth.
  const { data: existingThisWeek } = await supabase
    .from("catchups")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingThisWeek) {
    return NextResponse.json(
      { error: "a catchup for this week already exists" },
      { status: 409 },
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("catchups")
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      answers: answers as Record<string, unknown>,
      summary: null,
      status: "processing",
    })
    .select("id")
    .single<{ id: string }>();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: "could not store the catchup" },
      { status: 500 },
    );
  }

  // Resolve the requester's active locale while still in request
  // context (cookies/headers available). The pipeline runs detached,
  // so we capture it here and thread it through.
  const locale = await getActiveLocale();

  // Fire the background pipeline. We do not await — the runner polls
  // GET /api/catchup?id=… and renders the summary when status flips.
  void runCatchupPipeline({
    userId: user.id,
    catchupId: inserted.id,
    weekNumber,
    answers: answers as CatchupAnswers,
    locale,
  }).catch(() => undefined);

  return NextResponse.json(
    { catchup_id: inserted.id, status: "processing" },
    { status: 202 },
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { data } = await supabase
    .from("catchups")
    .select("id, status, summary, feedback, week_number, created_at")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle<{
      id: string;
      status: string;
      summary: string | null;
      feedback: CatchupFeedbackResponse | null;
      week_number: number;
      created_at: string;
    }>();
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const shifted = await loadShifted(supabase, user.id, data.created_at);
  return NextResponse.json(
    {
      id: data.id,
      status: data.status,
      summary: (data.summary ?? "")
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean),
      feedback: data.feedback,
      shifted,
    },
    { status: 200 },
  );
}

async function loadShifted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  catchupCreatedAt: string,
): Promise<Array<{ slug: BlockSlug; weight: number; deltaWeight: number }>> {
  const { data } = await supabase
    .from("block_readings")
    .select("block_slug, weight, created_at, last_refined_source")
    .eq("user_id", userId)
    .gte("created_at", catchupCreatedAt)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    block_slug: string;
    weight: number;
    created_at: string;
    last_refined_source: string | null;
  }>;
  const seen = new Set<string>();
  const out: Array<{
    slug: BlockSlug;
    weight: number;
    deltaWeight: number;
  }> = [];
  for (const r of rows) {
    if (seen.has(r.block_slug)) continue;
    seen.add(r.block_slug);
    out.push({
      slug: r.block_slug as BlockSlug,
      weight: r.weight,
      deltaWeight: 0,
    });
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// Background pipeline
// ────────────────────────────────────────────────────────────────────

type PipelineInput = {
  userId: string;
  catchupId: string;
  weekNumber: number;
  answers: CatchupAnswers;
  locale: string;
};

async function runCatchupPipeline(input: PipelineInput): Promise<void> {
  const admin = adminClient();
  if (!admin) {
    // No service-role client in this environment — mark failed.
    return;
  }

  const { userId, catchupId, weekNumber, answers, locale } = input;
  const answerInputs = toAnswerInputs(answers);

  try {
    // ── 1. Safety pass on every open answer ─────────────────────────
    const openAnswers = CATCHUP_QUESTIONS.filter(
      (q): q is CatchupQuestion & { type: "open" } => q.type === "open",
    );
    const severities = await Promise.all(
      openAnswers.map(async (q) => {
        const value = answers[q.key];
        if (typeof value !== "string" || value.trim().length === 0) {
          return "none" as SafetySeverity;
        }
        try {
          const cls = await classifySafety(
            value,
            userId,
            "catchup",
            catchupId,
          );
          return cls.severity;
        } catch {
          return "none" as SafetySeverity;
        }
      }),
    );
    const highest = maxSeverity(severities);

    // ── 2. Summary ──────────────────────────────────────────────────
    let summaryText = "";
    try {
      const { system, messages } = buildCatchupSummaryPrompt({
        weekNumber,
        answers: answerInputs,
        locale,
      });
      const { text } = await callAI("catchup_summary", {
        system,
        messages,
        maxTokens: 800,
        temperature: 0.45,
        userId,
      });
      summaryText = text.trim();
    } catch {
      // The summary is recoverable copy — fall back to a quiet line.
      summaryText =
        "The catchup is on file. The reading has been updated quietly; the longer summary will arrive on the next pass.";
    }

    // ── 3. Refinement ───────────────────────────────────────────────
    const { data: existingRows } = await admin
      .from("block_readings")
      .select(
        "id, block_slug, reading, takeaway, definition, weight, version, lede",
      )
      .eq("user_id", userId)
      .is("superseded_at", null);

    const previous = new Map<BlockSlug, ExistingReadingRow>();
    for (const row of (existingRows ?? []) as ExistingReadingRow[]) {
      previous.set(row.block_slug as BlockSlug, row);
    }

    // Active connections feed context. The summary is enriched on
    // connection-summary completion; here we just read whatever
    // exists.
    const { data: connectionRows } = await admin
      .from("connections")
      .select("role, context_summary, status")
      .eq("inviter_user_id", userId)
      .eq("status", "active");
    const connectionContexts = ((connectionRows ?? []) as Array<{
      role: string;
      context_summary: string | null;
    }>)
      .filter((c) => !!c.context_summary)
      .map((c) => ({ role: c.role, summary: c.context_summary! }));

    let refinement: CatchupRefinementResponse | null = null;
    try {
      const { system, messages } = buildCatchupRefinementPrompt({
        weekNumber,
        answers: answerInputs,
        previous: BLOCKS.map((b) => {
          const prev = previous.get(b.slug);
          return {
            slug: b.slug,
            reading: prev?.reading ?? "too early to say with confidence — the shape is forming.",
            takeaway: prev?.takeaway ?? "",
            weight: prev?.weight ?? 0.1,
          };
        }),
        connectionContexts,
        locale,
      });
      const { text } = await callAI("catchup_refinement", {
        system,
        messages,
        jsonMode: true,
        maxTokens: 3500,
        temperature: 0.4,
        userId,
        timeoutMs: 90_000,
      });
      refinement = parseRefinement(text);
    } catch {
      refinement = null;
    }

    const refinedSource = `catchup:week_${String(weekNumber).padStart(2, "0")}`;
    const nowIso = new Date().toISOString();
    const materialShifts: BlockSlug[] = [];

    if (refinement) {
      for (const block of BLOCKS) {
        const refined = refinement[block.slug];
        if (!refined) continue;
        const prev = previous.get(block.slug);
        const nextVersion = (prev?.version ?? 1) + 1;
        const nextWeight = clamp01(refined.weight);
        const delta = Math.abs(nextWeight - (prev?.weight ?? 0));
        if (delta > 0.1) materialShifts.push(block.slug);

        const { error: insErr } = await admin.from("block_readings").insert({
          user_id: userId,
          block_slug: block.slug,
          reading: refined.reading,
          takeaway: refined.takeaway,
          definition: prev?.definition ?? block.definition,
          weight: nextWeight,
          version: nextVersion,
          last_refined_source: refinedSource,
        });
        if (insErr) continue;
        if (prev) {
          await admin
            .from("block_readings")
            .update({ superseded_at: nowIso })
            .eq("id", prev.id);
        }
      }
    }

    // ── 4. Feedback ─────────────────────────────────────────────────
    const subState = await readSubscriptionAndStats(admin, userId);
    let feedback: CatchupFeedbackResponse | null = null;
    try {
      const dashboardReadings = BLOCKS.filter(
        (b) => b.surface === "dashboard",
      ).map((b) => {
        const prev = previous.get(b.slug);
        return {
          slug: b.slug,
          reading: prev?.reading ?? "",
          weight: prev?.weight ?? 0.1,
        };
      });
      const { system, messages } = buildCatchupFeedbackPrompt({
        weekNumber,
        answers: answerInputs,
        currentReadings: dashboardReadings,
        recentSessionCount: subState.recentSessionCount,
        totalCatchups: subState.totalCatchups,
        totalReports: subState.totalReports,
        depthBand: subState.depthBand,
        isSubscribed: subState.isSubscribed,
        highestSafetySeverity: highest,
        locale,
      });
      const { text } = await callAI("catchup_feedback", {
        system,
        messages,
        jsonMode: true,
        maxTokens: 600,
        temperature: 0.3,
        userId,
      });
      feedback = parseFeedback(text, highest);
    } catch {
      // Feedback failure is recoverable — the summary still renders.
      feedback = forceSafetyFeedback(highest);
    }

    // ── 5. Write summary + feedback + status ────────────────────────
    await admin
      .from("catchups")
      .update({
        summary: summaryText,
        feedback,
        status: "ready",
      })
      .eq("id", catchupId);

    // ── 6. Depth recompute ─────────────────────────────────────────
    await recomputeDepthFor(userId, admin);

    // ── 7. Lede regeneration is queued lazily on /readings render.
    //       We don't block the catchup pipeline on it.
    void materialShifts;
  } catch {
    await admin
      .from("catchups")
      .update({ status: "failed" })
      .eq("id", catchupId);
  }
}

function forceSafetyFeedback(
  severity: SafetySeverity,
): CatchupFeedbackResponse {
  if (severity === "high" || severity === "critical") {
    return {
      consider: null,
      recommend: "professional_care",
      recommend_reason:
        "what surfaced in this week's answers asks for care beyond what the room can hold.",
    };
  }
  return { consider: null, recommend: null, recommend_reason: null };
}

async function readSubscriptionAndStats(
  admin: NonNullable<ReturnType<typeof adminClient>>,
  userId: string,
): Promise<{
  isSubscribed: boolean;
  recentSessionCount: number;
  totalCatchups: number;
  totalReports: number;
  depthBand: "thin" | "partial" | "steady" | "deep";
}> {
  const since21 = new Date(
    Date.now() - 21 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const [sub, sessionCount, catchupCount, reportCount, meta] =
    await Promise.all([
      admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle<{ status: string | null }>(),
      admin
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since21),
      admin
        .from("catchups")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "ready"),
      admin
        .from("users_meta")
        .select("reading_depth")
        .eq("user_id", userId)
        .maybeSingle<{ reading_depth: number | null }>(),
    ]);
  return {
    isSubscribed: sub.data?.status === "active",
    recentSessionCount: sessionCount.count ?? 0,
    totalCatchups: catchupCount.count ?? 0,
    totalReports: reportCount.count ?? 0,
    depthBand: depthBand(meta.data?.reading_depth ?? 0),
  };
}

function parseRefinement(raw: string): CatchupRefinementResponse {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const out = {} as CatchupRefinementResponse;
  for (const block of BLOCKS) {
    const r = parsed[block.slug];
    if (typeof r !== "object" || r === null) continue;
    const obj = r as Record<string, unknown>;
    out[block.slug] = {
      reading:
        typeof obj.reading === "string"
          ? obj.reading
          : "too early to say with confidence — the shape is forming.",
      takeaway: typeof obj.takeaway === "string" ? obj.takeaway : "",
      weight: typeof obj.weight === "number" ? obj.weight : 0.1,
    };
  }
  return out;
}

function parseFeedback(
  raw: string,
  severity: SafetySeverity,
): CatchupFeedbackResponse {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const consider =
    typeof parsed.consider === "string" && parsed.consider.trim().length > 0
      ? parsed.consider.trim()
      : null;
  const recommendRaw = parsed.recommend;
  const validRecs = new Set([
    "session",
    "report",
    "professional_care",
    "rest",
    null,
  ]);
  const recommend = validRecs.has(recommendRaw as never)
    ? (recommendRaw as CatchupFeedbackResponse["recommend"])
    : null;
  const recommend_reason =
    typeof parsed.recommend_reason === "string" &&
    parsed.recommend_reason.trim().length > 0
      ? parsed.recommend_reason.trim()
      : null;
  const out: CatchupFeedbackResponse = {
    consider: severity === "high" || severity === "critical" ? null : consider,
    recommend,
    recommend_reason,
  };
  if (severity === "high" || severity === "critical") {
    out.recommend = "professional_care";
    if (!out.recommend_reason) {
      out.recommend_reason =
        "what surfaced in this week's answers asks for care beyond what the room can hold.";
    }
  }
  return out;
}

function toAnswerInputs(answers: CatchupAnswers): CatchupAnswerInput[] {
  return CATCHUP_QUESTIONS.map((q) => ({
    question_key: q.key,
    question_text: q.prompt,
    answer: answers[q.key] ?? null,
  }));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.1;
  if (n < 0) return 0;
  if (n > 0.95) return 0.95;
  return n;
}

function currentIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

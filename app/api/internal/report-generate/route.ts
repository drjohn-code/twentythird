import "server-only";
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { callAI } from "@/lib/ai/router";
import {
  buildReportGenerationPrompt,
  type ReportDocument,
  type ReportGenerationInput,
} from "@/lib/ai/prompts/report-generation";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";
import {
  captureReportArtifact,
  safetySummaryFrom,
  uploadReportArtifact,
} from "@/lib/ai/report-store";

// POST /api/internal/report-generate
//
// Body: { report_id: string }
// Header: x-internal-token: <AI_INTERNAL_TOKEN>
//
// Background generator for a queued report row. Fired from the
// public /api/reports route after the row is inserted. Loads all
// inputs, calls the model, renders to the internal PDF page,
// captures to storage, marks ready.

type Body = { report_id?: string };

function tokenOk(req: Request): boolean {
  const required = process.env.AI_INTERNAL_TOKEN;
  if (!required) return false;
  return req.headers.get("x-internal-token") === required;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!tokenOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const reportId = body.report_id;
  if (typeof reportId !== "string" || !reportId) {
    return NextResponse.json({ error: "report_id required" }, { status: 400 });
  }

  void generateReport(reportId).catch(() => undefined);
  return NextResponse.json({ ok: true, started: true }, { status: 202 });
}

async function generateReport(reportId: string): Promise<void> {
  const admin = adminClient();
  if (!admin) return;

  const { data: report } = await admin
    .from("reports")
    .select("id, user_id, status, depth_at_generation")
    .eq("id", reportId)
    .maybeSingle<{
      id: string;
      user_id: string;
      status: string;
      depth_at_generation: number | null;
    }>();
  if (!report) return;

  await admin
    .from("reports")
    .update({ status: "generating" })
    .eq("id", report.id);

  try {
    const input = await buildGenerationInput(report.user_id, report.depth_at_generation ?? 0);
    const { system, messages } = buildReportGenerationPrompt(input);

    const { text } = await callAI("report_generation", {
      system,
      messages,
      jsonMode: true,
      maxTokens: 6000,
      temperature: 0.4,
      userId: report.user_id,
      timeoutMs: 180_000,
    });

    const doc = parseReportDocument(text);

    // Acknowledge any safety flags the report includes.
    if (doc.clinical_priorities.length > 0) {
      const severities = doc.clinical_priorities.map((p) => p.severity);
      await admin
        .from("safety_flags")
        .update({ acknowledged_at: new Date().toISOString() })
        .eq("user_id", report.user_id)
        .in("severity", severities)
        .is("acknowledged_at", null);
    }

    // Persist the structured document on the row so the PDF page
    // can render it without re-calling the model.
    await admin
      .from("reports")
      .update({
        safety_summary: safetySummaryFrom(doc),
      })
      .eq("id", report.id);

    // Render-and-capture. The internal PDF page reads the row +
    // calls a generator-cache lookup; we pass the JSON doc through
    // by writing it onto a side cache (the row's status remains
    // 'generating' until the capture lands).
    const docCache = ensureCache();
    docCache.set(report.id, doc);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const internalToken = process.env.AI_INTERNAL_TOKEN ?? "";
    const renderUrl = `${siteUrl}/internal/report-pdf/${report.id}?t=${encodeURIComponent(internalToken)}`;

    const artifact = await captureReportArtifact(renderUrl);
    const path = await uploadReportArtifact(
      report.user_id,
      report.id,
      artifact,
    );

    await admin
      .from("reports")
      .update({
        status: "ready",
        pdf_url: path,
      })
      .eq("id", report.id);

    docCache.delete(report.id);
  } catch {
    await admin
      .from("reports")
      .update({ status: "failed" })
      .eq("id", reportId);
  }
}

async function buildGenerationInput(
  userId: string,
  depth: number,
): Promise<ReportGenerationInput> {
  const admin = adminClient();
  if (!admin) {
    throw new Error("admin client unavailable");
  }

  const [
    profileRes,
    intakeRes,
    readingsRes,
    catchupsRes,
    sessionsRes,
    connRes,
    flagsRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle<{ full_name: string | null }>(),
    admin
      .from("intake_responses")
      .select("step_number, payload")
      .eq("user_id", userId),
    admin
      .from("block_readings")
      .select("block_slug, reading, takeaway, definition, weight")
      .eq("user_id", userId)
      .is("superseded_at", null),
    admin
      .from("catchups")
      .select("week_number, created_at, summary")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("sessions")
      .select("topic, held_question, closed_at, transcript")
      .eq("user_id", userId)
      .not("closed_at", "is", null)
      .order("closed_at", { ascending: false })
      .limit(8),
    admin
      .from("connections")
      .select("role, connection_first_name, context_summary, status")
      .eq("inviter_user_id", userId)
      .eq("status", "active"),
    admin
      .from("safety_flags")
      .select("severity, categories, excerpt")
      .eq("user_id", userId)
      .in("severity", ["medium", "high", "critical"]),
  ]);

  const inviterFirstName = firstName(profileRes.data?.full_name ?? null);

  // Intake: map each step payload back to (question_key, question_text, answer)
  // Defer loading the STEPS module statically — the user-side schema
  // mapping is what the prompt wants.
  const { STEPS } = await import("@/lib/onboarding/steps");
  const intakeAnswers: ReportGenerationInput["intake"] = [];
  for (const row of (intakeRes.data ?? []) as Array<{
    step_number: number;
    payload: Record<string, unknown> | null;
  }>) {
    const step = STEPS.find((s) => s.number === row.step_number);
    if (!step) continue;
    const payload = row.payload ?? {};
    const all = [...step.closeQuestions, ...step.openQuestions];
    for (const q of all) {
      const value = (payload as Record<string, unknown>)[q.id];
      if (value === undefined) continue;
      intakeAnswers.push({
        question_key: q.id,
        question_text: q.title,
        answer: value,
      });
    }
  }

  const readingMap = new Map<string, {
    reading: string;
    takeaway: string;
    definition: string;
    weight: number;
  }>();
  for (const r of (readingsRes.data ?? []) as Array<{
    block_slug: string;
    reading: string;
    takeaway: string;
    definition: string;
    weight: number;
  }>) {
    readingMap.set(r.block_slug, r);
  }

  const currentReadings: ReportGenerationInput["currentReadings"] = BLOCKS.map(
    (b) => {
      const row = readingMap.get(b.slug);
      return {
        slug: b.slug as BlockSlug,
        subtitle: b.subtitle,
        definition: row?.definition ?? b.definition,
        reading: row?.reading ?? "too early to say with confidence — the shape is forming.",
        takeaway: row?.takeaway ?? "",
        weight: row?.weight ?? 0.1,
      };
    },
  );

  const catchups = ((catchupsRes.data ?? []) as Array<{
    week_number: number;
    created_at: string;
    summary: string | null;
  }>).map((c) => ({
    week_number: c.week_number,
    created_at: c.created_at,
    summary: c.summary,
  }));

  const sessions = ((sessionsRes.data ?? []) as Array<{
    topic: string | null;
    held_question: string;
    closed_at: string | null;
    transcript: Array<{ role: string; text: string }> | null;
  }>).map((s) => {
    const closing = (s.transcript ?? [])
      .filter((t) => t.role === "analyst")
      .map((t) => t.text)
      .slice(-1)[0] ?? null;
    return {
      topic: s.topic,
      held_question: s.held_question,
      closed_at: s.closed_at,
      closing,
    };
  });

  const connections = ((connRes.data ?? []) as Array<{
    role: string;
    connection_first_name: string | null;
    context_summary: string | null;
  }>).map((c) => ({
    role: c.role,
    firstName: c.connection_first_name,
    summary: c.context_summary,
  }));

  const safetyFlags = ((flagsRes.data ?? []) as Array<{
    severity: "medium" | "high" | "critical";
    categories: string[];
    excerpt: string | null;
  }>).map((f) => ({
    severity: f.severity,
    categories: f.categories ?? [],
    excerpt: f.excerpt,
  }));

  return {
    inviterFirstName,
    generatedAt: new Date().toISOString(),
    depth,
    intake: intakeAnswers,
    currentReadings,
    catchups,
    sessions,
    connections,
    safetyFlags,
  };
}

function firstName(full: string | null): string | null {
  if (!full) return null;
  return full.trim().split(/\s+/)[0] ?? null;
}

function parseReportDocument(raw: string): ReportDocument {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const out: ReportDocument = {
    clinical_priorities: Array.isArray(parsed.clinical_priorities)
      ? (parsed.clinical_priorities as Array<{
          severity?: unknown;
          category?: unknown;
          note?: unknown;
        }>)
          .filter(
            (p) =>
              (p.severity === "high" || p.severity === "medium") &&
              typeof p.category === "string" &&
              typeof p.note === "string",
          )
          .map((p) => ({
            severity: p.severity as "high" | "medium",
            category: p.category as string,
            note: p.note as string,
          }))
      : [],
    executive_summary:
      typeof parsed.executive_summary === "string"
        ? parsed.executive_summary
        : "",
    blocks: {},
    relational_field:
      typeof parsed.relational_field === "string"
        ? parsed.relational_field
        : null,
    trajectory:
      typeof parsed.trajectory === "string" ? parsed.trajectory : "",
    questions_for_the_analyst: Array.isArray(parsed.questions_for_the_analyst)
      ? (parsed.questions_for_the_analyst as unknown[])
          .filter((q): q is string => typeof q === "string")
      : [],
  };
  const blocksRaw =
    parsed.blocks && typeof parsed.blocks === "object"
      ? (parsed.blocks as Record<string, unknown>)
      : {};
  for (const b of BLOCKS) {
    const entry = blocksRaw[b.slug];
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Record<string, unknown>;
    out.blocks[b.slug as BlockSlug] = {
      reading: typeof obj.reading === "string" ? obj.reading : "",
      interpretation:
        typeof obj.interpretation === "string" ? obj.interpretation : "",
      evidence: Array.isArray(obj.evidence)
        ? (obj.evidence as unknown[]).filter(
            (e): e is string => typeof e === "string",
          )
        : [],
      clinical_naming:
        typeof obj.clinical_naming === "string" ? obj.clinical_naming : "",
    };
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// Cross-route cache for the rendered HTML page to read while we
// capture. The cache lives only in the process serving the request;
// the internal HTML route + capture call happen in the same process.
// ────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __reportDocCache: Map<string, ReportDocument> | undefined;
}

export function ensureCache(): Map<string, ReportDocument> {
  if (!globalThis.__reportDocCache) {
    globalThis.__reportDocCache = new Map();
  }
  return globalThis.__reportDocCache;
}

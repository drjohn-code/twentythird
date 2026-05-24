import "server-only";
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { recomputeDepthFor } from "@/lib/depth";
import {
  RELATIONSHIP_INTAKE_QUESTIONS,
  isComplete,
  type RelationshipAnswers,
  type RelationshipQuestion,
} from "@/lib/relationship-intake-questions";
import { callAI } from "@/lib/ai/router";
import { buildConnectionSummaryPrompt } from "@/lib/ai/prompts/connection-summary";

// POST /api/connections/relationship-intake
//
// Body:
//   { token: string, answers: { [questionKey]: string | number } }
//
// Verifies the invite token, confirms the connection is active, then
// writes one relationship_intake_answers row per question (idempotent
// upsert by (connection_id, question_key)).
//
// Auth model:
//   - If the request is from an authenticated invitee whose
//     connection_user_id matches the connection, RLS would accept the
//     write. For Phase 6 simplicity (and because the account-creation
//     path is stubbed) we go through the service role with token
//     verification — the token is the authorization.
//
// Critical: the inviter has no endpoint that returns these rows. This
// route only writes. Reads are restricted by the table's RLS policy
// (invitee select only).

type Body = {
  token?: unknown;
  answers?: unknown;
};

const QUESTION_BY_KEY = new Map<string, RelationshipQuestion>(
  RELATIONSHIP_INTAKE_QUESTIONS.map((q) => [q.key, q]),
);

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const rawAnswers =
    body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, unknown>)
      : null;
  if (!rawAnswers) {
    return NextResponse.json({ error: "missing_answers" }, { status: 400 });
  }

  const normalised = normaliseAnswers(rawAnswers);
  if (!normalised) {
    return NextResponse.json({ error: "invalid_answers" }, { status: 400 });
  }
  if (!isComplete(normalised)) {
    return NextResponse.json({ error: "incomplete_answers" }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select(
      "id, inviter_user_id, status, role, connection_first_name",
    )
    .eq("invite_token", token)
    .maybeSingle<{
      id: string;
      inviter_user_id: string;
      status: string;
      role: string;
      connection_first_name: string | null;
    }>();

  if (!conn) {
    return NextResponse.json({ error: "invite_not_found" }, { status: 404 });
  }
  if (conn.status !== "active") {
    return NextResponse.json(
      { error: `connection_${conn.status}` },
      { status: 409 },
    );
  }

  // Delete-and-insert (idempotent retry-safe). The intake is a single
  // flat write — we replace whatever was there before to avoid dup rows
  // when an invitee re-submits or refreshes during the post.
  const { error: delErr } = await admin
    .from("relationship_intake_answers")
    .delete()
    .eq("connection_id", conn.id);
  if (delErr) {
    return NextResponse.json({ error: "clear_failed" }, { status: 500 });
  }

  const rows = Object.entries(normalised).map(([question_key, value]) => ({
    connection_id: conn.id,
    question_key,
    answer: { value } as Record<string, unknown>,
  }));

  const { error: insErr } = await admin
    .from("relationship_intake_answers")
    .insert(rows);
  if (insErr) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Recompute the inviter's depth — relationship intake completion is
  // already implicitly reflected via active connection contribution,
  // but a recompute keeps `reading_depth_computed_at` fresh.
  await recomputeDepthFor(conn.inviter_user_id, admin);

  // Fire the connection summary in the background. Best-effort —
  // the inviter's catchup / session / report prompts pick it up
  // whenever it lands.
  void generateConnectionSummary({
    connectionId: conn.id,
    inviterUserId: conn.inviter_user_id,
    role: conn.role,
    connectionFirstName: conn.connection_first_name,
    answers: normalised,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}

// ────────────────────────────────────────────────────────────────────
// Connection summary — generated from the relationship intake answers,
// stored on connections.context_summary, injected downstream.
// ────────────────────────────────────────────────────────────────────

type SummaryJob = {
  connectionId: string;
  inviterUserId: string;
  role: string;
  connectionFirstName: string | null;
  answers: RelationshipAnswers;
};

async function generateConnectionSummary(job: SummaryJob): Promise<void> {
  const admin = adminClient();
  if (!admin) return;

  // Look up the inviter's first name for the prompt.
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", job.inviterUserId)
    .maybeSingle<{ full_name: string | null }>();
  const inviterFirst = firstName(inviterProfile?.full_name ?? null);

  const validRoles = new Set([
    "partner",
    "closest_friend",
    "parent",
    "sibling",
    "co_parent",
  ]);
  const role = validRoles.has(job.role)
    ? (job.role as
        | "partner"
        | "closest_friend"
        | "parent"
        | "sibling"
        | "co_parent")
    : "closest_friend";

  const answers = Object.entries(job.answers).map(([key, value]) => {
    const q = QUESTION_BY_KEY.get(key);
    return {
      question_key: key,
      question_text: q?.prompt ?? key,
      answer: value,
    };
  });

  try {
    const { system, messages } = buildConnectionSummaryPrompt({
      role,
      inviterFirstName: inviterFirst,
      connectionFirstName: job.connectionFirstName,
      answers,
    });
    const { text } = await callAI("connection_summary", {
      system,
      messages,
      maxTokens: 500,
      temperature: 0.4,
      userId: job.inviterUserId,
      timeoutMs: 45_000,
    });
    const summary = text.trim();
    if (summary.length === 0) return;
    await admin
      .from("connections")
      .update({ context_summary: summary })
      .eq("id", job.connectionId);
  } catch {
    // best effort — context_summary stays null until the next attempt
  }
}

function firstName(full: string | null): string | null {
  if (!full) return null;
  const trimmed = full.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

// ────────────────────────────────────────────────────────────────────
// validation
// ────────────────────────────────────────────────────────────────────

function normaliseAnswers(
  raw: Record<string, unknown>,
): RelationshipAnswers | null {
  const out: RelationshipAnswers = {};
  for (const [key, value] of Object.entries(raw)) {
    const q = QUESTION_BY_KEY.get(key);
    if (!q) continue; // ignore unknown keys silently — schema drift safety
    if (q.type === "closed") {
      if (typeof value !== "string") return null;
      if (!q.options.some((o) => o.value === value)) return null;
      out[key] = value;
    } else if (q.type === "scale") {
      const n = typeof value === "string" ? Number(value) : value;
      if (typeof n !== "number" || !Number.isFinite(n)) return null;
      const rounded = Math.round(n);
      if (rounded < q.min || rounded > q.max) return null;
      out[key] = rounded;
    } else {
      // open
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (trimmed.length === 0) return null;
      if (trimmed.length > 5000) return null;
      out[key] = trimmed;
    }
  }
  return out;
}

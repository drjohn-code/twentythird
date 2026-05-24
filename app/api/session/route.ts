import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { recomputeDepthFor } from "@/lib/depth";
import { sessionClose } from "@/lib/copy";
import { classifySafety } from "@/lib/ai/safety";
import { callAI, streamAI, AiOverCapacityError } from "@/lib/ai/router";
import { buildSessionReplyPrompt } from "@/lib/ai/prompts/session-reply";
import { buildSessionClosePrompt } from "@/lib/ai/prompts/session-close";

// Consulting session — start / turn (streamed) / close.
//
// turn is now a Server-Sent Events response: each token delta is sent
// as `event: delta\ndata: {"text":"..."}` and the final event is
// `event: done\ndata: {"transcript":[...]}`. The client appends to
// the analyst turn as deltas arrive.

const SOFT_MAX_DURATION_SECONDS = 2 * 60 * 60;
const SESSION_TURN_RATE_LIMIT = 30;

// Per-user hourly rate limit on session turns. The cap is process-local
// for now (acceptable while we run a single Next.js node); a future
// upgrade puts a `rate_limits` table behind it.
const TURNS_PER_HOUR = 30;
const turnCounters = new Map<string, { windowStart: number; count: number }>();

function checkTurnRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const existing = turnCounters.get(userId);
  if (!existing || now - existing.windowStart > windowMs) {
    turnCounters.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  if (existing.count >= TURNS_PER_HOUR) return false;
  existing.count += 1;
  return true;
}

const TOPICS = [
  "Dreaming future",
  "Night dream",
  "Relations in my life",
  "Professional growth",
] as const;

type Topic = (typeof TOPICS)[number];

type Turn = {
  role: "user" | "analyst" | "system";
  text: string;
  at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  topic: string | null;
  held_question: string;
  transcript: Turn[];
  closed_at: string | null;
  duration_seconds: number;
  created_at: string;
};

type SubscriptionRow = { status: string | null };

type StartBody = {
  action: "start";
  topic?: string | null;
  held_question?: string | null;
};
type TurnBody = {
  action: "turn";
  session_id: string;
  text: string;
};
type CloseBody = {
  action: "close";
  session_id: string;
};
type RequestBody = StartBody | TurnBody | CloseBody;

// ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ error: "missing action" }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();
  if (sub?.status !== "active") {
    return NextResponse.json(
      { error: "consulting room requires an active subscription" },
      { status: 402 },
    );
  }

  switch (body.action) {
    case "start":
      return startSession(supabase, user.id, body);
    case "turn":
      return streamTurn(supabase, user.id, body);
    case "close":
      return closeSession(supabase, user.id, body);
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}

// ────────────────────────────────────────────────────────────────────
// start
// ────────────────────────────────────────────────────────────────────

async function startSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: StartBody,
): Promise<Response> {
  const topic = normalizeTopic(body.topic);
  const held =
    typeof body.held_question === "string" && body.held_question.trim()
      ? body.held_question.trim()
      : await deriveHeldQuestion(supabase, userId);

  const { data: openRow } = await supabase
    .from("sessions")
    .select(
      "id, user_id, topic, held_question, transcript, closed_at, duration_seconds, created_at",
    )
    .eq("user_id", userId)
    .is("closed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SessionRow>();

  if (openRow) {
    return NextResponse.json(
      { session: openRow, resumed: true },
      { status: 200 },
    );
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      topic,
      held_question: held,
      transcript: [] as Turn[],
    })
    .select(
      "id, user_id, topic, held_question, transcript, closed_at, duration_seconds, created_at",
    )
    .single<SessionRow>();

  if (error || !data) {
    return NextResponse.json(
      { error: "could not open a session" },
      { status: 500 },
    );
  }
  return NextResponse.json({ session: data, resumed: false }, { status: 201 });
}

// ────────────────────────────────────────────────────────────────────
// turn — Server-Sent Events
// ────────────────────────────────────────────────────────────────────

async function streamTurn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: TurnBody,
): Promise<Response> {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "empty turn" }, { status: 400 });
  }

  const row = await fetchOpenSession(supabase, userId, body.session_id);
  if (!row) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  if (row.closed_at) {
    return NextResponse.json(
      { error: "the session has already closed" },
      { status: 409 },
    );
  }

  // Rate-limit user turns per session — counted from the transcript.
  const userTurnsSoFar = (row.transcript ?? []).filter(
    (t) => t.role === "user",
  ).length;
  if (userTurnsSoFar >= SESSION_TURN_RATE_LIMIT) {
    return NextResponse.json(
      { error: "this session has reached its turn cap." },
      { status: 429 },
    );
  }

  // Hourly per-user cap across all sessions.
  if (!checkTurnRateLimit(userId)) {
    return NextResponse.json(
      { error: "the room asks for a small pause. try again in a few minutes." },
      { status: 429 },
    );
  }

  const userTurn: Turn = {
    role: "user",
    text,
    at: new Date().toISOString(),
  };
  // Persist the user turn immediately so the safety classification
  // and the analyst reply both see it on retry.
  await supabase
    .from("sessions")
    .update({
      transcript: [...(row.transcript ?? []), userTurn],
    })
    .eq("id", row.id)
    .eq("user_id", userId);

  // Connection contexts — current active connections, summaries
  // already produced by lib/ai/safety + connection-summary path.
  const { data: connRows } = await supabase
    .from("connections")
    .select("role, context_summary, connection_first_name, status")
    .eq("inviter_user_id", userId)
    .eq("status", "active");
  const connectionContexts = ((connRows ?? []) as Array<{
    role: string;
    context_summary: string | null;
    connection_first_name: string | null;
  }>)
    .filter((c) => !!c.context_summary)
    .map((c) => ({
      role: c.role,
      firstName: c.connection_first_name,
      summary: c.context_summary!,
    }));

  // Latest dashboard readings.
  const { data: readingsRows } = await supabase
    .from("block_readings")
    .select("block_slug, reading")
    .eq("user_id", userId)
    .is("superseded_at", null);
  const readings = ((readingsRows ?? []) as Array<{
    block_slug: string;
    reading: string;
  }>).map((r) => ({ slug: r.block_slug, reading: r.reading }));

  // Encode SSE response.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      // Safety classification BEFORE the analyst replies.
      let classification;
      try {
        classification = await classifySafety(
          text,
          userId,
          "session",
          row.id,
        );
      } catch {
        classification = {
          severity: "none" as const,
          categories: [],
          excerpt: null,
          reasoning: null,
        };
      }

      // High / critical — synthesize a safety response in the analyst
      // voice. Do not call the analyst model.
      if (
        classification.severity === "high" ||
        classification.severity === "critical"
      ) {
        const safetyText =
          "what you just wrote points to weight that asks for real care — beyond what this room can hold. please reach out to a doctor, therapist, or local crisis line today. we can return to the room when you are safe.";
        const analystTurn: Turn = {
          role: "analyst",
          text: safetyText,
          at: new Date(Date.now() + 1).toISOString(),
        };
        for (const piece of chunk(safetyText, 12)) {
          send("delta", { text: piece });
        }
        await supabase
          .from("sessions")
          .update({
            transcript: [...(row.transcript ?? []), userTurn, analystTurn],
          })
          .eq("id", row.id)
          .eq("user_id", userId);
        send("done", { analyst: analystTurn, safety: true });
        controller.close();
        return;
      }

      // Normal flow — stream the analyst reply.
      const cappedTranscript = (row.transcript ?? []).slice(-20);
      const promptInput = buildSessionReplyPrompt({
        topic: row.topic,
        heldQuestion: row.held_question,
        transcript: [...cappedTranscript, userTurn],
        readings,
        connectionContexts,
        mediumSafetyDistress: classification.severity === "medium",
      });

      let accumulated = "";
      try {
        for await (const ev of streamAI("session_reply", {
          system: promptInput.system,
          messages: promptInput.messages,
          maxTokens: 400,
          temperature: 0.7,
          userId,
          timeoutMs: 120_000,
        })) {
          if (ev.kind === "delta") {
            accumulated += ev.text;
            send("delta", { text: ev.text });
          }
        }
      } catch (err) {
        if (err instanceof AiOverCapacityError) {
          const fallback =
            "the room is briefly quiet — try again in a minute.";
          send("delta", { text: fallback });
          accumulated = fallback;
        } else {
          send("error", {
            message: "the analyst could not be reached just now.",
          });
        }
      }

      const analystTurn: Turn = {
        role: "analyst",
        text: accumulated.trim(),
        at: new Date(Date.now() + 1).toISOString(),
      };

      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(row.created_at).getTime()) / 1000,
      );
      const cappedDuration = Math.min(
        elapsedSeconds,
        SOFT_MAX_DURATION_SECONDS,
      );

      await supabase
        .from("sessions")
        .update({
          transcript: [...(row.transcript ?? []), userTurn, analystTurn],
          duration_seconds: cappedDuration,
        })
        .eq("id", row.id)
        .eq("user_id", userId);

      send("done", {
        analyst: analystTurn,
        duration_seconds: cappedDuration,
        soft_max_seconds: SOFT_MAX_DURATION_SECONDS,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ────────────────────────────────────────────────────────────────────
// close
// ────────────────────────────────────────────────────────────────────

async function closeSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: CloseBody,
): Promise<Response> {
  const row = await fetchOpenSession(supabase, userId, body.session_id);
  if (!row) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  if (row.closed_at) {
    return NextResponse.json(
      { error: "the session has already closed" },
      { status: 409 },
    );
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(row.created_at).getTime()) / 1000,
  );
  const cappedDuration = Math.min(elapsedSeconds, SOFT_MAX_DURATION_SECONDS);
  const closingAt = new Date().toISOString();

  let closingText = "";
  try {
    const { system, messages } = buildSessionClosePrompt({
      topic: row.topic,
      heldQuestion: row.held_question,
      transcript: row.transcript ?? [],
    });
    const { text } = await callAI("session_close", {
      system,
      messages,
      maxTokens: 300,
      temperature: 0.5,
      userId,
      timeoutMs: 30_000,
    });
    closingText = text.trim();
  } catch {
    closingText =
      "what was named today belongs to the week between us. we continue next time.";
  }

  const closingTurn: Turn = {
    role: "analyst",
    text: closingText,
    at: closingAt,
  };
  const finalTurn: Turn = {
    role: "system",
    text: sessionClose,
    at: new Date(Date.now() + 1).toISOString(),
  };

  const nextTranscript: Turn[] = [
    ...(row.transcript ?? []),
    closingTurn,
    finalTurn,
  ];

  const { error } = await supabase
    .from("sessions")
    .update({
      transcript: nextTranscript,
      closed_at: closingAt,
      duration_seconds: cappedDuration,
      topic: row.topic ?? "Consultation",
    })
    .eq("id", row.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "could not close the session" },
      { status: 500 },
    );
  }

  // Final safety pass over the full transcript — best effort.
  try {
    const admin = adminClient();
    if (admin) {
      const transcriptText = nextTranscript
        .filter((t) => t.role === "user")
        .map((t) => t.text)
        .join("\n\n");
      if (transcriptText.trim().length > 0) {
        await classifySafety(transcriptText, userId, "session", row.id);
      }
    }
  } catch {
    // ignore — close still succeeds
  }

  await recomputeDepthFor(userId, supabase);

  return NextResponse.json(
    {
      closed_at: closingAt,
      closing: closingTurn,
      ritual: finalTurn,
      duration_seconds: cappedDuration,
    },
    { status: 200 },
  );
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

async function fetchOpenSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string,
): Promise<SessionRow | null> {
  if (typeof sessionId !== "string" || !sessionId) return null;
  const { data } = await supabase
    .from("sessions")
    .select(
      "id, user_id, topic, held_question, transcript, closed_at, duration_seconds, created_at",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle<SessionRow>();
  return data ?? null;
}

function normalizeTopic(t: string | null | undefined): string | null {
  if (!t) return null;
  const trimmed = t.trim();
  if (!trimmed) return null;
  const hit = (TOPICS as readonly string[]).find(
    (cand) => cand.toLowerCase() === trimmed.toLowerCase(),
  );
  return hit ?? null;
}

async function deriveHeldQuestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data: lastSession } = await supabase
    .from("sessions")
    .select("held_question, topic, closed_at")
    .eq("user_id", userId)
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      held_question: string | null;
      topic: string | null;
      closed_at: string | null;
    }>();
  if (lastSession?.held_question && lastSession.held_question.trim()) {
    return lastSession.held_question;
  }
  const { data: lastCatchup } = await supabase
    .from("catchups")
    .select("answers, week_number")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      answers: Record<string, unknown> | null;
      week_number: number;
    }>();
  if (lastCatchup?.answers) {
    const stayed = stringField(lastCatchup.answers, "stayed_with");
    const workCatch = stringField(lastCatchup.answers, "work_catch");
    const avoided = stringField(lastCatchup.answers, "avoided_question");
    if (workCatch && workCatch !== "nowhere") {
      return `last week you said work catches you at the ${workCatch}. shall we begin there?`;
    }
    if (avoided) {
      return `the question you would not answer last week — do you want to sit with it now?`;
    }
    if (stayed) {
      return `something from last week is still in the room. shall we open it?`;
    }
  }
  return "what would you like to begin with today?";
}

function stringField(o: Record<string, unknown>, k: string): string {
  const v = o[k];
  return typeof v === "string" ? v.trim() : "";
}

function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

// Suppress unused-import warning under strict TS.
type _Topic = Topic;
void (0 as unknown as _Topic);

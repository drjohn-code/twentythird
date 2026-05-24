import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recomputeDepthFor } from "@/lib/depth";
import { sessionClose } from "@/lib/copy";

// ────────────────────────────────────────────────────────────────────
// Consulting session — start / turn / close.
//
// Stubbed analyst voice. The schema and the ritual are correct;
// the model is wired in a later phase.
//
// TODO: wire to model — currently picks from ~6 canned serif italic
//       replies per topic. Real inference belongs behind this route.
// TODO: connection-aware prompt engineering — once Phase 6 ships
//       relationship intake data, the analyst can reference a
//       connection by first name + role.
// ────────────────────────────────────────────────────────────────────

const SOFT_MAX_DURATION_SECONDS = 2 * 60 * 60; // 2h soft cap

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

export async function POST(request: Request): Promise<NextResponse> {
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

  // Every action requires an active subscription. The page guard also
  // hides the surface, but the server is the source of truth.
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
      return appendTurn(supabase, user.id, body);
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
): Promise<NextResponse> {
  const topic = normalizeTopic(body.topic);
  const held =
    typeof body.held_question === "string" && body.held_question.trim()
      ? body.held_question.trim()
      : await deriveHeldQuestion(supabase, userId);

  // If an open session already exists, return it rather than spawning
  // a second one. The shell's "unfinished" Today line points at this.
  const { data: openRow } = await supabase
    .from("sessions")
    .select("id, user_id, topic, held_question, transcript, closed_at, duration_seconds, created_at")
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
// turn
// ────────────────────────────────────────────────────────────────────

async function appendTurn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: TurnBody,
): Promise<NextResponse> {
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

  const now = new Date().toISOString();
  const userTurn: Turn = { role: "user", text, at: now };
  const analystTurn: Turn = {
    role: "analyst",
    text: stubAnalystReply(row.topic, text, row.transcript ?? []),
    at: new Date(Date.now() + 1).toISOString(),
  };
  const nextTranscript: Turn[] = [
    ...(row.transcript ?? []),
    userTurn,
    analystTurn,
  ];

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(row.created_at).getTime()) / 1000,
  );
  const cappedDuration = Math.min(elapsedSeconds, SOFT_MAX_DURATION_SECONDS);

  const { error } = await supabase
    .from("sessions")
    .update({
      transcript: nextTranscript,
      duration_seconds: cappedDuration,
    })
    .eq("id", row.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "could not record the turn" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      analyst: analystTurn,
      duration_seconds: cappedDuration,
      soft_max_seconds: SOFT_MAX_DURATION_SECONDS,
    },
    { status: 200 },
  );
}

// ────────────────────────────────────────────────────────────────────
// close
// ────────────────────────────────────────────────────────────────────

async function closeSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: CloseBody,
): Promise<NextResponse> {
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

  const closingTurn: Turn = {
    role: "analyst",
    text: closingRitual(row.topic, row.transcript ?? []),
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

  // Depth recompute — sessions count toward the depth signal. Best
  // effort; a recompute failure should not fail the close.
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

// Held question — what's still open from the last session or the most
// recent Catchup. Server-side, no model. Falls back to a quiet default.
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

// ────────────────────────────────────────────────────────────────────
// Stubbed analyst voice
//
// Topical, lightly varied, in serif italic when rendered. The voice
// stays singular (analyst); Freud / Lacan may be cited inline only as
// sources for a named concept.
// ────────────────────────────────────────────────────────────────────

const REPLIES_BY_TOPIC: Record<Topic | "default", string[]> = {
  "Dreaming future": [
    "say more about the version of it you would not admit to wanting.",
    "the future you describe — is it the one you were taught to want, or one you found by refusing?",
    "what would it cost to be wrong about the shape of it?",
    "notice the word that did the most work in that sentence. begin again from there.",
    "where, in that picture, is the part you have already lived?",
    "the wish is clear. what would the wish leave undone?",
  ],
  "Night dream": [
    "read it for the grammar, not the symbols. who is the speaker, and who is being addressed?",
    "the figure that arrives second — what does the first one need to be replaced by?",
    "the dream condenses two scenes — which one is it not allowed to say plainly?",
    "stay with the moment the dream changes register. that hinge is the work.",
    "the dream offers a substitution. what is being kept out of the room by it?",
    "the unconscious uses pictures to write sentences. which sentence is this?",
  ],
  "Relations in my life": [
    "you describe the other clearly. describe the position you take when they appear.",
    "the move you make at the threshold — is it familiar from somewhere older?",
    "what does the other person let you avoid by being who they are?",
    "what part of you only comes forward when this person is in the room?",
    "the relationship reproduces a structure. whose structure is it?",
    "the closeness is welcome up to a point. listen for the point — it always has the same shape.",
  ],
  "Professional growth": [
    "the block sits at a specific moment. which moment, exactly?",
    "what would it mean to be seen finishing it?",
    "the doubt is reliable. what does its reliability protect you from?",
    "the work is not the obstacle. the visibility of the work is. what is forbidden about being seen?",
    "describe the version of yourself that would not need to begin again.",
    "what is the prohibition you are honoring without naming?",
  ],
  default: [
    "say more — without arranging it first.",
    "the word you just used — say it again, slower.",
    "the sentence stopped before it finished. finish it now.",
    "what would be different if you let that be true?",
    "notice which part of that you said in someone else's voice.",
    "stay with it. the next sentence is the one we are listening for.",
  ],
};

function stubAnalystReply(
  topic: string | null,
  userText: string,
  prior: Turn[],
): string {
  const pool =
    (topic && (REPLIES_BY_TOPIC as Record<string, string[]>)[topic]) ||
    REPLIES_BY_TOPIC.default;
  // Deterministic-ish rotation: index by prior analyst turn count so
  // consecutive replies are different without needing randomness.
  const analystTurnsSoFar = prior.filter((t) => t.role === "analyst").length;
  const idx =
    (analystTurnsSoFar + signalIndex(userText)) % pool.length;
  return pool[idx];
}

// Cheap "did the user say something specific" signal — bumps the
// reply index when the turn is substantive, so a longer turn lands a
// different reply than a one-word probe.
function signalIndex(s: string): number {
  const words = s.split(/\s+/).filter(Boolean).length;
  if (words >= 30) return 3;
  if (words >= 12) return 2;
  if (words >= 4) return 1;
  return 0;
}

function closingRitual(topic: string | null, prior: Turn[]): string {
  const turns = prior.length;
  if (turns === 0) {
    return "we opened the room and you waited. that is also a session. we return next time, where you are.";
  }
  switch (topic) {
    case "Dreaming future":
      return "what you named today belongs to a future you are entitled to. let it sit in the room until next time.";
    case "Night dream":
      return "the dream has been read. let it work on you between now and the next sitting — it usually answers a question we have not yet asked.";
    case "Relations in my life":
      return "we have mapped a small piece of the structure. it will appear again in the week. recognizing it is already the work.";
    case "Professional growth":
      return "the block is more specific now. give the week one finished page, however small. the visibility is the practice.";
    default:
      return "we held what could be held. the rest belongs to the week between us. we continue next time.";
  }
}

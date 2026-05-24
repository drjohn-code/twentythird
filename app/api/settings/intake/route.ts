import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recomputeDepthFor } from "@/lib/depth";
import { STEPS } from "@/lib/onboarding/steps";
import type {
  AnyQuestion,
  AnswerValue,
} from "@/lib/types/intake";

// POST /api/settings/intake
//
// Writes a new versioned answer for a single intake question. The
// original onboarding payload in intake_responses stays put — versioned
// edits live in intake_answers, queried as max(version) per
// (user_id, question_key). After write, depth is recomputed.

type ReqBody = {
  question_key?: string;
  answer?: unknown;
};

const QUESTION_BY_KEY = (() => {
  const m = new Map<string, AnyQuestion>();
  for (const step of STEPS) {
    for (const q of [...step.closeQuestions, ...step.openQuestions]) {
      m.set(q.id, q as AnyQuestion);
    }
  }
  return m;
})();

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const questionKey = body.question_key;
  if (typeof questionKey !== "string" || !QUESTION_BY_KEY.has(questionKey)) {
    return NextResponse.json(
      { error: "unknown_question_key" },
      { status: 400 },
    );
  }

  const question = QUESTION_BY_KEY.get(questionKey)!;
  const normalised = normaliseAnswer(question, body.answer);
  if (normalised === undefined) {
    return NextResponse.json({ error: "invalid_answer" }, { status: 400 });
  }

  // Determine next version for (user, question_key).
  const { data: latest } = await supabase
    .from("intake_answers")
    .select("version")
    .eq("user_id", user.id)
    .eq("question_key", questionKey)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>();

  const nextVersion = (latest?.version ?? 0) + 1;

  // intake_answers.answer is jsonb. Stringify into a wrapper so we
  // can store primitive answers (scale → number, single → string).
  const { error: insertError } = await supabase
    .from("intake_answers")
    .insert({
      user_id: user.id,
      question_key: questionKey,
      answer: { value: normalised },
      version: nextVersion,
      updated_at: new Date().toISOString(),
    });

  if (insertError) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  const depth = await recomputeDepthFor(user.id, supabase);

  return NextResponse.json({
    ok: true,
    version: nextVersion,
    depth,
  });
}

// ────────────────────────────────────────────────────────────────────
// Per-kind validation. Returns the canonical persisted shape, or
// undefined to reject. Mirrors the rules used by /lib/onboarding/schema.ts
// but operates on one question at a time.
// ────────────────────────────────────────────────────────────────────

function normaliseAnswer(q: AnyQuestion, raw: unknown): AnswerValue | undefined {
  switch (q.kind) {
    case "single": {
      if (typeof raw !== "string") return undefined;
      const ok = q.options.some((o) => o.value === raw);
      return ok ? raw : undefined;
    }
    case "multi": {
      if (!Array.isArray(raw)) return undefined;
      const allowed = new Set(q.options.map((o) => o.value));
      const limit = q.maxSelections ?? q.options.length;
      const cleaned: string[] = [];
      for (const v of raw) {
        if (typeof v !== "string") return undefined;
        if (!allowed.has(v)) return undefined;
        if (!cleaned.includes(v)) cleaned.push(v);
      }
      if (cleaned.length > limit) return undefined;
      return cleaned;
    }
    case "scale": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
      const v = Math.round(n);
      if (v < q.min || v > q.max) return undefined;
      return v;
    }
    case "number": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
      if (typeof q.min === "number" && n < q.min) return undefined;
      if (typeof q.max === "number" && n > q.max) return undefined;
      return n;
    }
    case "open": {
      if (typeof raw !== "string") return undefined;
      const trimmed = raw.trim();
      if (trimmed.length === 0) return undefined;
      if (trimmed.length > 5000) return undefined;
      return trimmed;
    }
    case "per_option_number": {
      // Out of scope for the Settings edit flow — these are dependent
      // on a multi-select parent and are edited in the intake itself.
      return undefined;
    }
  }
}

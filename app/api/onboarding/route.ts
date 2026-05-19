import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_STEPS, getStep, stepKey } from "@/lib/onboarding/steps";

type ProfileRow = {
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

type ResponsesRow = {
  data: Record<string, Record<string, unknown>> | null;
};

async function loadState(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: profile }, { data: responses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_step, onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("onboarding_responses")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle<ResponsesRow>(),
  ]);

  return {
    step: profile?.onboarding_step ?? 0,
    completedAt: profile?.onboarding_completed_at ?? null,
    data: (responses?.data ?? {}) as Record<string, Record<string, unknown>>,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const state = await loadState(user.id, supabase);
  return NextResponse.json(state);
}

const patchSchema = z.object({
  step: z.number().int().min(1).max(TOTAL_STEPS),
  answers: z.record(z.string(), z.unknown()),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { step, answers } = parsed.data;
  const stepDef = getStep(step);
  if (!stepDef) {
    return NextResponse.json({ error: "unknown_step" }, { status: 400 });
  }

  // Reject any keys not declared on this step.
  const allowedNames = new Set(stepDef.fields.map((f) => f.name));
  for (const key of Object.keys(answers)) {
    if (!allowedNames.has(key)) {
      return NextResponse.json(
        { error: "unknown_field", field: key },
        { status: 400 },
      );
    }
  }

  const state = await loadState(user.id, supabase);

  // No skipping ahead.
  if (step > state.step + 1) {
    return NextResponse.json(
      { error: "step_out_of_order", current: state.step, requested: step },
      { status: 400 },
    );
  }

  // Nest under stepKey(step). Read-merge-write so the jsonb stays
  // coherent — RLS scopes this to the current user.
  const nextData = {
    ...state.data,
    [stepKey(step)]: answers,
  };

  const nextStep = Math.max(state.step, step);

  // Upsert in case the trigger never ran (e.g. user pre-dates the
  // migration and the backfill row was deleted). Idempotent.
  const { error: respError } = await supabase
    .from("onboarding_responses")
    .upsert(
      { user_id: user.id, data: nextData },
      { onConflict: "user_id" },
    );
  if (respError) {
    return NextResponse.json(
      { error: "save_failed", detail: respError.message },
      { status: 500 },
    );
  }

  const { error: profError } = await supabase
    .from("profiles")
    .update({ onboarding_step: nextStep })
    .eq("id", user.id);
  if (profError) {
    return NextResponse.json(
      { error: "save_failed", detail: profError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    step: nextStep,
    completedAt: state.completedAt,
    data: nextData,
  });
}

const postSchema = z.object({
  action: z.literal("complete"),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_step: TOTAL_STEPS,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "complete_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ completed: true, step: TOTAL_STEPS });
}

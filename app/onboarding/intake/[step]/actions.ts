"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  TOTAL_STEPS,
  getStep,
  isValidStepNumber,
} from "@/lib/onboarding/steps";
import { normaliseStepPayload } from "@/lib/onboarding/schema";
import { firstNameFrom } from "@/lib/connections";
import { sendIntakeSubmittedEmail } from "@/lib/emails/intake-submitted";

export type SaveStepResult =
  | { ok: true; savedAt: string; completedThrough: number }
  | { ok: false; reason: "auth" | "validation" | "db" };

export async function saveStep(
  stepNumber: number,
  payload: unknown,
): Promise<SaveStepResult> {
  if (!isValidStepNumber(stepNumber)) {
    return { ok: false, reason: "validation" };
  }
  const step = getStep(stepNumber)!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "auth" };

  let normalised;
  try {
    normalised = normaliseStepPayload(stepNumber, payload);
  } catch {
    return { ok: false, reason: "validation" };
  }

  const nowIso = new Date().toISOString();

  // TODO: section editing — when this becomes editable post-submit,
  // we'll want a separate updated_by/edited_at column and to log the
  // delta. For now the upsert just overwrites.
  const { error: respErr } = await supabase
    .from("intake_responses")
    .upsert(
      {
        user_id: user.id,
        step_number: stepNumber,
        step_slug: step.slug,
        payload: normalised,
      },
      { onConflict: "user_id,step_number" },
    );
  if (respErr) return { ok: false, reason: "db" };

  // Read current onboarding_step so we never regress on the bar.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("onboarding_step")
    .eq("id", user.id)
    .maybeSingle<{ onboarding_step: number | null }>();
  const previous = profileRow?.onboarding_step ?? 0;
  const next = Math.max(previous, stepNumber);

  if (next !== previous) {
    await supabase
      .from("profiles")
      .update({
        onboarding_step: next,
        intake_status: "in_progress",
      })
      .eq("id", user.id);
  }

  return { ok: true, savedAt: nowIso, completedThrough: next };
}


export type SubmitIntakeResult =
  | { ok: true }
  | { ok: false; reason: "auth" | "incomplete" | "db" };

export async function submitIntake(): Promise<SubmitIntakeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "auth" };

  const { count } = await supabase
    .from("intake_responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) < TOTAL_STEPS) {
    return { ok: false, reason: "incomplete" };
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      intake_submitted_at: nowIso,
      intake_status: "processing",
      onboarding_step: TOTAL_STEPS,
      // Keep the legacy gate column in sync so post-auth and
      // middleware (which read onboarding_completed_at) keep working
      // without a rewrite.
      onboarding_completed_at: nowIso,
    })
    .eq("id", user.id);
  if (error) return { ok: false, reason: "db" };

  // Best-effort confirmation email. Failures are logged inside sendEmail
  // and do not block the redirect — the user still lands on PendingStatus.
  if (user.email) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>();
    const firstName = firstNameFrom(profileRow?.full_name ?? null);
    try {
      const res = await sendIntakeSubmittedEmail({
        to: user.email,
        firstName,
      });
      if (!res.ok) {
        console.error(
          "[intake-submitted] email send failed:",
          res.error,
        );
      }
    } catch (e) {
      console.error("[intake-submitted] email send threw:", e);
    }
  }

  // Enqueue an analysis job via the service-role client.
  // analysis_jobs has no insert policy for authenticated users by
  // design — only the worker (and this server-only path) writes it.
  // If the env var is missing in this environment we proceed: the
  // pending dashboard still works; the worker is out of scope.
  const admin = adminClient();
  if (admin) {
    await admin.from("analysis_jobs").insert({
      user_id: user.id,
      status: "queued",
    });

    // Mark the readings as pending generation. The internal
    // initial-readings route will flip this to generating → ready.
    await admin
      .from("users_meta")
      .update({ initial_readings_status: "pending" })
      .eq("user_id", user.id);

    // Schedule the room-ready email for 5 minutes from now. The
    // scheduler at /api/internal/run-scheduled-emails checks
    // profiles.intake_status === 'ready' at send time; if intake is
    // still 'processing' it defers to the next tick (capped at 6h).
    // Idempotency: the dev-only /api/dev/open-room route also tries to
    // send, but only on the row's actual processing→ready transition,
    // so the two paths can't race for the same user.
    const sendAfter = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: schedErr } = await admin
      .from("scheduled_emails")
      .insert({
        user_id: user.id,
        kind: "room_ready",
        payload: {},
        send_after: sendAfter,
      });
    if (schedErr) {
      console.error(
        "[intake-submit] room_ready scheduling failed:",
        schedErr,
      );
    }

    // Trigger the initial readings job. Fire-and-forget — the
    // background job inside the route handler does the real work.
    // We ignore failures here so the intake submit still resolves.
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const internalToken = process.env.AI_INTERNAL_TOKEN;
    if (internalToken) {
      try {
        await fetch(`${siteUrl}/api/internal/initial-readings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-token": internalToken,
          },
          body: JSON.stringify({ user_id: user.id }),
        });
      } catch {
        // best effort — the worker can pick it up later
      }
    }
  }

  revalidatePath("/room");
  return { ok: true };
}

// Reading Depth — the data-completeness signal.
//
// Single computed value in [0, 1] derived from seven server-side
// inputs. It describes the quality of the reading, not the user.
// Never shown as a percentage in UI — the value is rendered as a
// width on a hairline meter and an italic line that varies by band.
//
// Recomputed lazily on read when stale > 1h, and eagerly after any
// catchup / session / onboarding-edit / connection write.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DepthBand } from "@/lib/copy";

// ──────────────────────────────────────────────────────────────────
// Inputs
// ──────────────────────────────────────────────────────────────────

export type DepthInputs = {
  /** Count of closed onboarding questions answered (raw, ≥ 0). */
  onboardingClosedAnswered: number;
  /** Total closed onboarding questions available. */
  onboardingClosedTotal: number;
  /** Count of open onboarding questions with any answer (raw, ≥ 0). */
  onboardingOpenAnswered: number;
  /** Total open onboarding questions available. */
  onboardingOpenTotal: number;
  /** Mean richness across answered open onboarding questions in [0, 1]. */
  onboardingOpenRichness: number;
  /** Catchups completed in the last 8 weeks. */
  recentCatchupCount: number;
  /** Days since the most recent catchup, or null if none. */
  daysSinceLastCatchup: number | null;
  /** Total sessions with a non-null closed_at. */
  completedSessionCount: number;
  /** Count of active connections (status = 'active'). */
  activeConnectionCount: number;
};

// ──────────────────────────────────────────────────────────────────
// Pure compute — no I/O.
//
// Contributions (max):
//   onboarding closed answered      0.18
//   onboarding open answered        0.12
//   onboarding open richness        0.18
//   recent catchups (4+ = full)     0.22
//   last catchup recency (decays)   0.10
//   completed sessions (3+ = full)  0.10
//   accepted connections            0.10  (0.06 first + 0.04 second)
// ──────────────────────────────────────────────────────────────────

export function computeDepth(inputs: DepthInputs): number {
  const safeRatio = (a: number, b: number) => (b > 0 ? clamp01(a / b) : 0);

  const closedContribution =
    safeRatio(inputs.onboardingClosedAnswered, inputs.onboardingClosedTotal) *
    0.18;

  const openCountContribution =
    safeRatio(inputs.onboardingOpenAnswered, inputs.onboardingOpenTotal) * 0.12;

  const openRichnessContribution = clamp01(inputs.onboardingOpenRichness) * 0.18;

  const catchupCountContribution =
    clamp01(inputs.recentCatchupCount / 4) * 0.22;

  // Recency: full credit at 0 days, decays linearly to 0 by day 14.
  const recencyContribution = (() => {
    const days = inputs.daysSinceLastCatchup;
    if (days === null) return 0;
    if (days <= 0) return 0.1;
    if (days >= 14) return 0;
    return (1 - days / 14) * 0.1;
  })();

  const sessionContribution =
    clamp01(inputs.completedSessionCount / 3) * 0.1;

  // Connection contribution is non-linear by design: 0.06 first, 0.04 second.
  const connectionContribution = (() => {
    if (inputs.activeConnectionCount <= 0) return 0;
    if (inputs.activeConnectionCount === 1) return 0.06;
    return 0.1; // 2+ is full credit (cap at two).
  })();

  return clamp01(
    closedContribution +
      openCountContribution +
      openRichnessContribution +
      catchupCountContribution +
      recencyContribution +
      sessionContribution +
      connectionContribution,
  );
}

// ──────────────────────────────────────────────────────────────────
// Per-source breakdown for the Settings depth meter (variant=settings).
// Each entry is in [0, max], summing to computeDepth(inputs).
// ──────────────────────────────────────────────────────────────────

export type DepthBreakdown = {
  label: "intake" | "catchups" | "sessions" | "connections";
  value: number;
  max: number;
};

export function computeDepthBreakdown(inputs: DepthInputs): DepthBreakdown[] {
  const safeRatio = (a: number, b: number) => (b > 0 ? clamp01(a / b) : 0);

  // intake is closed + open count + open richness (0.18 + 0.12 + 0.18 = 0.48)
  const intake =
    safeRatio(inputs.onboardingClosedAnswered, inputs.onboardingClosedTotal) *
      0.18 +
    safeRatio(inputs.onboardingOpenAnswered, inputs.onboardingOpenTotal) *
      0.12 +
    clamp01(inputs.onboardingOpenRichness) * 0.18;

  const catchupCount = clamp01(inputs.recentCatchupCount / 4) * 0.22;
  const recency = (() => {
    const days = inputs.daysSinceLastCatchup;
    if (days === null) return 0;
    if (days <= 0) return 0.1;
    if (days >= 14) return 0;
    return (1 - days / 14) * 0.1;
  })();
  const catchups = catchupCount + recency; // up to 0.32

  const sessions = clamp01(inputs.completedSessionCount / 3) * 0.1;

  const connections = (() => {
    if (inputs.activeConnectionCount <= 0) return 0;
    if (inputs.activeConnectionCount === 1) return 0.06;
    return 0.1;
  })();

  return [
    { label: "intake", value: intake, max: 0.48 },
    { label: "catchups", value: catchups, max: 0.32 },
    { label: "sessions", value: sessions, max: 0.1 },
    { label: "connections", value: connections, max: 0.1 },
  ];
}

// ──────────────────────────────────────────────────────────────────
// Open-question richness — simple lexical heuristic.
//
// richness = min(words/60, 1) * 0.6 + (min(uniqueWords/words, 0.7) / 0.7) * 0.4
//
// TODO: replace with embedding-based richness.
// ──────────────────────────────────────────────────────────────────

export function richnessScore(answer: string): number {
  if (!answer) return 0;
  const tokens = answer
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}'-]/gu, ""))
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return 0;
  const words = tokens.length;
  const unique = new Set(tokens).size;
  const length = Math.min(words / 60, 1);
  const diversity = Math.min(unique / words, 0.7) / 0.7;
  return clamp01(length * 0.6 + diversity * 0.4);
}

// ──────────────────────────────────────────────────────────────────
// Bands → italic line mapping (line text lives in lib/copy.ts).
// ──────────────────────────────────────────────────────────────────

export function depthBand(depth: number): DepthBand {
  if (depth >= 0.75) return "deep";
  if (depth >= 0.5) return "steady";
  if (depth >= 0.3) return "partial";
  return "thin";
}

// ──────────────────────────────────────────────────────────────────
// recomputeDepthFor — pulls every input source, writes the result.
//
// Phase 0 ships the skeleton. The full breakdown (counting catchups,
// recency, sessions, connections, richness across open answers) is
// derived from tables introduced in this phase's migration. The
// onboarding counts come from intake_responses (already exists) and
// intake_answers (versioned edits introduced in this migration).
// ──────────────────────────────────────────────────────────────────

const ONBOARDING_CLOSED_TOTAL_FALLBACK = 60;
const ONBOARDING_OPEN_TOTAL_FALLBACK = 24;

export async function recomputeDepthFor(
  userId: string,
  supabase: SupabaseClient,
): Promise<number> {
  const inputs = await loadDepthInputs(userId, supabase);
  const depth = computeDepth(inputs);

  await supabase
    .from("users_meta")
    .update({
      reading_depth: depth,
      reading_depth_computed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return depth;
}

export async function loadDepthInputs(
  userId: string,
  supabase: SupabaseClient,
): Promise<DepthInputs> {
  // intake_responses: existing onboarding store (one row per step,
  // jsonb payload). Counts are approximated by counting payload keys
  // across all step rows; a more precise total comes from lib/onboarding/steps.ts.
  // TODO: tally precisely against lib/onboarding/steps.ts question definitions.
  const { data: intakeRows } = await supabase
    .from("intake_responses")
    .select("payload")
    .eq("user_id", userId);

  let closedAnswered = 0;
  let openAnswered = 0;
  let openRichnessSum = 0;
  let openRichnessCount = 0;
  for (const row of (intakeRows ?? []) as { payload: unknown }[]) {
    const payload =
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {};
    for (const value of Object.values(payload)) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length === 0) continue;
        if (trimmed.split(/\s+/).length >= 3) {
          openAnswered += 1;
          openRichnessSum += richnessScore(trimmed);
          openRichnessCount += 1;
        } else {
          closedAnswered += 1;
        }
      } else if (Array.isArray(value) || typeof value === "boolean") {
        closedAnswered += 1;
      } else if (value !== null && value !== undefined) {
        closedAnswered += 1;
      }
    }
  }
  const onboardingOpenRichness =
    openRichnessCount > 0 ? openRichnessSum / openRichnessCount : 0;

  // catchups in the last 8 weeks + most recent date
  const eightWeeksAgo = new Date(
    Date.now() - 8 * 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: catchupRows } = await supabase
    .from("catchups")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", eightWeeksAgo)
    .order("created_at", { ascending: false });

  const recentCatchupCount = catchupRows?.length ?? 0;
  const daysSinceLastCatchup = (() => {
    const latest = (catchupRows as { created_at: string }[] | null)?.[0];
    if (!latest) return null;
    const ms = Date.now() - new Date(latest.created_at).getTime();
    return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
  })();

  // completed sessions
  const { count: completedSessionCount } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("closed_at", "is", null);

  // active connections (either side counts toward the inviter — but
  // for depth we only credit the perspective user, so check both
  // inviter and connection_user_id with status='active').
  const { count: activeConnectionCount } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .or(`inviter_user_id.eq.${userId},connection_user_id.eq.${userId}`);

  return {
    onboardingClosedAnswered: closedAnswered,
    onboardingClosedTotal: ONBOARDING_CLOSED_TOTAL_FALLBACK,
    onboardingOpenAnswered: openAnswered,
    onboardingOpenTotal: ONBOARDING_OPEN_TOTAL_FALLBACK,
    onboardingOpenRichness,
    recentCatchupCount,
    daysSinceLastCatchup,
    completedSessionCount: completedSessionCount ?? 0,
    activeConnectionCount: activeConnectionCount ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  CATCHUP_QUESTIONS,
  isComplete,
  type CatchupAnswers,
} from "@/lib/catchup-questions";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";
import { recomputeDepthFor, richnessScore } from "@/lib/depth";

type ExistingReadingRow = {
  id: string;
  block_slug: string;
  reading: string;
  takeaway: string;
  definition: string;
  weight: number;
  version: number;
};

type CatchupRequestBody = {
  week_number?: number;
  answers?: Partial<CatchupAnswers>;
};

/**
 * POST /api/catchup — record a weekly Catchup and refine the readings.
 *
 * Writes:
 *   - one `catchups` row (one per ISO week per user, enforced here)
 *   - one new v(n+1) `block_readings` row per slug (all 12) with the
 *     previous version's row marked superseded
 *   - lazily recomputed `users_meta.reading_depth`
 *
 * Returns:
 *   { summary: string[] (3 paragraphs), shifted: [{ slug, deltaWeight, weight }] }
 *
 * TODO: model-driven reading refinement — currently a deterministic
 *       rule-based stub (richer answers nudge weight up).
 * TODO: connection-aware refinement — incorporate active connection
 *       inputs into shifted weights once Phase 6 lands real data.
 */
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

  // One catchup per ISO week per user. If a row already exists for this
  // week, refuse — the page guard should prevent reaching here, but the
  // server is the source of truth.
  const { data: existingThisWeek } = await supabase
    .from("catchups")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .limit(1)
    .maybeSingle();

  if (existingThisWeek) {
    return NextResponse.json(
      { error: "a catchup for this week already exists" },
      { status: 409 },
    );
  }

  // ── Compute a 3-paragraph summary in the analyst's voice ──────────
  // Rule-based stub. The shape and serif-italic register are correct;
  // the content is canned for now and refined upstream later.
  const summary = composeSummary(answers);

  const { error: insertErr } = await supabase.from("catchups").insert({
    user_id: user.id,
    week_number: weekNumber,
    answers: answers as Record<string, unknown>,
    summary: summary.join("\n\n"),
  });
  if (insertErr) {
    return NextResponse.json(
      { error: "could not store the catchup" },
      { status: 500 },
    );
  }

  // ── Refresh block_readings for all twelve slugs ───────────────────
  const { data: existingRows } = await supabase
    .from("block_readings")
    .select("id, block_slug, reading, takeaway, definition, weight, version")
    .eq("user_id", user.id)
    .is("superseded_at", null);

  const previous = new Map<BlockSlug, ExistingReadingRow>();
  for (const row of (existingRows ?? []) as ExistingReadingRow[]) {
    previous.set(row.block_slug as BlockSlug, row);
  }

  const refinedSource = `catchup:week_${String(weekNumber).padStart(2, "0")}`;
  const richness = computeRichness(answers);
  const shifted: { slug: BlockSlug; deltaWeight: number; weight: number }[] =
    [];

  for (const block of BLOCKS) {
    const prev = previous.get(block.slug);
    const baseWeight = prev?.weight ?? 0.1;
    const bump = bumpFor(block.slug, answers, richness);
    const nextWeight = clamp01(baseWeight + bump);
    const delta = nextWeight - baseWeight;

    const nextReading = refineReadingCopy({
      slug: block.slug,
      previousReading: prev?.reading ?? null,
      answers,
      richness,
    });

    const nextTakeaway = prev?.takeaway ?? "";
    const nextDefinition = prev?.definition ?? block.definition;
    const nextVersion = (prev?.version ?? 1) + 1;

    const { error: insErr } = await supabase.from("block_readings").insert({
      user_id: user.id,
      block_slug: block.slug,
      reading: nextReading,
      takeaway: nextTakeaway || refinedTakeaway(block.slug),
      definition: nextDefinition,
      weight: nextWeight,
      version: nextVersion,
      last_refined_source: refinedSource,
    });
    if (insErr) {
      // Continue on per-slug errors — partial refinement is better than
      // none, and the user-facing "shifted" list reflects what landed.
      continue;
    }

    if (prev) {
      await supabase
        .from("block_readings")
        .update({ superseded_at: new Date().toISOString() })
        .eq("id", prev.id);
    }

    shifted.push({ slug: block.slug, deltaWeight: delta, weight: nextWeight });
  }

  // Sort by delta magnitude so the top movers surface in the summary.
  shifted.sort((a, b) => Math.abs(b.deltaWeight) - Math.abs(a.deltaWeight));

  // ── Recompute depth ───────────────────────────────────────────────
  await recomputeDepthFor(user.id, supabase);

  return NextResponse.json(
    {
      summary,
      shifted,
    },
    { status: 201 },
  );
}

// ────────────────────────────────────────────────────────────────────
// Stub: rule-based summary generator
// ────────────────────────────────────────────────────────────────────

function composeSummary(answers: Partial<CatchupAnswers>): string[] {
  const stayedWith = stringAnswer(answers["stayed_with"]);
  const loop = stringAnswer(answers["loop"]);
  const dream = stringAnswer(answers["dream"]);
  const closeness = stringAnswer(answers["closeness"]);
  const loudest = stringAnswer(answers["loudest_voice"]);
  const workCatch = stringAnswer(answers["work_catch"]);
  const avoided = stringAnswer(answers["avoided_question"]);

  // Three short serif paragraphs. Lowercase italic is reserved for the
  // analyst's voice; the paragraphs themselves are plain serif on the
  // page (the renderer styles them).
  const opening = stayedWith
    ? `Something from the week is still in the room — ${quoteFragment(stayedWith)}. Held lightly, it gives the reading something to work with.`
    : `The week ended quietly. That itself is data — quiet weeks have their own shape.`;

  const middle = (() => {
    const parts: string[] = [];
    if (closeness && closeness !== "openly")
      parts.push(`Closeness was met ${humanCloseness(closeness)}.`);
    if (loudest && loudest !== "none")
      parts.push(`${humanLoudest(loudest)} carried the loudest voice.`);
    if (workCatch && workCatch !== "nowhere")
      parts.push(`Work caught at ${humanWorkCatch(workCatch)}.`);
    if (loop)
      parts.push(`A familiar loop appeared — ${quoteFragment(loop)}.`);
    if (parts.length === 0)
      parts.push(
        `The week's pattern was unremarkable on the surface; the structure shifts anyway.`,
      );
    return parts.join(" ");
  })();

  const closing = (() => {
    if (dream && dream.trim().length > 12)
      return `A dream was offered — ${quoteFragment(dream)}. It will be read for grammar, not symbols.`;
    if (avoided)
      return `One question is being kept back: ${quoteFragment(avoided)}. We can sit with it next week, or not. Either is allowed.`;
    return `Nothing pressing was avoided this week. We continue.`;
  })();

  return [opening, middle, closing];
}

function quoteFragment(s: string): string {
  const trimmed = s.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 80) return `"${trimmed}"`;
  return `"${trimmed.slice(0, 77)}…"`;
}

function humanCloseness(v: string): string {
  switch (v) {
    case "not_at_all":
      return "with the door closed";
    case "briefly":
      return "briefly, then withdrawn from";
    case "with_hesitation":
      return "with hesitation";
    case "too_far":
      return "past your usual edge";
    default:
      return "openly";
  }
}
function humanLoudest(v: string): string {
  switch (v) {
    case "demand":
      return "The demand";
    case "doubt":
      return "The doubt";
    case "desire":
      return "Desire itself";
    case "watcher":
      return "The watcher";
    default:
      return "No single voice";
  }
}
function humanWorkCatch(v: string): string {
  switch (v) {
    case "start":
      return "the start";
    case "middle":
      return "the middle";
    case "finish":
      return "the finish";
    case "visibility":
      return "the visibility";
    default:
      return "no single place";
  }
}

// ────────────────────────────────────────────────────────────────────
// Stub: reading copy refinement
//
// Returns the next-version reading string. If the user gave a long,
// rich answer to a slug-relevant question, the reading is "refined
// after the latest catchup" — otherwise it carries the previous one.
// ────────────────────────────────────────────────────────────────────

function refineReadingCopy({
  slug,
  previousReading,
  answers,
  richness,
}: {
  slug: BlockSlug;
  previousReading: string | null;
  answers: Partial<CatchupAnswers>;
  richness: number;
}): string {
  const carry =
    previousReading ?? "too early to say with confidence — the shape is forming.";
  const stayed = stringAnswer(answers["stayed_with"]);
  const loop = stringAnswer(answers["loop"]);
  const dream = stringAnswer(answers["dream"]);
  const avoided = stringAnswer(answers["avoided_question"]);

  // Pick the most-relevant answer fragment per slug; if rich, surface
  // a "refined" line that quotes the user back. Otherwise the previous
  // reading carries forward unchanged.
  const fragment =
    slug === "subconscious-loops"
      ? loop || stayed
      : slug === "linguistic-unconscious"
        ? stayed || avoided
        : slug === "dream-logic"
          ? dream
          : slug === "intimacy-threshold"
            ? stayed
            : slug === "desire-structure"
              ? avoided || stayed
              : slug === "professional-block"
                ? stringAnswer(answers["work_catch"])
                : stayed;

  if (richness >= 0.45 && fragment && fragment.trim().length > 20) {
    return `refined after the latest catchup — held around ${quoteFragment(fragment)}.`;
  }
  return carry;
}

function refinedTakeaway(slug: BlockSlug): string {
  // Carry a sensible fallback if no previous takeaway exists — should be
  // rare since handle_new_user seeds v1 takeaways for every slug.
  switch (slug) {
    case "subconscious-loops":
      return "the retreat is the loop. not the closeness.";
    case "linguistic-unconscious":
      return "someone else's voice is still speaking through this word.";
    case "father-imago":
      return "the seat changes. the chair does not.";
    case "intimacy-threshold":
      return "being known is the edge, not being close.";
    case "desire-structure":
      return "what is pushed away points more clearly than what is chased.";
    case "professional-block":
      return "the block is at visibility, not at effort.";
    default:
      return "the shape continues to form.";
  }
}

// ────────────────────────────────────────────────────────────────────
// Bump rules — small, deterministic per-slug nudges based on the answers.
// Ensures *every* slug shifts (even slightly) on every catchup so the
// case file has motion. The most-relevant slug for an answer gets the
// largest bump.
// ────────────────────────────────────────────────────────────────────

function bumpFor(
  slug: BlockSlug,
  answers: Partial<CatchupAnswers>,
  richness: number,
): number {
  const base = 0.015; // every slug shifts a touch
  const richBonus = richness * 0.06; // up to +0.06 from open-answer richness
  let topical = 0;

  const closeness = stringAnswer(answers["closeness"]);
  const loop = stringAnswer(answers["loop"]);
  const dream = stringAnswer(answers["dream"]);
  const loudest = stringAnswer(answers["loudest_voice"]);
  const workCatch = stringAnswer(answers["work_catch"]);

  switch (slug) {
    case "subconscious-loops":
      if (loop && loop.trim().length > 8) topical += 0.05;
      break;
    case "linguistic-unconscious":
      if (richness > 0.3) topical += 0.04;
      break;
    case "father-imago":
      if (loudest === "demand" || loudest === "watcher") topical += 0.04;
      break;
    case "intimacy-threshold":
      if (closeness && closeness !== "openly") topical += 0.05;
      break;
    case "desire-structure":
      if (loudest === "desire") topical += 0.05;
      break;
    case "professional-block":
      if (workCatch && workCatch !== "nowhere") topical += 0.05;
      break;
    case "dream-logic":
      if (dream && dream.trim().length > 12) topical += 0.05;
      break;
    case "mother-imago":
    case "relational-pattern":
    case "defenses":
    case "shadow":
    case "transference":
      topical += richness * 0.02;
      break;
  }

  return base + richBonus + topical;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function computeRichness(answers: Partial<CatchupAnswers>): number {
  const opens = CATCHUP_QUESTIONS.filter((q) => q.type === "open").map(
    (q) => q.key,
  );
  let sum = 0;
  let n = 0;
  for (const k of opens) {
    const v = answers[k];
    if (typeof v === "string" && v.trim().length > 0) {
      sum += richnessScore(v);
      n += 1;
    }
  }
  return n > 0 ? sum / n : 0;
}

function stringAnswer(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
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

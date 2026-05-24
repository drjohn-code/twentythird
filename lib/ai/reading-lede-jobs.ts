import "server-only";

// Reading lede regeneration — fire-and-forget jobs.
//
// Called from /readings render when block_readings.lede is missing
// or superseded. We deduplicate in-flight jobs per row id so a
// hard refresh doesn't trigger N parallel calls.

import { adminClient } from "@/lib/supabase/admin";
import { callAI } from "@/lib/ai/router";
import { buildReadingLedePrompt } from "@/lib/ai/prompts/reading-lede";
import { getBlock, type BlockSlug } from "@/lib/blocks";

const inFlight = new Set<string>();

const FIGURE_TYPE_BY_SLUG: Record<
  BlockSlug,
  "pattern-list" | "dream-text" | "report-mock" | "script-revision"
> = {
  "subconscious-loops": "pattern-list",
  "linguistic-unconscious": "dream-text",
  "father-imago": "report-mock",
  "intimacy-threshold": "report-mock",
  "desire-structure": "report-mock",
  "professional-block": "script-revision",
  "mother-imago": "report-mock",
  "dream-logic": "dream-text",
  "relational-pattern": "report-mock",
  defenses: "report-mock",
  shadow: "report-mock",
  transference: "report-mock",
};

export type LedeJob = {
  userId: string;
  blockReadingId: string;
  slug: BlockSlug;
};

export function queueReadingLede(job: LedeJob): void {
  if (inFlight.has(job.blockReadingId)) return;
  inFlight.add(job.blockReadingId);
  void runJob(job).finally(() => inFlight.delete(job.blockReadingId));
}

async function runJob(job: LedeJob): Promise<void> {
  const admin = adminClient();
  if (!admin) return;

  const block = getBlock(job.slug);

  const { data: row } = await admin
    .from("block_readings")
    .select("reading, takeaway, definition, lede")
    .eq("id", job.blockReadingId)
    .maybeSingle<{
      reading: string;
      takeaway: string;
      definition: string;
      lede: string | null;
    }>();
  if (!row) return;
  if (row.lede && row.lede.trim().length > 0) return;

  // Pull a few recent excerpts that bear on this slug (catchup
  // summaries, intake answer keys that align with it). For now,
  // we use the user's most recent catchup summaries as a thin
  // excerpt set — refinement can grow this later.
  const { data: catchups } = await admin
    .from("catchups")
    .select("summary, week_number")
    .eq("user_id", job.userId)
    .order("created_at", { ascending: false })
    .limit(3);
  const excerpts = ((catchups ?? []) as Array<{
    summary: string | null;
    week_number: number;
  }>)
    .filter((c) => !!c.summary)
    .slice(0, 2)
    .map((c) => ({
      source: `week ${String(c.week_number).padStart(2, "0")} catchup`,
      text: (c.summary ?? "").slice(0, 600),
    }));

  try {
    const { system, messages } = buildReadingLedePrompt({
      slug: job.slug,
      subtitle: block.subtitle,
      definition: row.definition || block.definition,
      reading: row.reading,
      takeaway: row.takeaway,
      figureType: FIGURE_TYPE_BY_SLUG[job.slug],
      excerpts,
    });
    const { text } = await callAI("reading_lede", {
      system,
      messages,
      maxTokens: 600,
      temperature: 0.55,
      userId: job.userId,
      timeoutMs: 60_000,
    });
    const lede = text.trim();
    if (lede.length === 0) return;
    await admin
      .from("block_readings")
      .update({ lede })
      .eq("id", job.blockReadingId);
  } catch {
    // best effort — next /readings visit re-queues
  }
}

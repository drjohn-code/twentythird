import "server-only";

// Safety pipeline.
//
// Every free-text input the user writes — intake answers, catchup
// open-questions, consulting room turns — passes through
// classifySafety BEFORE the analyst responds. The classifier returns
// a severity rating; when severity >= medium, a `safety_flags` row is
// written.
//
// Failure handling: if the classifier itself fails (timeout, parse
// error, OpenRouter outage), we default severity to "none" so the
// user-facing flow does not break, but write a `safety_flags` row at
// severity "low" with the synthetic category "classifier_failed". We
// never silently miss a turn.

import { adminClient } from "@/lib/supabase/admin";
import { callAI } from "@/lib/ai/router";
import { buildSafetyClassifyPrompt } from "@/lib/ai/prompts/safety-classify";

export type SafetySource = "intake" | "catchup" | "session";

export type SafetySeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SafetyCategory =
  | "self_harm"
  | "harm_to_others"
  | "abuse"
  | "severe_distress"
  | "substance_crisis"
  | "psychosis_indicators"
  | "classifier_failed";

export type SafetyClassification = {
  severity: SafetySeverity;
  categories: SafetyCategory[];
  excerpt: string | null;
  reasoning: string | null;
};

const SEVERITY_RANK: Record<SafetySeverity, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function compareSeverity(
  a: SafetySeverity,
  b: SafetySeverity,
): number {
  return SEVERITY_RANK[a] - SEVERITY_RANK[b];
}

export function maxSeverity(
  values: SafetySeverity[],
): SafetySeverity {
  let max: SafetySeverity = "none";
  for (const v of values) if (compareSeverity(v, max) > 0) max = v;
  return max;
}

const VALID_SEVERITIES: ReadonlySet<SafetySeverity> = new Set([
  "none",
  "low",
  "medium",
  "high",
  "critical",
]);
const VALID_CATEGORIES: ReadonlySet<SafetyCategory> = new Set([
  "self_harm",
  "harm_to_others",
  "abuse",
  "severe_distress",
  "substance_crisis",
  "psychosis_indicators",
  "classifier_failed",
]);

export async function classifySafety(
  text: string,
  userId: string,
  source: SafetySource,
  sourceId: string | null = null,
): Promise<SafetyClassification> {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    return {
      severity: "none",
      categories: [],
      excerpt: null,
      reasoning: null,
    };
  }

  const { system, messages } = buildSafetyClassifyPrompt(trimmed);

  let classification: SafetyClassification;
  try {
    const { text: raw } = await callAI("safety_classify", {
      system,
      messages,
      jsonMode: true,
      maxTokens: 400,
      temperature: 0,
      userId,
      timeoutMs: 20_000,
    });
    classification = parseClassification(raw, trimmed);
  } catch {
    // Classifier failure — never silent. Default severity to "none"
    // so the user-facing flow doesn't break, but record a low-severity
    // flag tagged with classifier_failed so the miss is visible.
    classification = {
      severity: "none",
      categories: ["classifier_failed"],
      excerpt: trimmed.slice(0, 240),
      reasoning: "classifier_failed",
    };
    await writeFlag(userId, source, sourceId, {
      severity: "low",
      categories: ["classifier_failed"],
      excerpt: trimmed.slice(0, 240),
      reasoning: "classifier_failed",
    });
    return classification;
  }

  // Persist when severity is medium or higher. Low and none never
  // produce a row — keeping the table signal-dense.
  if (
    classification.severity === "medium" ||
    classification.severity === "high" ||
    classification.severity === "critical"
  ) {
    await writeFlag(userId, source, sourceId, classification);
  }

  return classification;
}

async function writeFlag(
  userId: string,
  source: SafetySource,
  sourceId: string | null,
  c: SafetyClassification,
): Promise<void> {
  const admin = adminClient();
  if (!admin) return;
  try {
    await admin.from("safety_flags").insert({
      user_id: userId,
      source,
      source_id: sourceId,
      severity: c.severity === "none" ? "low" : c.severity,
      categories: c.categories,
      excerpt: c.excerpt?.slice(0, 240) ?? null,
    });
  } catch {
    // best effort — never throw out of the safety path
  }
}

function parseClassification(
  raw: string,
  fallbackText: string,
): SafetyClassification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("safety classifier returned non-JSON");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("safety classifier returned non-object");
  }
  const obj = parsed as Record<string, unknown>;
  const severity = normalizeSeverity(obj.severity);
  const categories = normalizeCategories(obj.categories);
  const excerpt = normalizeExcerpt(obj.excerpt, fallbackText);
  const reasoning =
    typeof obj.reasoning === "string" ? obj.reasoning.slice(0, 320) : null;
  return { severity, categories, excerpt, reasoning };
}

function normalizeSeverity(v: unknown): SafetySeverity {
  if (typeof v !== "string") return "none";
  const lowered = v.trim().toLowerCase() as SafetySeverity;
  return VALID_SEVERITIES.has(lowered) ? lowered : "none";
}

function normalizeCategories(v: unknown): SafetyCategory[] {
  if (!Array.isArray(v)) return [];
  const out: SafetyCategory[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const c = item.trim().toLowerCase() as SafetyCategory;
    if (VALID_CATEGORIES.has(c)) out.push(c);
  }
  return out;
}

function normalizeExcerpt(v: unknown, fallback: string): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    if (s.length === 0 || s.toLowerCase() === "null") return null;
    return s.slice(0, 240);
  }
  if (v === null) return null;
  return fallback.slice(0, 240);
}

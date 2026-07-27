import "server-only";

// ────────────────────────────────────────────────────────────────────
// AI router.
//
// Every model call in the product passes through this file. No other
// module imports the OpenRouter URL, the API key, or the model names.
// Swapping a model for a task is an env var change in `.env.local` —
// not a code change.
//
// Task-keyed model selection: each AITask maps to a default model. The
// default can be overridden per-task by an env var of the form
// AI_MODEL_<TASK_UPPER>. Defaults live below; overrides live in
// `.env.local`.
//
// Logging: every call records a row in `ai_calls` (task, model, token
// counts, duration, status, cost if returned). Prompt and completion
// text are NEVER persisted — intake answers, session transcripts, and
// catchup answers are sensitive.
//
// Hourly global guard: if the count of ai_calls rows in the last hour
// exceeds `AI_CALLS_HOURLY_LIMIT` (default 5000), the router throws a
// `AiOverCapacityError` and callers degrade gracefully.
// ────────────────────────────────────────────────────────────────────

import { adminClient } from "@/lib/supabase/admin";

export type AITask =
  | "safety_classify"
  | "initial_readings"
  | "catchup_summary"
  | "catchup_feedback"
  | "catchup_refinement"
  | "session_reply"
  | "session_close"
  | "reading_lede"
  | "connection_summary"
  | "report_generation"
  | "case_detail"
  | "i18n_draft";

const DEFAULT_MODELS: Record<AITask, string> = {
  safety_classify: "google/gemini-2.5-flash",
  initial_readings: "google/gemini-2.5-pro",
  catchup_summary: "google/gemini-2.5-flash",
  catchup_feedback: "google/gemini-2.5-pro",
  catchup_refinement: "google/gemini-2.5-pro",
  session_reply: "google/gemini-2.5-pro",
  session_close: "google/gemini-2.5-flash",
  reading_lede: "google/gemini-2.5-pro",
  connection_summary: "google/gemini-2.5-flash",
  report_generation: "google/gemini-2.5-pro", // gemini-2.5-ultra is NOT a valid OpenRouter model ID (400) — pro is the verified default.
  case_detail: "google/gemini-2.5-flash",
  // Dev/CI only — drafts message catalogs (scripts/i18n/draft-translations.ts).
  // A strong general model; never invoked at request time.
  i18n_draft: "anthropic/claude-sonnet-4.5",
};
function envKeyFor(task: AITask): string {
  return `AI_MODEL_${task.toUpperCase()}`;
}

export const TASK_MODELS = new Proxy(DEFAULT_MODELS, {
  get(target, prop: string) {
    if (!(prop in target)) return undefined;
    const override = process.env[envKeyFor(prop as AITask)];
    if (override && override.trim().length > 0) return override.trim();
    return target[prop as AITask];
  },
}) as Record<AITask, string>;

export function modelFor(task: AITask): string {
  return TASK_MODELS[task];
}

// ────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type CallOpts = {
  /** Prepended as a {role:"system"} message if provided. */
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Ask OpenRouter to enforce JSON object output. */
  jsonMode?: boolean;
  /** Attached to the ai_calls row when present. */
  userId?: string | null;
  /** Request timeout in ms. Default 60000; sessions pass 120000. */
  timeoutMs?: number;
};

export type Usage = {
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
};

export type CallResult = {
  text: string;
  usage: Usage;
};

export class AiOverCapacityError extends Error {
  constructor() {
    super("ai over capacity");
    this.name = "AiOverCapacityError";
  }
}

// Structured error for every failure path that goes through OpenRouter.
// `kind` distinguishes upstream-HTTP from client-side aborts and from
// generic network failures. `status` is set only when we got an actual
// HTTP response back (kind === "http").
export class AiHttpError extends Error {
  readonly kind: "http" | "timeout" | "network";
  readonly status: number | null;
  readonly task: AITask;

  constructor(args: {
    kind: "http" | "timeout" | "network";
    status: number | null;
    task: AITask;
    message: string;
  }) {
    super(args.message);
    this.name = "AiHttpError";
    this.kind = args.kind;
    this.status = args.status;
    this.task = args.task;
  }
}

class JsonParseError extends Error {
  raw: string;
  constructor(raw: string) {
    super("json parse failure");
    this.name = "JsonParseError";
    this.raw = raw;
  }
}

// Raised when the model stopped because it hit max_tokens rather than
// finishing its answer. Previously this surfaced only as a downstream
// JsonParseError — the completion was well-formed prose cut off
// mid-object, so the real cause (a maxTokens ceiling too low for the
// task) was invisible. Carries token counts only, never content.
export class AiTruncatedError extends Error {
  readonly task: AITask;
  readonly completionTokens: number | null;
  readonly maxTokens: number | null;

  constructor(args: {
    task: AITask;
    completionTokens: number | null;
    maxTokens: number | null;
  }) {
    super(
      `response truncated at max_tokens (task=${args.task}, completion_tokens=${args.completionTokens ?? "?"}, max_tokens=${args.maxTokens ?? "?"})`,
    );
    this.name = "AiTruncatedError";
    this.task = args.task;
    this.completionTokens = args.completionTokens;
    this.maxTokens = args.maxTokens;
  }
}

// parseModelJson — normalize the model's raw text into a JSON string
// we know parses, or throw JsonParseError. Used by callAI when
// jsonMode is true. Anthropic models on OpenRouter do not honor
// response_format: { type: "json_object" } reliably, so even with
// prompts that say "no fence, no prose" they occasionally add one.
// This is the belt for those suspenders.
//
// Verification path (no unit test runner in the repo). Each sample is
// what `raw` might look like coming back from the model; each yields
// the same `{"a":1}` once cleaned:
//
//   1. clean JSON
//        {"a":1}
//
//   2. ```json fenced
//        ```json
//        {"a":1}
//        ```
//
//   3. plain ``` fenced
//        ```
//        {"a":1}
//        ```
//
//   4. prose preamble (and/or trailing prose)
//        Here is the response:
//        {"a":1}
//        Hope this helps.
//
// All jsonMode prompts in this codebase ask for an object, not an
// array — so the bracket-slicing only handles `{...}`. Add an array
// branch if a future prompt returns one.
function parseModelJson(raw: string): string {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  try {
    JSON.parse(cleaned);
  } catch {
    throw new JsonParseError(raw);
  }
  return cleaned;
}

// Transient = upstream-fixable. Permanent = code/data fixable.
// Callers that own user-visible state machines (initial_readings,
// catchup, report) use this to decide whether to flip a row to a
// permanent failure or leave it in a retryable state.
export function isTransientAiError(err: unknown): boolean {
  if (err instanceof AiOverCapacityError) return true;
  if (err instanceof JsonParseError) return true;
  if (err instanceof AiHttpError) {
    if (err.kind === "timeout" || err.kind === "network") return true;
    if (err.kind === "http" && err.status !== null) {
      return err.status === 402 || err.status === 429 || err.status >= 500;
    }
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────
// Hourly capacity guard
// ────────────────────────────────────────────────────────────────────

const HOURLY_CHECK_INTERVAL_MS = 30 * 1000;
let lastHourlyCheck = 0;
let lastHourlyCount = 0;

async function hourlyCount(): Promise<number> {
  const now = Date.now();
  if (now - lastHourlyCheck < HOURLY_CHECK_INTERVAL_MS) {
    return lastHourlyCount;
  }
  const admin = adminClient();
  if (!admin) {
    lastHourlyCheck = now;
    lastHourlyCount = 0;
    return 0;
  }
  const since = new Date(now - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  lastHourlyCheck = now;
  lastHourlyCount = count ?? 0;
  return lastHourlyCount;
}

function hourlyLimit(): number {
  const raw = process.env.AI_CALLS_HOURLY_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

// ────────────────────────────────────────────────────────────────────
// OpenRouter HTTP
// ────────────────────────────────────────────────────────────────────

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildHeaders(): HeadersInit {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not set — refusing to call OpenRouter",
    );
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://day-23.com",
    "X-Title": "TwentyThird",
  };
}

function buildBody(
  task: AITask,
  opts: CallOpts,
  stream: boolean,
): Record<string, unknown> {
  const messages: ChatMessage[] = [];
  if (opts.system && opts.system.trim().length > 0) {
    messages.push({ role: "system", content: opts.system });
  }
  for (const m of opts.messages) messages.push(m);

  const body: Record<string, unknown> = {
    model: modelFor(task),
    messages,
    stream,
  };
  if (typeof opts.maxTokens === "number") body.max_tokens = opts.maxTokens;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;
  if (opts.jsonMode) body.response_format = { type: "json_object" };
  return body;
}

// ────────────────────────────────────────────────────────────────────
// Logging — best effort, never throws
// ────────────────────────────────────────────────────────────────────

type LogPayload = {
  task: AITask;
  model: string;
  userId?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  costUsd?: number | null;
  durationMs: number;
  status: "ok" | "error" | "timeout" | "parse_error" | "truncated";
  errorMessage?: string | null;
};

async function logCall(p: LogPayload): Promise<void> {
  const admin = adminClient();
  if (!admin) return;
  try {
    await admin.from("ai_calls").insert({
      user_id: p.userId ?? null,
      task: p.task,
      model: p.model,
      prompt_tokens: p.promptTokens ?? null,
      completion_tokens: p.completionTokens ?? null,
      cost_usd: p.costUsd ?? null,
      duration_ms: Math.round(p.durationMs),
      status: p.status,
      error_message: p.errorMessage ?? null,
    });
  } catch {
    // never throw out of the logging path
  }
}

// ────────────────────────────────────────────────────────────────────
// Non-streaming
// ────────────────────────────────────────────────────────────────────

export async function callAI(
  task: AITask,
  opts: CallOpts,
): Promise<CallResult> {
  const count = await hourlyCount();
  if (count >= hourlyLimit()) throw new AiOverCapacityError();

  const model = modelFor(task);
  const timeoutMs = opts.timeoutMs ?? 60_000;

  const attempt = async (): Promise<CallResult> => {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let usage: Usage = {
      promptTokens: null,
      completionTokens: null,
      costUsd: null,
    };
    let text = "";
    let status: LogPayload["status"] = "ok";
    let errorMessage: string | null = null;
    let thrown: unknown = null;
    let finishReason: string | null = null;
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(buildBody(task, opts, false)),
        signal: controller.signal,
      });
      if (!res.ok) {
        const t = await safeText(res);
        status = "error";
        errorMessage = `${res.status} ${t.slice(0, 200)}`;
        throw new AiHttpError({
          kind: "http",
          status: res.status,
          task,
          message: errorMessage,
        });
      }
      const json = (await res.json()) as OpenRouterChatResponse;
      text = json.choices?.[0]?.message?.content ?? "";
      usage = extractUsage(json);
      finishReason = json.choices?.[0]?.finish_reason ?? null;
    } catch (err) {
      thrown = err;
      if ((err as Error).name === "AbortError") {
        status = "timeout";
        errorMessage = "timeout";
        thrown = new AiHttpError({
          kind: "timeout",
          status: null,
          task,
          message: "timeout",
        });
      } else if (!(err instanceof AiHttpError)) {
        if (!errorMessage) {
          status = "error";
          errorMessage = describeError(err);
        }
        thrown = new AiHttpError({
          kind: "network",
          status: null,
          task,
          message: errorMessage,
        });
      }
      const duration = Date.now() - started;
      await logCall({
        task,
        model,
        userId: opts.userId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        costUsd: usage.costUsd,
        durationMs: duration,
        status,
        errorMessage,
      });
      throw thrown;
    } finally {
      clearTimeout(timer);
    }
    const duration = Date.now() - started;

    // Check truncation before parsing. A response cut off at the token
    // ceiling is well-formed prose ending mid-object — it would
    // otherwise surface as a generic JSON parse failure and send the
    // reader hunting for a quoting bug that isn't there.
    if (finishReason === "length") {
      const err = new AiTruncatedError({
        task,
        completionTokens: usage.completionTokens,
        maxTokens: opts.maxTokens ?? null,
      });
      await logCall({
        task,
        model,
        userId: opts.userId,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        costUsd: usage.costUsd,
        durationMs: duration,
        status: "truncated",
        errorMessage: err.message,
      });
      throw err;
    }

    if (opts.jsonMode) {
      try {
        text = parseModelJson(text);
      } catch (e) {
        await logCall({
          task,
          model,
          userId: opts.userId,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          costUsd: usage.costUsd,
          durationMs: duration,
          status: "parse_error",
          errorMessage: "first parse failed",
        });
        throw e;
      }
    }

    await logCall({
      task,
      model,
      userId: opts.userId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      costUsd: usage.costUsd,
      durationMs: duration,
      status: "ok",
    });

    return { text, usage };
  };

  try {
    return await attempt();
  } catch (err) {
    if (opts.jsonMode && err instanceof JsonParseError) {
      // One retry with the same prompt on JSON parse failure.
      return await attempt();
    }
    throw err;
  }
}

// ────────────────────────────────────────────────────────────────────
// Streaming
// ────────────────────────────────────────────────────────────────────

export type StreamChunk =
  | { kind: "delta"; text: string }
  | { kind: "done"; usage: Usage };

export async function* streamAI(
  task: AITask,
  opts: CallOpts,
): AsyncIterable<StreamChunk> {
  const count = await hourlyCount();
  if (count >= hourlyLimit()) throw new AiOverCapacityError();

  const model = modelFor(task);
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let usage: Usage = {
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
  let status: LogPayload["status"] = "ok";
  let errorMessage: string | null = null;

  let thrown: unknown = null;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(buildBody(task, opts, true)),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      const t = await safeText(res);
      status = "error";
      errorMessage = `${res.status} ${t.slice(0, 200)}`;
      throw new AiHttpError({
        kind: "http",
        status: res.status,
        task,
        message: errorMessage,
      });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let lineEnd = buf.indexOf("\n");
      while (lineEnd !== -1) {
        const line = buf.slice(0, lineEnd).trim();
        buf = buf.slice(lineEnd + 1);
        lineEnd = buf.indexOf("\n");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as OpenRouterStreamEvent;
          const delta = evt.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            yield { kind: "delta", text: delta };
          }
          if (evt.usage) {
            usage = extractUsage({ usage: evt.usage });
          }
        } catch {
          // ignore malformed event
        }
      }
    }
    yield { kind: "done", usage };
  } catch (err) {
    thrown = err;
    if ((err as Error).name === "AbortError") {
      status = "timeout";
      errorMessage = "timeout";
      thrown = new AiHttpError({
        kind: "timeout",
        status: null,
        task,
        message: "timeout",
      });
    } else if (!(err instanceof AiHttpError)) {
      if (!errorMessage) {
        status = "error";
        errorMessage = describeError(err);
      }
      thrown = new AiHttpError({
        kind: "network",
        status: null,
        task,
        message: errorMessage,
      });
    }
    throw thrown;
  } finally {
    clearTimeout(timer);
    await logCall({
      task,
      model,
      userId: opts.userId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      costUsd: usage.costUsd,
      durationMs: Date.now() - started,
      status,
      errorMessage,
    });
  }
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: OpenRouterUsage;
};
type OpenRouterStreamEvent = {
  choices?: Array<{ delta?: { content?: string } }>;
  usage?: OpenRouterUsage;
};
type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_cost?: number;
  cost?: number;
};

function extractUsage(payload: { usage?: OpenRouterUsage }): Usage {
  const u = payload.usage ?? {};
  return {
    promptTokens: numOrNull(u.prompt_tokens),
    completionTokens: numOrNull(u.completion_tokens),
    costUsd: numOrNull(u.total_cost ?? u.cost),
  };
}

function numOrNull(v: number | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 240);
  return String(err).slice(0, 240);
}

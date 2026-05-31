/**
 * scripts/i18n/draft-translations.ts
 *
 * Machine-draft the non-English message catalogs. DEV / CI ONLY — never a
 * request-time call. Routing stays in lib/ai/router.ts: this script calls
 * `callAI("i18n_draft", { jsonMode })` and introduces no model name or
 * OpenRouter URL of its own (the model for `i18n_draft` is defined in the
 * router and overridable via AI_MODEL_I18N_DRAFT).
 *
 * Quality lever: each namespace is translated as a WHOLE, with the English
 * source as context and the glossary + voice rules in the system prompt —
 * not key-by-key in isolation. Keys/files already locked by a reviewer are
 * preserved verbatim, never re-drafted.
 *
 * Run — server-only must resolve to empty in plain Node (hence the
 * react-server condition), and env comes from .env.local:
 *
 *   node --env-file=.env.local --conditions=react-server \
 *     --import tsx scripts/i18n/draft-translations.ts [locale ...]
 *
 * With no locale args, drafts every non-English supported locale.
 *
 * Review workflow:
 *   - A fresh draft is written with `_meta: { status: "machine-draft",
 *     reviewed: false }`.
 *   - Set `_meta.reviewed: true` to lock the WHOLE file — re-runs skip it.
 *   - Or list dot-paths in `_meta.lockedKeys` (e.g. "nav.signIn") to lock
 *     individual strings while re-drafting the rest.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { callAI } from "@/lib/ai/router";
import { LOCALES, DEFAULT_LOCALE, autonymOf, type Locale } from "@/lib/i18n/locales";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const MESSAGES_DIR = join(ROOT, "messages");

type Json = Record<string, unknown>;

function readJson(path: string): Json {
  return JSON.parse(readFileSync(path, "utf8")) as Json;
}

function loadVoiceRules(): string {
  // Pull the voice-defining sections of CLAUDE.md so the model writes in
  // brand register. We pass the whole file slice rather than paraphrase.
  const claude = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
  const start = claude.indexOf("## Brand");
  const end = claude.indexOf("## Design Principles");
  return start >= 0 && end > start ? claude.slice(start, end).trim() : claude.slice(0, 4000);
}

function loadGlossary(): string {
  return readFileSync(join(MESSAGES_DIR, "_glossary.md"), "utf8");
}

// Dot-path get on a nested object.
function getPath(obj: Json, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Json)[k];
    }
    return undefined;
  }, obj);
}

// Dot-path set on a nested object (creating intermediate objects).
function setPath(obj: Json, path: string, value: unknown): void {
  const parts = path.split(".");
  let cur: Json = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== "object" || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k] as Json;
  }
  cur[parts[parts.length - 1]] = value;
}

const SYSTEM = (voice: string, glossary: string, languageName: string) => `
You are a professional literary translator localising the TwentyThird product into ${languageName}.

TwentyThird is a psychodynamic AI platform. Its voice is editorial-clinical — a 1920s monograph
reissued by a contemporary research lab. Translate so a native ${languageName} reader feels that
same register: short, certain sentences; clinical authority; never wellness-app cheerfulness.

BRAND & VOICE RULES (authoritative):
${voice}

GLOSSARY (authoritative — obey exactly):
${glossary}

HARD RULES:
- Return ONLY a JSON object mirroring the input object's shape and keys exactly. No prose, no fences.
- Translate VALUES only. Never translate or rename KEYS.
- Preserve every ICU placeholder and structure exactly: {name}, {count}, and
  plural/select blocks like {count, plural, one {...} other {...}}. For plural/select, KEEP the
  English categories' braces and translate the text inside, ADDING the plural categories
  ${languageName} grammar requires (one/few/many/other as appropriate). Never concatenate counts.
- Keep all "do not translate" glossary terms verbatim (TwentyThird, 23, CognitiveLab, WelloWork AB,
  Fig. NN, Stripe, proper names, prices like 23.23/11.11).
- Use ONE consistent translation for each controlled product term, everywhere.
- Preserve leading/trailing whitespace, line breaks, and any HTML/markup tags inside a value.
- Preserve case intent: lowercase italic captions stay lowercase; UPPERCASE eyebrows stay uppercase.
- Numerals in clinical contexts stay as figures.
`.trim();

async function translateNamespace(
  namespace: string,
  source: unknown,
  languageName: string,
  voice: string,
  glossary: string,
): Promise<unknown> {
  if (source === null || typeof source !== "object") return source;
  if (Object.keys(source as Json).length === 0) return source; // nothing to translate

  const user = `Target language: ${languageName}.
Translate the VALUES of this JSON object (namespace "${namespace}") into ${languageName}.
Return the same object shape with translated values:

${JSON.stringify(source, null, 2)}`;

  // Retry with backoff: a single transient failure (rate-limit 429,
  // capacity, parse) must NOT drop the namespace to English — especially
  // for small single-call namespaces (common, nav, …) that have no
  // per-child resilience. Backoff also rides out short rate-limit windows.
  const delays = [1500, 4000, 9000, 18000];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const { text } = await callAI("i18n_draft", {
        system: SYSTEM(voice, glossary, languageName),
        messages: [{ role: "user", content: user }],
        jsonMode: true,
        // Large enough for the biggest namespace (readings: 12 blocks ×
        // 4 strings) without truncation, which would fail the JSON parse.
        maxTokens: 16000,
        temperature: 0.3,
        // 120s (not the 60s default): a slow-but-alive inference endpoint
        // shouldn't be treated as a timeout and dropped to English.
        timeoutMs: 120_000,
      });
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
      if (attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }
    }
  }
  throw lastErr;
}

// Translate an object, chunking large ones by sub-key so no single call
// risks truncation. Objects whose serialized size is under the threshold
// go in one call; larger objects recurse per child. Arrays/primitives
// are translated by wrapping in a one-key object.
const CHUNK_THRESHOLD = 5000; // chars of source JSON per call

async function translateChunked(
  label: string,
  source: unknown,
  languageName: string,
  voice: string,
  glossary: string,
): Promise<unknown> {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return source;
  }
  const obj = source as Json;
  if (Object.keys(obj).length === 0) return obj;
  if (JSON.stringify(obj).length <= CHUNK_THRESHOLD) {
    return translateNamespace(label, obj, languageName, voice, glossary);
  }
  const out: Json = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    try {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        out[k] = await translateChunked(
          `${label}.${k}`,
          v,
          languageName,
          voice,
          glossary,
        );
      } else {
        const wrapped = await translateNamespace(
          `${label}.${k}`,
          { [k]: v },
          languageName,
          voice,
          glossary,
        );
        out[k] = (wrapped as Json)[k];
      }
    } catch {
      // Resilient: a single failed sub-chunk falls back to English for
      // just that key (omitted here → request-config deep-merge fills it
      // from en), rather than dropping the whole namespace.
      process.stdout.write(`[skip ${label}.${k}] `);
    }
  }
  return out;
}

// The subtree of `en` whose leaves are absent or empty in `existing`.
// Used by --missing mode to translate only newly-added keys.
function missingSubtree(en: unknown, existing: unknown): Json {
  const out: Json = {};
  if (en === null || typeof en !== "object" || Array.isArray(en)) return out;
  const enObj = en as Json;
  const exObj =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Json)
      : undefined;
  for (const k of Object.keys(enObj)) {
    if (k === "_meta") continue;
    const ev = enObj[k];
    const xv = exObj ? exObj[k] : undefined;
    if (ev !== null && typeof ev === "object" && !Array.isArray(ev)) {
      const sub = missingSubtree(ev, xv);
      if (Object.keys(sub).length > 0) out[k] = sub;
    } else if (xv === undefined || xv === null || xv === "") {
      out[k] = ev;
    }
  }
  return out;
}

// Deep-merge src into target (mutates target); src leaves win.
function mergeInto(target: Json, src: Json): void {
  for (const k of Object.keys(src)) {
    const sv = src[k];
    if (sv !== null && typeof sv === "object" && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== "object" || Array.isArray(target[k])) {
        target[k] = {};
      }
      mergeInto(target[k] as Json, sv as Json);
    } else {
      target[k] = sv;
    }
  }
}

async function draftLocale(
  locale: Locale,
  en: Json,
  voice: string,
  glossary: string,
  missingOnly = false,
): Promise<void> {
  const languageName = autonymOf(locale);
  const outPath = join(MESSAGES_DIR, `${locale}.json`);

  const existing: Json = existsSync(outPath) ? readJson(outPath) : {};
  const meta = (existing._meta ?? {}) as Json;

  if (meta.reviewed === true) {
    console.log(`• ${locale} (${languageName}) — _meta.reviewed:true, skipping whole file`);
    return;
  }
  const lockedKeys = new Set<string>(
    Array.isArray(meta.lockedKeys) ? (meta.lockedKeys as string[]) : [],
  );

  // --missing mode: translate only keys absent from the existing catalog,
  // merge into it, and preserve everything already translated.
  if (missingOnly) {
    const missing = missingSubtree(en, existing);
    const missingNs = Object.keys(missing);
    if (missingNs.length === 0) {
      console.log(`• ${locale} (${languageName}) — no missing keys, skipping`);
      return;
    }
    const result: Json = {};
    for (const ns of missingNs) {
      process.stdout.write(`• ${locale} (${languageName}) · +${ns} … `);
      try {
        result[ns] = await translateChunked(ns, missing[ns], languageName, voice, glossary);
        console.log("ok");
      } catch (err) {
        console.log(`FAILED (${(err as Error).message.slice(0, 60)})`);
      }
    }
    const out: Json = JSON.parse(JSON.stringify(existing));
    mergeInto(out, result);
    out._meta = {
      ...(meta as Json),
      status: "machine-draft",
      reviewed: false,
      source: DEFAULT_LOCALE,
      generatedBy: "scripts/i18n/draft-translations.ts",
    };
    writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
    console.log(`  → updated ${locale}.json (missing keys)`);
    return;
  }

  const result: Json = {};
  const namespaces = Object.keys(en).filter((k) => k !== "_meta");

  for (const ns of namespaces) {
    process.stdout.write(`• ${locale} (${languageName}) · ${ns} … `);
    try {
      const translated = await translateChunked(ns, en[ns], languageName, voice, glossary);
      result[ns] = translated;
      console.log("ok");
    } catch (err) {
      // Leave the namespace to English fallback rather than half-translating.
      console.log(`FAILED (${(err as Error).message.slice(0, 80)}) — English fallback`);
    }
  }

  // Re-apply locked keys from the previous draft so reviewer edits survive.
  for (const path of lockedKeys) {
    const prev = getPath(existing, path);
    if (prev !== undefined) setPath(result, path, prev);
  }

  const out: Json = {
    _meta: {
      status: "machine-draft",
      reviewed: false,
      ...(lockedKeys.size ? { lockedKeys: [...lockedKeys] } : {}),
      source: DEFAULT_LOCALE,
      generatedBy: "scripts/i18n/draft-translations.ts",
    },
    ...result,
  };

  if (!existsSync(MESSAGES_DIR)) mkdirSync(MESSAGES_DIR, { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`  → wrote ${locale}.json`);
}

async function main(): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error(
      "OPENROUTER_API_KEY is not set. Run with: node --env-file=.env.local --conditions=react-server --import tsx scripts/i18n/draft-translations.ts",
    );
    process.exit(1);
  }

  const en = readJson(join(MESSAGES_DIR, "en.json"));
  const voice = loadVoiceRules();
  const glossary = loadGlossary();

  const rawArgs = process.argv.slice(2).filter(Boolean);
  const missingOnly = rawArgs.includes("--missing");
  const argLocales = rawArgs.filter((a) => !a.startsWith("--"));
  const targets: Locale[] = LOCALES.map((l) => l.code).filter(
    (c) => c !== DEFAULT_LOCALE && (argLocales.length === 0 || argLocales.includes(c)),
  );

  if (targets.length === 0) {
    console.error("No matching target locales.");
    process.exit(1);
  }

  console.log(
    `Drafting ${targets.length} locale(s)${missingOnly ? " [missing keys only]" : ""}: ${targets.join(", ")}\n`,
  );
  for (const locale of targets) {
    await draftLocale(locale, en, voice, glossary, missingOnly);
  }
  console.log("\nDone. All non-English catalogs are machine-draft, reviewed:false.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

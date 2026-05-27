// Meaningful-answer validator for case-file detail-view generation.
//
// The detail view's first section ("summary of user's answers") must
// not fabricate content when the user typed nothing useful. Before the
// prompt is built, every open-text answer passes through isMeaningful().
// The result is forwarded to the model so it can be honest about which
// answers it can and cannot reflect.
//
// Heuristic, not perfect — false negatives on very terse but real
// answers ("yes, work.") are tolerated; the cost is the model treating
// a real answer as junk, which is recoverable next week. False
// positives (junk passing as real) are worse: they produce hallucinated
// summaries. The thresholds err on the strict side.

const FILLER_TOKENS = new Set([
  "idk",
  "i dont know",
  "i don't know",
  "no idea",
  "no",
  "yes",
  "n/a",
  "na",
  "none",
  "nothing",
  "nope",
  "nada",
  "-",
  "--",
  ".",
  "..",
  "...",
  "?",
  "??",
  "???",
  "ok",
  "okay",
  "k",
  "meh",
  "shrug",
  "dunno",
  "skip",
]);

const KEYBOARD_RUNS = [
  "qwerty",
  "qwertyuiop",
  "asdf",
  "asdfg",
  "asdfgh",
  "asdfghjkl",
  "zxcv",
  "zxcvb",
  "zxcvbn",
  "zxcvbnm",
  "1234",
  "12345",
  "123456",
  "1234567890",
];

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const ALPHA_RE = /[a-z]/i;
const VOWEL_RE = /[aeiouy]/i;
const CONSONANT_RE = /[bcdfghjklmnpqrstvwxz]/i;

export type MeaningfulCheck = {
  meaningful: boolean;
  reason?:
    | "empty"
    | "too_short"
    | "filler"
    | "single_emoji"
    | "repeated_char"
    | "keyboard_run"
    | "no_vowels"
    | "no_consonants"
    | "no_letters";
};

export function isMeaningful(value: unknown): MeaningfulCheck {
  if (value == null) return { meaningful: false, reason: "empty" };
  const raw = typeof value === "string" ? value : String(value);
  const trimmed = raw.trim();

  if (trimmed.length === 0) return { meaningful: false, reason: "empty" };

  // Filler — exact lowercase match, with punctuation stripped from the ends.
  const lowered = trimmed
    .toLowerCase()
    .replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, "");
  if (FILLER_TOKENS.has(lowered)) {
    return { meaningful: false, reason: "filler" };
  }

  // Length floor — 10 characters or 3 words, whichever is laxer.
  // We're strict but not pedantic; a real answer can be short.
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (trimmed.length < 10 && wordCount < 3) {
    return { meaningful: false, reason: "too_short" };
  }

  // Emoji-only / mostly-emoji content.
  const lettersOnly = trimmed.replace(/[^A-Za-z]/g, "");
  if (lettersOnly.length === 0) {
    if (EMOJI_RE.test(trimmed)) {
      return { meaningful: false, reason: "single_emoji" };
    }
    return { meaningful: false, reason: "no_letters" };
  }

  // Repeated single character (jjjjj, aaaa).
  if (/^([A-Za-z])\1{3,}$/.test(trimmed.replace(/\s+/g, ""))) {
    return { meaningful: false, reason: "repeated_char" };
  }

  // Keyboard runs.
  const collapsed = trimmed.toLowerCase().replace(/\s+/g, "");
  for (const run of KEYBOARD_RUNS) {
    if (collapsed === run) {
      return { meaningful: false, reason: "keyboard_run" };
    }
  }

  // Vowel / consonant balance — random mashes tend to be all one or
  // the other. Only enforce on short single-word inputs to avoid
  // tripping on real prose with stylistic spelling.
  if (wordCount === 1 && lettersOnly.length >= 4) {
    if (!VOWEL_RE.test(lettersOnly)) {
      return { meaningful: false, reason: "no_vowels" };
    }
    if (!CONSONANT_RE.test(lettersOnly)) {
      return { meaningful: false, reason: "no_consonants" };
    }
  }

  if (!ALPHA_RE.test(trimmed)) {
    return { meaningful: false, reason: "no_letters" };
  }

  return { meaningful: true };
}

// Truncate text to a hard word cap, preferring sentence boundaries.
// Used by the case-detail route to enforce the 40-word limit per
// section after the model returns. Prompt-only limits are not enough —
// models routinely overshoot when asked for "≤ 40 words".
export function enforceWordCap(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;

  // Walk sentence-ending punctuation from the start until adding the
  // next sentence would exceed the cap; keep the last full sentence
  // within the limit.
  const sentenceRe = /[^.!?]+[.!?]+|[^.!?]+$/g;
  const sentences = trimmed.match(sentenceRe) ?? [];
  let kept = "";
  let keptWords = 0;
  for (const s of sentences) {
    const sTrim = s.trim();
    if (!sTrim) continue;
    const w = sTrim.split(/\s+/).length;
    if (keptWords + w > maxWords) break;
    kept = kept ? `${kept} ${sTrim}` : sTrim;
    keptWords += w;
  }

  if (kept.split(/\s+/).filter(Boolean).length === 0) {
    // No full sentence fits — hard truncate at the word boundary and
    // append an ellipsis so the cut is visible.
    return `${words.slice(0, maxWords).join(" ")}…`;
  }
  return kept;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

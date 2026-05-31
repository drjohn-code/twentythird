// ────────────────────────────────────────────────────────────────────
// Accept-Language negotiation — edge-safe, no Node / server-only imports.
//
// Imported by both the middleware (Edge runtime) and the server-side
// locale resolver. Keep this file dependency-free beyond `./locales`.
// ────────────────────────────────────────────────────────────────────

import { isSupportedLocale, type Locale } from "./locales";

// Primary-subtag aliases for tags whose base form isn't our code.
// Norwegian is requested as `no`/`nn` but our locale is `nb`.
const PRIMARY_ALIASES: Record<string, Locale> = {
  no: "nb",
  nn: "nb",
};

/**
 * Pick the best supported locale from an `Accept-Language` header value.
 * Honours q-weights, tries exact tag then primary subtag then alias.
 * Returns null when nothing matches (caller falls back to DEFAULT_LOCALE).
 */
export function negotiateAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/);
        if (m) q = Number.parseFloat(m[1]);
      }
      return { tag: rawTag.trim().toLowerCase(), q };
    })
    .filter((x) => x.tag.length > 0 && x.tag !== "*")
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (isSupportedLocale(tag)) return tag;
    const primary = tag.split("-")[0];
    if (isSupportedLocale(primary)) return primary;
    const aliased = PRIMARY_ALIASES[primary];
    if (aliased) return aliased;
  }
  return null;
}

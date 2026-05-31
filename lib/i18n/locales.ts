// ────────────────────────────────────────────────────────────────────
// Supported locales — the single source of truth.
//
// Adding a language is a one-line change: add a row to LOCALES below and
// drop a matching `messages/<code>.json` catalog. Everything else —
// the `Locale` union type, the switcher menu, Accept-Language
// negotiation, the catalog loader — derives from this file.
//
// All locales here are LTR (no RTL/bidi work is required for this set).
// Adding Arabic/Hebrew later would require RTL support — see I18N.md.
// ────────────────────────────────────────────────────────────────────

export type Script = "Latin" | "Latin-ext" | "Cyrillic" | "Greek";

// The 24 official EU languages plus Norwegian (bokmål), Ukrainian, and
// Icelandic. `autonym` is the endonym — how the language names itself —
// and is rendered `lang`-tagged in the switcher.
export const LOCALES = [
  { code: "en", autonym: "English", script: "Latin" },
  { code: "bg", autonym: "Български", script: "Cyrillic" },
  { code: "cs", autonym: "Čeština", script: "Latin-ext" },
  { code: "da", autonym: "Dansk", script: "Latin" },
  { code: "de", autonym: "Deutsch", script: "Latin" },
  { code: "el", autonym: "Ελληνικά", script: "Greek" },
  { code: "es", autonym: "Español", script: "Latin" },
  { code: "et", autonym: "Eesti", script: "Latin-ext" },
  { code: "fi", autonym: "Suomi", script: "Latin" },
  { code: "fr", autonym: "Français", script: "Latin" },
  { code: "ga", autonym: "Gaeilge", script: "Latin" },
  { code: "hr", autonym: "Hrvatski", script: "Latin-ext" },
  { code: "hu", autonym: "Magyar", script: "Latin-ext" },
  { code: "is", autonym: "Íslenska", script: "Latin-ext" },
  { code: "it", autonym: "Italiano", script: "Latin" },
  { code: "lt", autonym: "Lietuvių", script: "Latin-ext" },
  { code: "lv", autonym: "Latviešu", script: "Latin-ext" },
  { code: "mt", autonym: "Malti", script: "Latin-ext" },
  { code: "nb", autonym: "Norsk bokmål", script: "Latin" },
  { code: "nl", autonym: "Nederlands", script: "Latin" },
  { code: "pl", autonym: "Polski", script: "Latin-ext" },
  { code: "pt", autonym: "Português", script: "Latin" },
  { code: "ro", autonym: "Română", script: "Latin-ext" },
  { code: "sk", autonym: "Slovenčina", script: "Latin-ext" },
  { code: "sl", autonym: "Slovenščina", script: "Latin-ext" },
  { code: "sv", autonym: "Svenska", script: "Latin" },
  { code: "uk", autonym: "Українська", script: "Cyrillic" },
] as const;

// Compile-time shape guard: fails to build if a row above is malformed.
// No runtime effect, and it does not widen LOCALES (so `Locale` stays a
// literal union below).
const _shapeGuard: readonly {
  code: string;
  autonym: string;
  script: Script;
}[] = LOCALES;
void _shapeGuard;

/** Union of every supported locale code — never widen this to `string`. */
export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Cookie carrying the locale for anonymous visitors (and a fast cache
 * for signed-in ones). Read by the middleware (Edge), the server-side
 * resolver, and next-intl's request config; written by the middleware,
 * the switcher action, and the post-auth / onboarding / settings flows.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

/** All codes, in menu order. */
export const LOCALE_CODES: Locale[] = LOCALES.map((l) => l.code);

const LOCALE_CODE_SET: ReadonlySet<string> = new Set(LOCALE_CODES);

/** Narrowing type guard — the only sanctioned way to validate a code. */
export function isSupportedLocale(x: unknown): x is Locale {
  return typeof x === "string" && LOCALE_CODE_SET.has(x);
}

const AUTONYMS: Record<Locale, string> = Object.fromEntries(
  LOCALES.map((l) => [l.code, l.autonym]),
) as Record<Locale, string>;

/** Endonym for a locale, e.g. `de` → "Deutsch". */
export function autonymOf(code: Locale): string {
  return AUTONYMS[code];
}

// ────────────────────────────────────────────────────────────────────
// Country → locale map (first-visit IP geolocation).
//
// Keys are ISO 3166-1 alpha-2 country codes (as Vercel's
// `x-vercel-ip-country` reports them, uppercase). Any unmapped country
// (US, JP, …) falls through to Accept-Language negotiation, then `en`.
// ────────────────────────────────────────────────────────────────────

export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // English
  GB: "en", IE: "en",
  // German
  DE: "de", AT: "de", CH: "de", LI: "de",
  // French
  FR: "fr", MC: "fr", LU: "fr",
  // Dutch
  NL: "nl", BE: "nl",
  // Spanish
  ES: "es",
  // Italian
  IT: "it", SM: "it", VA: "it",
  // Portuguese
  PT: "pt",
  // Swedish
  SE: "sv", AX: "sv",
  // Norwegian
  NO: "nb", SJ: "nb",
  // Danish
  DK: "da", FO: "da", GL: "da",
  // Finnish
  FI: "fi",
  // Icelandic
  IS: "is",
  // Greek
  GR: "el", CY: "el",
  // Polish
  PL: "pl",
  // Czech
  CZ: "cs",
  // Slovak
  SK: "sk",
  // Hungarian
  HU: "hu",
  // Romanian
  RO: "ro", MD: "ro",
  // Bulgarian
  BG: "bg",
  // Croatian
  HR: "hr",
  // Slovenian
  SI: "sl",
  // Estonian
  EE: "et",
  // Latvian
  LV: "lv",
  // Lithuanian
  LT: "lt",
  // Maltese
  MT: "mt",
  // Ukrainian
  UA: "uk",
};

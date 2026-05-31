import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { getActiveLocale } from "@/lib/i18n/locale";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/locales";
import en from "../messages/en.json";

// ────────────────────────────────────────────────────────────────────
// next-intl request config (no-i18n-routing mode).
//
// The locale is resolved by getActiveLocale() (DB → cookie → header),
// not from a URL segment. The active catalog is deep-merged OVER the
// English source so any missing or empty key falls back to English
// per-key — a missing key must never crash a page.
// ────────────────────────────────────────────────────────────────────

type Messages = typeof en;

// Deep per-key merge: `override` wins, but a missing / empty value falls
// back to `base` (English). Objects recurse; everything else replaces.
function deepMerge(base: unknown, override: unknown): unknown {
  if (
    base === null ||
    typeof base !== "object" ||
    Array.isArray(base) ||
    override === null ||
    typeof override !== "object" ||
    Array.isArray(override)
  ) {
    // Treat empty string as "absent" so blank translations show English.
    if (override === undefined || override === null || override === "") {
      return base;
    }
    return override;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    out[key] = deepMerge(
      (base as Record<string, unknown>)[key],
      (override as Record<string, unknown>)[key],
    );
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // An explicitly requested locale (from getTranslations({locale}) — used
  // for email in the recipient's language, and metadata) takes precedence;
  // otherwise resolve from the request (DB → cookie → header).
  const requested = await requestLocale;
  const locale =
    requested && isSupportedLocale(requested)
      ? requested
      : await getActiveLocale();

  let messages: Messages = en;

  if (locale !== DEFAULT_LOCALE) {
    try {
      const localeModule = await import(`../messages/${locale}.json`);
      messages = deepMerge(en, localeModule.default) as Messages;
    } catch {
      // No catalog for this locale yet — render entirely in English.
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[i18n] no catalog for "${locale}", falling back to "${DEFAULT_LOCALE}"`,
        );
      }
    }

    // Dev: surface whole namespaces missing from a partial catalog.
    if (process.env.NODE_ENV !== "production") {
      for (const ns of Object.keys(en)) {
        if (!(ns in (messages as Record<string, unknown>))) {
          console.warn(`[i18n] locale "${locale}" missing namespace "${ns}"`);
        }
      }
    }
  }

  // Cast: a few catalog values are string[] (e.g. intake step headline
  // segments, read via t.raw at render). next-intl supports arrays at
  // runtime, but its AbstractIntlMessages type only models string/object.
  return { locale, messages: messages as unknown as AbstractIntlMessages };
});

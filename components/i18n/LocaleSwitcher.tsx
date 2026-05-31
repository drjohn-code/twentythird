"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALES, autonymOf, type Locale } from "@/lib/i18n/locales";
import { setUserLocale } from "@/lib/i18n/actions";

// The toolbar language badge. Renders a small mono code (e.g. EN) beside
// the theme toggle — it reads cleanest next to the round toggle and shows
// the active language at a glance. Opens a glass listbox of autonyms,
// each lang-tagged to itself. Selecting one writes cookie + DB via the
// server action, then refreshes so server components re-render translated.
export default function LocaleSwitcher() {
  const active = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Close on outside pointer-down and on Escape (returning focus to trigger).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus to the active option (or the first) when the menu opens.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el =
      list.querySelector<HTMLButtonElement>('[data-active="true"]') ??
      list.querySelector<HTMLButtonElement>('[role="option"]');
    el?.focus();
  }, [open]);

  function choose(code: Locale) {
    setOpen(false);
    triggerRef.current?.focus();
    if (code === active) return;
    startTransition(async () => {
      await setUserLocale(code);
      // Re-render server components in the new language.
      router.refresh();
    });
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ??
        [],
    );
    if (options.length === 0) return;
    const idx = options.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      options[Math.min(idx + 1, options.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      options[Math.max(idx - 1, 0)]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      options[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      options[options.length - 1]?.focus();
    }
  }

  return (
    <div className="locale-switcher" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="locale-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("language")}: ${autonymOf(active)}`}
        data-pending={isPending ? "true" : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="locale-switcher-code">{active.toUpperCase()}</span>
        <span className="locale-switcher-caret" aria-hidden="true">
          ↓
        </span>
      </button>
      {open ? (
        <div
          ref={listRef}
          className="locale-switcher-menu glass"
          role="listbox"
          aria-label={t("language")}
          onKeyDown={onListKeyDown}
        >
          {LOCALES.map((l) => {
            const isActive = l.code === active;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={isActive}
                aria-current={isActive ? "true" : undefined}
                data-active={isActive ? "true" : undefined}
                lang={l.code}
                className="locale-switcher-option"
                onClick={() => choose(l.code)}
              >
                <span className="locale-switcher-name">{l.autonym}</span>
                <span className="locale-switcher-optcode">
                  {l.code.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

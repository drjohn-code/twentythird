"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Select from "@/components/ui/Select";
import { LOCALES } from "@/lib/i18n/locales";
import { dispatchSettingsSaved } from "@/components/room/SettingsSaveStrip";

// LocaleSelectField — Settings → Account language cell. A real dropdown
// of every supported locale (autonyms). Writes immediately on change
// (no save button, consistent with the rest of the page): users_meta +
// NEXT_LOCALE cookie via /api/settings/account, then flashes the save
// strip and refreshes so every Room page re-renders in the new language.

const OPTIONS = LOCALES.map((l) => ({ value: l.code, label: l.autonym }));

export default function LocaleSelectField({ locale }: { locale: string }) {
  const [current, setCurrent] = useState(locale);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === current) return;
    const prev = current;
    setCurrent(next);
    setError(null);
    try {
      const res = await fetch("/api/settings/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ field: "locale", value: next }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; value: string }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        setCurrent(prev);
        setError(data && data.ok === false ? data.error : "save failed");
        return;
      }
      dispatchSettingsSaved();
      startTransition(() => router.refresh());
    } catch {
      setCurrent(prev);
      setError("save failed");
    }
  }

  return (
    <div className="account-cell">
      <dt>language</dt>
      <dd>
        <Select
          aria-label="language"
          options={OPTIONS}
          value={current}
          onChange={onChange}
          disabled={isPending}
        />
        {error ? <p className="inline-edit-error">{error}</p> : null}
      </dd>
    </div>
  );
}

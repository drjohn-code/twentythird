"use client";

import { useState, useTransition } from "react";
import { dispatchSettingsSaved } from "@/components/room/SettingsSaveStrip";

// EmailToggles — four boolean rows + a quiet-hours range.
// Saves on change. No save button. On success the SettingsSaveStrip
// pulses via dispatchSettingsSaved().

export type EmailPreferences = {
  weekly_catchup: boolean;
  consulting_session_reminder: boolean;
  quiet_hours_start: string; // "HH:MM"
  quiet_hours_end: string;
};

const TOGGLES: ReadonlyArray<{
  key: keyof Pick<
    EmailPreferences,
    "weekly_catchup" | "consulting_session_reminder"
  >;
  label: string;
  sub: string;
}> = [
  {
    key: "weekly_catchup",
    label: "weekly catchup reminder",
    sub: "a quiet note at the start of the new week",
  },
  {
    key: "consulting_session_reminder",
    label: "consulting session reminder",
    sub: "a reminder before your upcoming consultation",
  },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0") + ":00",
);

type Props = {
  initial: EmailPreferences;
};

export default function EmailToggles({ initial }: Props) {
  const [prefs, setPrefs] = useState<EmailPreferences>(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Partial<EmailPreferences>) {
    setError(null);
    // Optimistic update.
    const optimistic = { ...prefs, ...patch };
    setPrefs(optimistic);

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/email", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          setPrefs(prefs); // revert
          setError("save failed");
          return;
        }
        dispatchSettingsSaved();
      } catch {
        setPrefs(prefs);
        setError("save failed");
      }
    });
  }

  return (
    <div className="email-toggles">
      <ul className="email-toggles-list">
        {TOGGLES.map((t) => (
          <li key={t.key} className="email-toggles-row">
            <div className="email-toggles-text">
              <span className="email-toggles-label">{t.label}</span>
              <span className="email-toggles-sub">{t.sub}</span>
            </div>
            <button
              type="button"
              className={
                "email-toggle-switch" +
                (prefs[t.key] ? " is-on" : "")
              }
              onClick={() => save({ [t.key]: !prefs[t.key] } as Partial<EmailPreferences>)}
              aria-pressed={prefs[t.key]}
              aria-label={`${t.label} — ${prefs[t.key] ? "on" : "off"}`}
            >
              <span className="email-toggle-track" aria-hidden="true">
                <span className="email-toggle-dot" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="email-quiet">
        <div className="email-quiet-head">
          <span className="email-toggles-label">quiet hours</span>
          <span className="email-toggles-sub">
            no email between these hours, in your local time
          </span>
        </div>
        <div className="email-quiet-row">
          <label className="email-quiet-field">
            <span className="email-quiet-key">from</span>
            <select
              className="email-quiet-select"
              value={prefs.quiet_hours_start}
              onChange={(e) =>
                save({ quiet_hours_start: e.target.value })
              }
            >
              {HOURS_24.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="email-quiet-field">
            <span className="email-quiet-key">to</span>
            <select
              className="email-quiet-select"
              value={prefs.quiet_hours_end}
              onChange={(e) =>
                save({ quiet_hours_end: e.target.value })
              }
            >
              {HOURS_24.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="email-toggles-error">{error}</p> : null}
    </div>
  );
}

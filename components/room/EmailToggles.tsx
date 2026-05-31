"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { dispatchSettingsSaved } from "@/components/room/SettingsSaveStrip";

// EmailToggles — four boolean rows + a quiet-hours range.
// Saves on change. No save button. On success the SettingsSaveStrip
// pulses via dispatchSettingsSaved().

export type EmailPreferences = {
  weekly_catchup: boolean;
  consulting_session_reminder: boolean;
  connection_requests: boolean;
  quiet_hours_start: string; // "HH:MM"
  quiet_hours_end: string;
};

const TOGGLES: ReadonlyArray<{
  key: keyof Pick<
    EmailPreferences,
    "weekly_catchup" | "consulting_session_reminder" | "connection_requests"
  >;
}> = [
  { key: "weekly_catchup" },
  { key: "consulting_session_reminder" },
  { key: "connection_requests" },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0") + ":00",
);

type Props = {
  initial: EmailPreferences;
};

export default function EmailToggles({ initial }: Props) {
  const t = useTranslations("settings");
  const [prefs, setPrefs] = useState<EmailPreferences>(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<boolean>(false);

  async function save(patch: Partial<EmailPreferences>) {
    setError(false);
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
          setError(true);
          return;
        }
        dispatchSettingsSaved();
      } catch {
        setPrefs(prefs);
        setError(true);
      }
    });
  }

  return (
    <div className="email-toggles">
      <ul className="email-toggles-list">
        {TOGGLES.map((t2) => (
          <li key={t2.key} className="email-toggles-row">
            <div className="email-toggles-text">
              <span className="email-toggles-label">
                {t(`toggles.${t2.key}.label`)}
              </span>
              <span className="email-toggles-sub">
                {t(`toggles.${t2.key}.sub`)}
              </span>
            </div>
            <button
              type="button"
              className={
                "email-toggle-switch" +
                (prefs[t2.key] ? " is-on" : "")
              }
              onClick={() => save({ [t2.key]: !prefs[t2.key] } as Partial<EmailPreferences>)}
              aria-pressed={prefs[t2.key]}
              aria-label={`${t(`toggles.${t2.key}.label`)} — ${prefs[t2.key] ? t("toggleOn") : t("toggleOff")}`}
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
          <span className="email-toggles-label">{t("quietHours.label")}</span>
          <span className="email-toggles-sub">{t("quietHours.sub")}</span>
        </div>
        <div className="email-quiet-row">
          <label className="email-quiet-field">
            <span className="email-quiet-key">{t("quietHours.from")}</span>
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
            <span className="email-quiet-key">{t("quietHours.to")}</span>
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

      {error ? (
        <p className="email-toggles-error">{t("saveFailed")}</p>
      ) : null}
    </div>
  );
}

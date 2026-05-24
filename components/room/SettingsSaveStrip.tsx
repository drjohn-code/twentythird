"use client";

import { useEffect, useState } from "react";

// SettingsSaveStrip — the quiet hairline at the top of /settings that
// fills left-to-right for 600ms whenever any block writes successfully.
// No toast, no checkmark. Listens for a window-level CustomEvent so
// any block (intake edit, email toggle, language change) can trigger
// the same gesture without prop drilling.

export const SETTINGS_SAVE_EVENT = "twentythird:settings-saved" as const;

export default function SettingsSaveStrip() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const onSaved = () => setPulse((n) => n + 1);
    window.addEventListener(SETTINGS_SAVE_EVENT, onSaved);
    return () => window.removeEventListener(SETTINGS_SAVE_EVENT, onSaved);
  }, []);

  return (
    <div className="settings-save-strip" aria-hidden="true">
      {/* The key change retriggers the CSS keyframe each save. */}
      <span key={pulse} className={pulse > 0 ? "settings-save-fill is-on" : "settings-save-fill"} />
    </div>
  );
}

export function dispatchSettingsSaved() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SETTINGS_SAVE_EVENT));
}

"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { dispatchSettingsSaved } from "@/components/room/SettingsSaveStrip";

// InlineEditField — Settings → Account micro-pattern.
//
// Renders one cell of the horizontal Account row in three modes:
//   resting  → eyebrow + value + `change →`
//   editing  → eyebrow + <input> + `save →` / `cancel`
//   saving   → same as editing but links disabled and input readOnly
//
// Enter saves, Esc cancels. On success the value collapses back and
// SettingsSaveStrip flashes via dispatchSettingsSaved(). Validation or
// server errors surface as a serif italic line below the input.

export type SaveResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

type Props = {
  /** Eyebrow text — rendered lowercase to match the existing Account row. */
  label: string;
  /** Current display value. */
  value: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  placeholder?: string;
  /** Returns an error string, or null when valid. */
  validate: (v: string) => string | null;
  /** Performs the server write. */
  onSave: (v: string) => Promise<SaveResult>;
};

export default function InlineEditField({
  label,
  value,
  inputMode = "text",
  maxLength,
  placeholder,
  validate,
  onSave,
}: Props) {
  const [current, setCurrent] = useState(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function open() {
    setDraft(current);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    if (saving) return;
    setEditing(false);
    setDraft(current);
    setError(null);
  }

  async function commit() {
    if (saving) return;
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(draft);
      if (result.ok) {
        setCurrent(result.value);
        setDraft(result.value);
        setEditing(false);
        dispatchSettingsSaved();
      } else {
        setError(result.error);
      }
    } catch {
      setError("save failed");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  return (
    <div className="account-cell">
      <dt>{label.toLowerCase()}</dt>
      {editing ? (
        <>
          <dd>
            <input
              ref={inputRef}
              type="text"
              inputMode={inputMode}
              pattern={inputMode === "numeric" ? "[0-9]*" : undefined}
              maxLength={maxLength}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              readOnly={saving}
              aria-label={label}
              className="inline-edit-input"
            />
            {error ? <p className="inline-edit-error">{error}</p> : null}
          </dd>
          <div className="account-cell-foot inline-edit-actions">
            <button
              type="button"
              className="auth-rowlink auth-rowlink-button"
              onClick={() => void commit()}
              disabled={saving}
            >
              <span>{saving ? "saving" : "save"}</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="inline-edit-cancel"
              onClick={cancel}
              disabled={saving}
            >
              cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <dd>
            <span>{current.length > 0 ? current : "—"}</span>
          </dd>
          <div className="account-cell-foot">
            <button
              type="button"
              className="auth-rowlink auth-rowlink-button"
              onClick={open}
            >
              <span>change</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

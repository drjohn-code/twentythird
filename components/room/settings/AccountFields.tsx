"use client";

import InlineEditField, {
  type SaveResult,
} from "@/components/room/settings/InlineEditField";
import ResetPasswordRow from "@/components/room/settings/ResetPasswordRow";
import LocaleSelectField from "@/components/room/settings/LocaleSelectField";

// AccountFields — the four-cell horizontal row inside the Account
// SettingsBlock. Holds the validate/onSave closures so the parent
// server page only has to pass serialisable strings. Name and Birth
// year inline-edit; Email triggers a recovery email; Language is a
// live dropdown of every supported locale.

type Props = {
  fullName: string;
  email: string;
  birthYear: number | null;
  locale: string;
};

const NAME_MAX = 80;
const BIRTH_YEAR_MIN = 1900;
// Mirrors the server bound: must be at least 13. Computed per-call so
// the range advances with the calendar without a code change.
const BIRTH_YEAR_MIN_AGE = 13;

function birthYearMax(): number {
  return new Date().getUTCFullYear() - BIRTH_YEAR_MIN_AGE;
}

function birthYearError(): string {
  return `birth year must be between ${BIRTH_YEAR_MIN} and ${birthYearMax()}`;
}

function validateName(v: string): string | null {
  const trimmed = v.trim();
  if (trimmed.length === 0) return "name cannot be empty";
  if (trimmed.length > NAME_MAX) return "name must be 80 characters or fewer";
  return null;
}

function validateBirthYear(v: string): string | null {
  const trimmed = v.trim();
  if (!/^\d{4}$/.test(trimmed)) return birthYearError();
  const year = Number(trimmed);
  if (year < BIRTH_YEAR_MIN || year > birthYearMax()) return birthYearError();
  return null;
}

async function saveAccountField(
  field: "name" | "birth_year",
  value: string,
): Promise<SaveResult> {
  try {
    const res = await fetch("/api/settings/account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: true; value: string }
      | { ok: false; error: string }
      | null;
    if (!res.ok || !data || data.ok !== true) {
      return {
        ok: false,
        error: data && data.ok === false ? data.error : "save failed",
      };
    }
    return { ok: true, value: data.value };
  } catch {
    return { ok: false, error: "save failed" };
  }
}

export default function AccountFields({
  fullName,
  email,
  birthYear,
  locale,
}: Props) {
  return (
    <dl className="account-row-horizontal">
      <InlineEditField
        label="NAME"
        value={fullName}
        maxLength={NAME_MAX}
        validate={validateName}
        onSave={(v) => saveAccountField("name", v.trim())}
      />
      <div className="account-cell">
        <dt>email</dt>
        <dd>
          <span title={email || undefined}>{email || "—"}</span>
        </dd>
        <ResetPasswordRow email={email} />
      </div>
      <InlineEditField
        label="BIRTH YEAR"
        value={birthYear != null ? String(birthYear) : ""}
        inputMode="numeric"
        maxLength={4}
        validate={validateBirthYear}
        onSave={(v) => saveAccountField("birth_year", v.trim())}
      />
      <LocaleSelectField locale={locale} />
    </dl>
  );
}

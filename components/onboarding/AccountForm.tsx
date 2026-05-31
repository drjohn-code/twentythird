"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import RadioGroup from "@/components/ui/RadioGroup";
import Select from "@/components/ui/Select";
import InlineError from "@/components/ui/InlineError";
import { initiateAccount } from "@/app/onboarding/account/actions";
import { MAX_BIRTH_YEAR } from "@/lib/onboarding/schema";
import { LOCALES } from "@/lib/i18n/locales";

type Props = {
  defaultName: string;
  prefilledFromGoogle: boolean;
  defaultBirthYear: string;
  defaultGender: string;
  /** Current resolved locale — the language field defaults to this. */
  defaultLocale: string;
  errorField?: string;
  errorKind?: string;
};

const LOCALE_OPTIONS = LOCALES.map((l) => ({
  value: l.code,
  label: l.autonym,
}));

const GENDER_OPTIONS = [
  { value: "male", labelKey: "account.gender.male" },
  { value: "female", labelKey: "account.gender.female" },
  { value: "non_binary", labelKey: "account.gender.nonBinary" },
  { value: "prefer_not_to_say", labelKey: "account.gender.preferNotToSay" },
] as const;

const MIN_AGE_OFFSET = 13;
const MAX_AGE_OFFSET = 100;

export default function AccountForm({
  defaultName,
  prefilledFromGoogle,
  defaultBirthYear,
  defaultGender,
  defaultLocale,
  errorField,
  errorKind,
}: Props) {
  const t = useTranslations("onboarding");
  const [name, setName] = useState(defaultName);
  const [year, setYear] = useState(defaultBirthYear);
  const [gender, setGender] = useState<string | null>(defaultGender || null);
  const [locale, setLocale] = useState(defaultLocale);
  const [terms, setTerms] = useState(false);

  const genderOptions = useMemo(
    () =>
      GENDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );

  const years = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const top = MAX_BIRTH_YEAR;
    const bottom = top - (MAX_AGE_OFFSET - MIN_AGE_OFFSET);
    for (let y = top; y >= bottom; y--) {
      out.push({ value: String(y), label: String(y) });
    }
    return out;
  }, []);

  const nameOk = name.trim().length > 0;
  const yearOk = year !== "";
  const genderOk = !!gender;
  const ready = nameOk && yearOk && genderOk && terms;

  const showFieldError = (field: string) =>
    errorKind === "invalid" && errorField === field;

  return (
    <form action={initiateAccount} className="auth-form account-form" noValidate>
      {errorKind === "save_failed" ? (
        <InlineError>
          {t("account.saveFailed")}
        </InlineError>
      ) : null}

      <Field
        id="acc-name"
        label={t("account.nameLabel")}
        hint={
          prefilledFromGoogle ? (
            <span className="mono">{t("account.prefilledHint")}</span>
          ) : undefined
        }
        error={
          showFieldError("full_name") ? t("account.nameRequired") : undefined
        }
      >
        <Input
          id="acc-name"
          name="full_name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={showFieldError("full_name")}
          required
          aria-required="true"
        />
      </Field>

      <Field
        id="acc-year"
        label={t("account.yearLabel")}
        error={
          showFieldError("birth_year") ? t("account.yearRequired") : undefined
        }
      >
        <Select
          id="acc-year"
          name="birth_year"
          options={years}
          placeholder="—"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          invalid={showFieldError("birth_year")}
          required
          aria-required="true"
        />
      </Field>

      <Field
        asFieldset
        label={t("account.genderLabel")}
        error={
          showFieldError("gender") ? t("account.genderRequired") : undefined
        }
      >
        <RadioGroup
          name="gender"
          legend={t("account.genderLabel")}
          options={genderOptions}
          value={gender}
          onChange={setGender}
        />
        {/* Radio buttons render as type="button" so they don't contribute
            to FormData; mirror the controlled value here for submission. */}
        <input type="hidden" name="gender" value={gender ?? ""} />
      </Field>

      <Field id="acc-locale" label={t("account.languageLabel")}>
        <Select
          id="acc-locale"
          name="locale"
          options={LOCALE_OPTIONS}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        />
      </Field>

      <div className="auth-field onb-field terms-field">
        <Checkbox
          name="terms_accepted"
          checked={terms}
          onChange={setTerms}
        >
          {t("account.termsBefore")}{" "}
          <a
            href="/legal/terms"
            target="_blank"
            rel="noreferrer"
            className="auth-rowlink terms-link"
          >
            {t("account.termsLink")}
          </a>{" "}
          {t("account.termsAnd")}{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="auth-rowlink terms-link"
          >
            {t("account.privacyLink")}
          </a>
          {t("account.termsAfter")}
        </Checkbox>
      </div>

      <SubmitButton disabled={!ready} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("onboarding");
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="pill account-submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      <span>{t("account.submit")}</span>
      {pending ? (
        <em className="auth-submit-pending">…</em>
      ) : (
        <span aria-hidden="true" className="serif-i">
          →
        </span>
      )}
    </button>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import Checkbox from "@/components/ui/Checkbox";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import RadioGroup from "@/components/ui/RadioGroup";
import Select from "@/components/ui/Select";
import InlineError from "@/components/ui/InlineError";
import { initiateAccount } from "@/app/onboarding/account/actions";
import { MAX_BIRTH_YEAR } from "@/lib/onboarding/schema";

type Props = {
  defaultName: string;
  prefilledFromGoogle: boolean;
  defaultBirthYear: string;
  defaultGender: string;
  errorField?: string;
  errorKind?: string;
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const MIN_AGE_OFFSET = 13;
const MAX_AGE_OFFSET = 100;

export default function AccountForm({
  defaultName,
  prefilledFromGoogle,
  defaultBirthYear,
  defaultGender,
  errorField,
  errorKind,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [year, setYear] = useState(defaultBirthYear);
  const [gender, setGender] = useState<string | null>(defaultGender || null);
  const [terms, setTerms] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function onSubmit(formData: FormData) {
    if (gender) formData.set("gender", gender);
    formData.set("terms_accepted", terms ? "on" : "");
    startTransition(() => {
      initiateAccount(formData);
    });
  }

  const showFieldError = (field: string) =>
    errorKind === "invalid" && errorField === field;

  return (
    <form action={onSubmit} className="auth-form account-form" noValidate>
      {errorKind === "save_failed" ? (
        <InlineError>
          Couldn&apos;t save that. Try again in a moment.
        </InlineError>
      ) : null}

      <Field
        id="acc-name"
        label="NAME"
        hint={
          prefilledFromGoogle ? (
            <span className="mono">prefilled from Google · editable</span>
          ) : undefined
        }
        error={
          showFieldError("full_name") ? "Name is required." : undefined
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
        label="YEAR OF BIRTH"
        error={
          showFieldError("birth_year") ? "Select a year." : undefined
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
        label="GENDER"
        error={
          showFieldError("gender") ? "Pick one." : undefined
        }
      >
        <RadioGroup
          name="gender"
          legend="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
        />
      </Field>

      <div className="auth-field onb-field terms-field">
        <Checkbox
          name="terms_accepted"
          checked={terms}
          onChange={setTerms}
        >
          I accept the{" "}
          <a
            href="/legal/terms"
            target="_blank"
            rel="noreferrer"
            className="auth-rowlink terms-link"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="auth-rowlink terms-link"
          >
            Privacy Policy
          </a>
          .
        </Checkbox>
      </div>

      <button
        type="submit"
        className="pill account-submit"
        disabled={!ready || isPending}
        aria-busy={isPending || undefined}
      >
        <span>Initiate account</span>
        {isPending ? (
          <em className="auth-submit-pending">…</em>
        ) : (
          <span aria-hidden="true" className="serif-i">
            →
          </span>
        )}
      </button>
    </form>
  );
}

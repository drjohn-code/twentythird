"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// AcceptInviteActions — the three hairline-bordered selectable rows
// shown on /invite/<token>. Each row reveals a small inline state to
// capture the invitee's first name before posting.
//
// Both accept paths (with-account, without-account) collect a first
// name; "no, thank you" requires no additional information.

type Action = "accept-account" | "accept" | "decline";

type Props = {
  token: string;
  /** Inviter's first name — used in the local strings. */
  inviterFirstName: string;
};

export default function AcceptInviteActions({ token, inviterFirstName }: Props) {
  const router = useRouter();
  const t = useTranslations("invite");
  const [open, setOpen] = useState<Action | null>(null);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: Action) {
    setError(null);

    if (action !== "decline" && firstName.trim().length === 0) {
      setError(t("actions.errors.missingFirstName"));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/connections?action=${action}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            first_name: firstName.trim(),
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(humanError(data?.error, t));
          return;
        }
        if (action === "decline") {
          router.push(`/invite/${token}/declined`);
        } else {
          // Both accept paths land on the relationship intake. The
          // account-creation magic-link is stubbed for Phase 6, so
          // both go to the same destination.
          router.push(`/invite/${token}/intake`);
        }
        router.refresh();
      } catch {
        setError(t("actions.errors.generic"));
      }
    });
  }

  return (
    <div className="invite-actions">
      <button
        type="button"
        className={
          "invite-action" + (open === "accept-account" ? " is-open" : "")
        }
        onClick={() => setOpen("accept-account")}
      >
        <span className="invite-action-label">
          {t("actions.acceptAccountLabel")}
        </span>
        <span aria-hidden="true">→</span>
      </button>
      {open === "accept-account" ? (
        <NameForm
          inviterFirstName={inviterFirstName}
          value={firstName}
          onChange={setFirstName}
          onSubmit={() => submit("accept-account")}
          onCancel={() => {
            setOpen(null);
            setError(null);
          }}
          submitLabel={t("actions.beginLabel")}
          isPending={isPending}
          error={error}
        />
      ) : null}

      <button
        type="button"
        className={
          "invite-action" + (open === "accept" ? " is-open" : "")
        }
        onClick={() => setOpen("accept")}
      >
        <span className="invite-action-label">
          {t("actions.acceptLabel")}
        </span>
        <span aria-hidden="true">→</span>
      </button>
      {open === "accept" ? (
        <NameForm
          inviterFirstName={inviterFirstName}
          value={firstName}
          onChange={setFirstName}
          onSubmit={() => submit("accept")}
          onCancel={() => {
            setOpen(null);
            setError(null);
          }}
          submitLabel={t("actions.continueLabel")}
          isPending={isPending}
          error={error}
        />
      ) : null}

      <button
        type="button"
        className={"invite-action" + (open === "decline" ? " is-open" : "")}
        onClick={() => setOpen("decline")}
      >
        <span className="invite-action-label">{t("actions.declineLabel")}</span>
        <span aria-hidden="true">→</span>
      </button>
      {open === "decline" ? (
        <div className="invite-action-confirm">
          <p className="invite-action-confirm-line">
            {t("actions.declineConfirmLine")}
          </p>
          {error ? <p className="invite-action-error">{error}</p> : null}
          <div className="invite-action-actions">
            <button
              type="button"
              className="relintake-back"
              onClick={() => {
                setOpen(null);
                setError(null);
              }}
              disabled={isPending}
            >
              {t("actions.back")}
            </button>
            <button
              type="button"
              className="relintake-next"
              onClick={() => submit("decline")}
              disabled={isPending}
            >
              <span>
                {isPending
                  ? t("actions.declineClosing")
                  : t("actions.declineConfirm")}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NameForm({
  inviterFirstName,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
  error,
}: {
  inviterFirstName: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
}) {
  const t = useTranslations("invite");
  return (
    <div className="invite-action-confirm">
      <label className="invite-action-label-field" htmlFor="invite-first-name">
        <span className="eyebrow">{t("actions.firstNameLabel")}</span>
        <input
          id="invite-first-name"
          type="text"
          autoComplete="given-name"
          className="invite-action-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={60}
          autoFocus
          aria-label={t("actions.firstNameAria")}
        />
      </label>
      <p className="invite-action-confirm-sub">
        {t("actions.firstNameSub", { name: inviterFirstName })}
      </p>
      {error ? <p className="invite-action-error">{error}</p> : null}
      <div className="invite-action-actions">
        <button
          type="button"
          className="relintake-back"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("actions.back")}
        </button>
        <button
          type="button"
          className="relintake-next"
          onClick={onSubmit}
          disabled={isPending}
        >
          <span>{isPending ? t("actions.oneMoment") : submitLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function humanError(
  code: string | undefined | null,
  t: (key: string) => string,
): string {
  switch (code) {
    case "invite_not_found":
      return t("actions.errors.notFound");
    case "invite_expired":
      return t("actions.errors.expired");
    case "invite_declined":
      return t("actions.errors.declined");
    case "invite_ended":
      return t("actions.errors.ended");
    case "missing_first_name":
      return t("actions.errors.missingFirstNameRequired");
    default:
      return t("actions.errors.generic");
  }
}

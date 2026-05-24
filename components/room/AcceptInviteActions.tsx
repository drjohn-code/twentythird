"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  const [open, setOpen] = useState<Action | null>(null);
  const [firstName, setFirstName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: Action) {
    setError(null);

    if (action !== "decline" && firstName.trim().length === 0) {
      setError("a first name lets the analyst address you correctly.");
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
          setError(humanError(data?.error));
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
        setError("could not submit.");
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
          yes — begin the relationship intake
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
          submitLabel="begin"
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
          yes — connect without an account
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
          submitLabel="continue"
          isPending={isPending}
          error={error}
        />
      ) : null}

      <button
        type="button"
        className={"invite-action" + (open === "decline" ? " is-open" : "")}
        onClick={() => setOpen("decline")}
      >
        <span className="invite-action-label">no, thank you</span>
        <span aria-hidden="true">→</span>
      </button>
      {open === "decline" ? (
        <div className="invite-action-confirm">
          <p className="invite-action-confirm-line">
            this closes the invite. nothing further is sent or stored about
            you.
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
              back
            </button>
            <button
              type="button"
              className="relintake-next"
              onClick={() => submit("decline")}
              disabled={isPending}
            >
              <span>{isPending ? "closing…" : "decline the invite"}</span>
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
  return (
    <div className="invite-action-confirm">
      <label className="invite-action-label-field" htmlFor="invite-first-name">
        <span className="eyebrow">YOUR FIRST NAME</span>
        <input
          id="invite-first-name"
          type="text"
          autoComplete="given-name"
          className="invite-action-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={60}
          autoFocus
          aria-label="Your first name"
        />
      </label>
      <p className="invite-action-confirm-sub">
        {inviterFirstName} will only see this first name on their
        connection list.
      </p>
      {error ? <p className="invite-action-error">{error}</p> : null}
      <div className="invite-action-actions">
        <button
          type="button"
          className="relintake-back"
          onClick={onCancel}
          disabled={isPending}
        >
          back
        </button>
        <button
          type="button"
          className="relintake-next"
          onClick={onSubmit}
          disabled={isPending}
        >
          <span>{isPending ? "one moment…" : submitLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function humanError(code: string | undefined | null): string {
  switch (code) {
    case "invite_not_found":
      return "this invite link is not recognised.";
    case "invite_expired":
      return "this invite has expired. ask the inviter to send a new one.";
    case "invite_declined":
      return "this invite was already declined.";
    case "invite_ended":
      return "this invite is no longer active.";
    case "missing_first_name":
      return "a first name is required.";
    default:
      return "could not submit.";
  }
}

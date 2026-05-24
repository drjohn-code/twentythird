"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// DisconnectConfirm — typed-name confirmation modal.
// User types the connection's first name to enable the action. On
// success the connection moves to `ended` and the parent re-fetches.

type Props = {
  connectionId: string;
  /** First name as captured at acceptance; falls back to the email's local part. */
  expectedName: string;
};

export default function DisconnectConfirm({ connectionId, expectedName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const enabled =
    typed.trim().toLowerCase() === expectedName.trim().toLowerCase() &&
    typed.trim().length > 0;

  function reset() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/connections?action=disconnect", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            connection_id: connectionId,
            confirm_name: typed.trim(),
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(humanError(data?.error));
          return;
        }
        reset();
        router.refresh();
      } catch {
        setError("could not disconnect");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="auth-rowlink auth-rowlink-button"
        onClick={() => setOpen(true)}
      >
        <span>disconnect</span>
        <span aria-hidden="true">→</span>
      </button>

      {open ? (
        <div
          className="danger-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm disconnect"
          onClick={(e) => {
            if (e.target === e.currentTarget) reset();
          }}
        >
          <div className="danger-modal glass">
            <p className="danger-modal-eyebrow">DISCONNECT</p>
            <h3 className="danger-modal-h">
              End the <span className="it">connection.</span>
            </h3>
            <p className="danger-modal-body">
              Their relationship intake remains in the case file but no
              longer factors into the active reading. They will be
              notified. This cannot be undone — a new invite would be a
              new connection.
            </p>
            <p className="danger-modal-instr">
              type{" "}
              <em className="serif-i">
                &ldquo;{expectedName.toLowerCase()}&rdquo;
              </em>{" "}
              to enable the action.
            </p>
            <input
              type="text"
              className="danger-modal-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              aria-label="Type the first name to confirm"
            />
            {error ? <p className="danger-modal-error">{error}</p> : null}
            <div className="danger-modal-actions">
              <button
                type="button"
                className="danger-modal-cancel"
                onClick={reset}
                disabled={isPending}
              >
                cancel
              </button>
              <button
                type="button"
                className="danger-modal-confirm"
                onClick={confirm}
                disabled={!enabled || isPending}
              >
                {isPending ? "ending…" : "end the connection"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function humanError(code: string | undefined | null): string {
  switch (code) {
    case "confirmation_mismatch":
      return "the typed name does not match.";
    case "not_active":
      return "this connection is no longer active.";
    case "forbidden":
      return "only the two parties can end this connection.";
    default:
      return "could not disconnect.";
  }
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// DangerZone — delete-account row + typed confirmation modal.
// The confirmation phrase is intentionally a sentence ("delete the
// case file") — long enough that nothing about it can be accidental.

const REQUIRED_PHRASE = "delete the case file";

export default function DangerZone() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const enabled = typed.trim().toLowerCase() === REQUIRED_PHRASE;

  function reset() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/delete", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: typed }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(data?.error ?? "delete failed");
          return;
        }
        // Account is gone — leave the room.
        router.push("/");
        router.refresh();
      } catch {
        setError("delete failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="danger-zone-trigger"
        onClick={() => setOpen(true)}
      >
        Delete account
      </button>

      {open ? (
        <div
          className="danger-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm account deletion"
          onClick={(e) => {
            if (e.target === e.currentTarget) reset();
          }}
        >
          <div className="danger-modal glass">
            <p className="danger-modal-eyebrow">DANGER ZONE</p>
            <h3 className="danger-modal-h">
              Erase the <span className="it">case file.</span>
            </h3>
            <p className="danger-modal-body">
              This removes every reading, catchup, session, and report
              from the record. Active connections will be ended; both
              parties will be notified. It cannot be undone.
            </p>
            <p className="danger-modal-instr">
              type{" "}
              <em className="serif-i">&ldquo;{REQUIRED_PHRASE}&rdquo;</em>{" "}
              to enable the action.
            </p>
            <input
              type="text"
              className="danger-modal-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              aria-label="Type the confirmation phrase"
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
                {isPending ? "erasing…" : "erase the case file"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

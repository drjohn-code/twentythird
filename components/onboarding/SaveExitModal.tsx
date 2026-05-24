"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_PATH } from "@/lib/onboarding/routing";

// Save-and-pause confirmation surface used on the onboarding intro
// panel and inside each intake step. Renders the italic-"or" + text
// link affordance like CTAGhost, but opens a quiet glass modal
// instead of navigating. ESC, backdrop click, and "keep going" all
// dismiss; "pause here →" runs the optional pre-navigate hook
// (autosave flush) before pushing the user to the Room gate.

type Props = {
  /** Optional async work to run before navigating away — e.g. flush autosave. */
  onBeforeNavigate?: () => Promise<void>;
};

export default function SaveExitModalTrigger({ onBeforeNavigate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function confirm() {
    startTransition(async () => {
      if (onBeforeNavigate) {
        try {
          await onBeforeNavigate();
        } catch {
          // Best effort — autosave failures should not block exit.
        }
      }
      router.push(DASHBOARD_PATH);
    });
  }

  return (
    <>
      <span className="cta-ghost">
        <em className="cta-ghost-or">or</em>{" "}
        <button
          type="button"
          className="cta-ghost-link"
          onClick={() => setOpen(true)}
        >
          save and return later
        </button>
      </span>

      {open ? (
        <div
          className="danger-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Save and pause"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="danger-modal glass">
            <p className="danger-modal-eyebrow">SAVE &amp; PAUSE</p>
            <h3 className="danger-modal-h">
              <span className="it">Saved.</span> Come back when
              you&apos;re ready.
            </h3>
            <p className="danger-modal-body">
              Everything you&apos;ve written is in your case file. The
              room will open to the same place next time.
            </p>
            <div className="danger-modal-actions">
              <button
                type="button"
                className="danger-modal-cancel"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                keep going
              </button>
              <button
                type="button"
                className="danger-modal-confirm"
                onClick={confirm}
                disabled={pending}
              >
                <span>{pending ? "saving…" : "pause here"}</span>
                <span aria-hidden="true" className="serif-i">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

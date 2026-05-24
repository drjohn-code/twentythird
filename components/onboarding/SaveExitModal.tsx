"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Trigger that flushes the current step's autosave and routes the user
// to /onboarding/saved — a real page, not a modal. The step the user
// was on is carried in the query string so the saved page can offer
// "keep going" back to that exact step.

type Props = {
  /** Optional async work to run before navigating away — flush autosave. */
  onBeforeNavigate?: () => Promise<void>;
  /** Step the user is currently on (omit on the intro panel). */
  step?: number;
};

export default function SaveExitTrigger({ onBeforeNavigate, step }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      if (onBeforeNavigate) {
        try {
          await onBeforeNavigate();
        } catch {
          // Best effort — autosave failures should not block exit.
        }
      }
      const href = step
        ? `/onboarding/saved?step=${step}`
        : `/onboarding/saved`;
      router.push(href);
    });
  }

  return (
    <span className="cta-ghost">
      <em className="cta-ghost-or">or</em>{" "}
      <button
        type="button"
        className="cta-ghost-link"
        onClick={go}
        disabled={pending}
      >
        save and return later
      </button>
    </span>
  );
}

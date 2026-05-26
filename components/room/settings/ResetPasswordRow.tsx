"use client";

import { useState } from "react";

// ResetPasswordRow — Settings → Account email cell action.
//
// The previous `change →` link under email was misleading: email
// changes go through password recovery, not a free-form edit. This
// row triggers Supabase Auth's resetPasswordForEmail against the
// user's current address and swaps itself for a quiet serif italic
// confirmation. Deliverability is owned by Supabase's recovery
// template (the reserved Fig. 02 slot in the room email contract).

type Props = {
  email: string;
};

export default function ResetPasswordRow({ email }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function send() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const res = await fetch("/api/settings/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="account-cell-foot">
        <span className="reset-password-confirm">
          a reset link has been sent to {email}. check your inbox
        </span>
      </div>
    );
  }

  return (
    <div className="account-cell-foot">
      <button
        type="button"
        className="auth-rowlink auth-rowlink-button"
        onClick={send}
        disabled={state === "sending"}
      >
        <span>{state === "sending" ? "sending" : "reset password"}</span>
        <span aria-hidden="true">→</span>
      </button>
      {state === "error" ? (
        <span className="reset-password-error">could not send. try again</span>
      ) : null}
    </div>
  );
}

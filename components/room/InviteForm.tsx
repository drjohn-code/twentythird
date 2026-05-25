"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import RowLink from "@/components/ui/RowLink";
import { CONNECTION_ROLES, isLikelyEmail } from "@/lib/connections";
import { NOTE_MAX_LENGTH } from "@/lib/emails/invite-constants";

// Inline invite form — lives inside the Settings → Connections block.
// Email + role + optional note. Submits to POST /api/connections?action=invite.
// On success the parent revalidates so the new pending row appears in
// the connection list immediately.
//
// Two 422 error codes from the server get bespoke renders:
//   - missing_inviter_first_name → the user has no full_name on
//     profiles, so the invite can't be signed. Send them to settings.
//   - invalid_note_length → the note is longer than NOTE_MAX_LENGTH.
//     The textarea's maxLength matches, so this only fires if a hand-
//     crafted POST circumvents the input.

type Props = {
  /** Called after a successful POST so the parent can revalidate. */
  onSent?: () => void;
};

const ROLE_OPTIONS = CONNECTION_ROLES.map((r) => ({
  value: r.value,
  label: r.label,
}));

type FormError =
  | { kind: "message"; text: string }
  | { kind: "code"; code: string };

export default function InviteForm({ onSent }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLikelyEmail(email.trim())) {
      setError({ kind: "message", text: "please check the email address" });
      return;
    }
    if (!role) {
      setError({ kind: "message", text: "choose a role" });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/connections?action=invite", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            role,
            note: note.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError({ kind: "code", code: data?.error ?? "unknown" });
          return;
        }
        setEmail("");
        setRole("");
        setNote("");
        onSent?.();
        router.refresh();
      } catch {
        setError({ kind: "message", text: "could not send the invite" });
      }
    });
  }

  return (
    <form className="invite-form" onSubmit={submit} noValidate>
      <div className="invite-form-grid">
        <Field id="invite-email" label="EMAIL">
          <Input
            id="invite-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </Field>

        <Field id="invite-role" label="ROLE">
          <Select
            id="invite-role"
            required
            options={ROLE_OPTIONS}
            placeholder="choose one"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field
        id="invite-note"
        label="A SENTENCE THEY WILL READ FIRST"
        hint="optional. one line is enough."
      >
        <Textarea
          id="invite-note"
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
        />
        <div className="invite-form-charcount" aria-live="polite">
          {note.length} / {NOTE_MAX_LENGTH}
        </div>
      </Field>

      {renderError(error)}

      <div className="invite-form-actions">
        <button
          type="submit"
          className="invite-form-submit"
          disabled={isPending}
        >
          <span>{isPending ? "sending…" : "send invite"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function renderError(error: FormError | null) {
  if (!error) return null;

  if (error.kind === "code" && error.code === "missing_inviter_first_name") {
    return (
      <div className="invite-form-error-block" role="alert">
        <p className="invite-form-error">
          Your name is not on file. Add it in settings, then send the
          invite again.
        </p>
        <RowLink href="/settings#account">add your name</RowLink>
      </div>
    );
  }

  if (error.kind === "code" && error.code === "invalid_note_length") {
    return (
      <p className="invite-form-error" role="alert">
        Notes are limited to one line — about {NOTE_MAX_LENGTH} characters.
      </p>
    );
  }

  const text =
    error.kind === "message" ? error.text : humanError(error.code);
  return (
    <p className="invite-form-error" role="alert">
      {text}
    </p>
  );
}

function humanError(code: string): string {
  switch (code) {
    case "subscription_required":
      return "the consulting room subscription is required to invite a connection.";
    case "invalid_email":
      return "please check the email address.";
    case "invalid_role":
      return "choose a role.";
    case "self_invite":
      return "you cannot invite yourself.";
    case "limit_reached":
      return "two connections is the limit. disconnect one to add another.";
    case "pending_invite_exists":
      return "an invite to this email is already pending.";
    case "server_misconfigured":
      return "the server is not configured to send invites yet.";
    default:
      return "could not send the invite.";
  }
}

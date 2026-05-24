"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { CONNECTION_ROLES, isLikelyEmail } from "@/lib/connections";

// Inline invite form — lives inside the Settings → Connections block.
// Email + role + optional note. Submits to POST /api/connections?action=invite.
// On success the parent revalidates so the new pending row appears in
// the connection list immediately.

type Props = {
  /** Called after a successful POST so the parent can revalidate. */
  onSent?: () => void;
};

const ROLE_OPTIONS = CONNECTION_ROLES.map((r) => ({
  value: r.value,
  label: r.label,
}));

export default function InviteForm({ onSent }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLikelyEmail(email.trim())) {
      setError("please check the email address");
      return;
    }
    if (!role) {
      setError("choose a role");
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
          setError(humanError(data?.error));
          return;
        }
        setEmail("");
        setRole("");
        setNote("");
        onSent?.();
        router.refresh();
      } catch {
        setError("could not send the invite");
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
          maxLength={240}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending}
        />
      </Field>

      {error ? <p className="invite-form-error">{error}</p> : null}

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

function humanError(code: string | undefined | null): string {
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

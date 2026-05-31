"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import RowLink from "@/components/ui/RowLink";
import { CONNECTION_ROLES, isLikelyEmail } from "@/lib/connections";
import { NOTE_MAX_LENGTH } from "@/lib/emails/invite-constants";

// Inline invite form — lives inside the Settings → Connections block.
//
// Flow per submit:
//   1. trim + lowercase + regex-check the email client-side.
//   2. POST /api/connections/lookup → returns one of
//      invalid_email | self | limit_reached | not_member |
//      request_sent | request_received | already_connected | available.
//   3. On `available`, POST /api/connections?action=invite (role + note
//      attached). On success the parent revalidates so the new pending
//      row appears immediately.
//
// Every branch renders a state-aware message — the user is never left
// with a dead end. The submit button is disabled across both fetches
// via useTransition so a second click cannot double-fire.

type Props = {
  onSent?: () => void;
  /** The user's effective limit (base + any subscriber bonus). */
  effectiveLimit: number;
};

type FormStatus =
  | { kind: "idle" }
  | { kind: "format-error" }
  | { kind: "self" }
  | { kind: "not-member" }
  | { kind: "request-sent" }
  | { kind: "request-received" }
  | { kind: "already-connected" }
  | { kind: "limit-reached" }
  | { kind: "rate-limited" }
  | { kind: "missing-inviter-name" }
  | { kind: "invalid-note-length" }
  | { kind: "generic-error" }
  | { kind: "sent" };

export default function InviteForm({ onSent, effectiveLimit }: Props) {
  const router = useRouter();
  const t = useTranslations("connections");
  const roleOptions = CONNECTION_ROLES.map((r) => ({
    value: r.value,
    label: t(`roles.${r.value}`),
  }));
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });

    const normalized = email.trim().toLowerCase();
    if (!isLikelyEmail(normalized)) {
      setStatus({ kind: "format-error" });
      return;
    }
    if (!role) {
      setStatus({ kind: "generic-error" });
      return;
    }

    startTransition(async () => {
      try {
        const lookupRes = await fetch("/api/connections/lookup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: normalized }),
        });

        if (lookupRes.status === 429) {
          setStatus({ kind: "rate-limited" });
          return;
        }
        if (!lookupRes.ok) {
          setStatus({ kind: "generic-error" });
          return;
        }

        const lookup = (await lookupRes.json().catch(() => null)) as
          | { status?: string }
          | null;

        switch (lookup?.status) {
          case "invalid_email":
            setStatus({ kind: "format-error" });
            return;
          case "self":
            setStatus({ kind: "self" });
            return;
          case "limit_reached":
            setStatus({ kind: "limit-reached" });
            return;
          case "not_member":
            setStatus({ kind: "not-member" });
            return;
          case "request_sent":
            setStatus({ kind: "request-sent" });
            return;
          case "request_received":
            setStatus({ kind: "request-received" });
            return;
          case "already_connected":
            setStatus({ kind: "already-connected" });
            return;
          case "available":
            break;
          default:
            setStatus({ kind: "generic-error" });
            return;
        }

        // Member confirmed and no existing relationship — send the
        // actual invite. The endpoint re-runs the same checks server-
        // side as defense in depth.
        const inviteRes = await fetch("/api/connections?action=invite", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: normalized,
            role,
            note: note.trim() || undefined,
          }),
        });

        if (!inviteRes.ok) {
          const data = (await inviteRes.json().catch(() => null)) as
            | { error?: string }
            | null;
          setStatus(mapInviteError(data?.error));
          return;
        }

        setEmail("");
        setRole("");
        setNote("");
        setStatus({ kind: "sent" });
        onSent?.();
        router.refresh();
      } catch {
        setStatus({ kind: "generic-error" });
      }
    });
  }

  async function copySignupLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/auth/sign-up`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused — fall back to a window prompt so the user
      // can still copy the link by hand.
      window.prompt("copy this link to share", url);
    }
  }

  return (
    <form className="invite-form" onSubmit={submit} noValidate>
      <div className="invite-form-grid">
        <Field id="invite-email" label={t("form.emailLabel")}>
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

        <Field id="invite-role" label={t("form.roleLabel")}>
          <Select
            id="invite-role"
            required
            options={roleOptions}
            placeholder={t("form.rolePlaceholder")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isPending}
          />
        </Field>
      </div>

      <Field
        id="invite-note"
        label={t("form.noteLabel")}
        hint={t("form.noteHint")}
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

      {renderStatus(status, effectiveLimit, copied, copySignupLink, t)}

      <div className="invite-form-actions">
        <button
          type="submit"
          className="invite-form-submit"
          disabled={isPending}
        >
          <span>{isPending ? t("lookup.sending") : t("lookup.send")}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function mapInviteError(code: string | undefined): FormStatus {
  switch (code) {
    case "invalid_email":
      return { kind: "format-error" };
    case "self_invite":
      return { kind: "self" };
    case "limit_reached":
      return { kind: "limit-reached" };
    case "pending_invite_exists":
      return { kind: "request-sent" };
    case "request_received":
      return { kind: "request-received" };
    case "already_connected":
      return { kind: "already-connected" };
    case "not_member":
      return { kind: "not-member" };
    case "missing_inviter_first_name":
      return { kind: "missing-inviter-name" };
    case "invalid_note_length":
      return { kind: "invalid-note-length" };
    default:
      return { kind: "generic-error" };
  }
}

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function renderStatus(
  status: FormStatus,
  limit: number,
  copied: boolean,
  onCopy: () => void,
  t: Translator,
) {
  if (status.kind === "idle") return null;

  if (status.kind === "sent") {
    return (
      <p className="invite-form-success" role="status">
        {t("lookup.sent")}
      </p>
    );
  }

  if (status.kind === "not-member") {
    return (
      <div className="invite-form-feedback" role="alert">
        <p className="invite-form-error">{t("lookup.notMemberLine")}</p>
        <button
          type="button"
          className="invite-form-copylink"
          onClick={onCopy}
        >
          <span>{copied ? t("lookup.copied") : t("lookup.copyHint")}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  if (status.kind === "request-received") {
    return (
      <div className="invite-form-feedback" role="alert">
        <p className="invite-form-error">{t("lookup.requestReceivedLine")}</p>
        <RowLink href="/connections#incoming-requests">
          {t("lookup.inboxLabel")}
        </RowLink>
      </div>
    );
  }

  if (status.kind === "limit-reached") {
    return (
      <div className="invite-form-feedback" role="alert">
        <p className="invite-form-error">
          {t("lookup.limitReached", { limit })}
        </p>
        <Link href="/subscribe/confirm" className="invite-form-copylink">
          <span>{t("form.addMoreSub")}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  if (status.kind === "missing-inviter-name") {
    return (
      <div className="invite-form-feedback" role="alert">
        <p className="invite-form-error">{t("form.missingNameLine")}</p>
        <RowLink href="/settings#account">{t("form.addYourName")}</RowLink>
      </div>
    );
  }

  if (status.kind === "invalid-note-length") {
    return (
      <p className="invite-form-error" role="alert">
        {t("form.noteLengthError", { max: NOTE_MAX_LENGTH })}
      </p>
    );
  }

  const message =
    status.kind === "format-error"
      ? t("lookup.invalidEmail")
      : status.kind === "self"
        ? t("lookup.self")
        : status.kind === "request-sent"
          ? t("lookup.requestSent")
          : status.kind === "already-connected"
            ? t("lookup.alreadyConnected")
            : status.kind === "rate-limited"
              ? t("lookup.rateLimited")
              : t("lookup.generic");

  return (
    <p className="invite-form-error" role="alert">
      {message}
    </p>
  );
}

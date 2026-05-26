"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DisconnectConfirm from "@/components/room/DisconnectConfirm";
import {
  daysUntil,
  formatShortDate,
  roleLabel,
} from "@/lib/connections";
import { incomingRequestsCopy } from "@/lib/copy";

// ConnectionList — renders incoming requests, active connections, and
// outgoing pending invites. Client component because every row action
// (accept, decline, resend, cancel) fires fetch() and refreshes the
// route on success.

export type ActiveConnectionDisplay = {
  id: string;
  firstName: string | null;
  email: string;
  role: string;
  acceptedAt: string | null;
};

export type PendingConnectionDisplay = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
};

export type IncomingConnectionDisplay = {
  id: string;
  inviterEmail: string;
  inviterFirstName: string | null;
  role: string;
  createdAt: string;
  expiresAt: string;
};

type Props = {
  active: ActiveConnectionDisplay[];
  pending: PendingConnectionDisplay[];
  incoming: IncomingConnectionDisplay[];
};

export default function ConnectionList({ active, pending, incoming }: Props) {
  const empty =
    active.length === 0 && pending.length === 0 && incoming.length === 0;

  return (
    <div className="connection-list">
      {empty ? (
        <p className="settings-stub">
          no connections yet. the invite affordance is below.
        </p>
      ) : null}

      {incoming.length > 0 ? (
        <section
          className="connection-list-group"
          id="incoming-requests"
        >
          <p className="connection-list-eyebrow">
            {incomingRequestsCopy.eyebrow}
          </p>
          <ul className="connection-list-rows">
            {incoming.map((row) => (
              <IncomingRow key={row.id} row={row} />
            ))}
          </ul>
        </section>
      ) : null}

      {active.length > 0 ? (
        <section className="connection-list-group">
          <p className="connection-list-eyebrow">ACTIVE</p>
          <ul className="connection-list-rows">
            {active.map((c) => (
              <li key={c.id} className="connection-row">
                <span className="connection-row-name">
                  {(c.firstName ?? localOf(c.email)).toLowerCase()}
                </span>
                <span className="connection-row-meta">
                  {roleLabel(c.role)}
                </span>
                <span className="connection-row-meta">
                  since{" "}
                  {c.acceptedAt ? formatShortDate(c.acceptedAt) : "—"}
                </span>
                <span className="connection-row-action">
                  <DisconnectConfirm
                    connectionId={c.id}
                    expectedName={c.firstName ?? localOf(c.email)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending.length > 0 ? (
        <section className="connection-list-group">
          <p className="connection-list-eyebrow">PENDING</p>
          <ul className="connection-list-rows">
            {pending.map((p) => (
              <PendingRow key={p.id} row={p} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PendingRow({ row }: { row: PendingConnectionDisplay }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const expires = daysUntil(row.expiresAt);

  function act(action: "resend" | "cancel") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/connections?action=${action}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ connection_id: row.id }),
        });
        if (res.ok) router.refresh();
      } catch {
        // swallowed — the connection row stays in pending state on failure.
      }
    });
  }

  return (
    <li className="connection-row connection-row-pending">
      <span className="connection-row-email">{row.email.toLowerCase()}</span>
      <span className="connection-row-meta">{roleLabel(row.role)}</span>
      <span className="connection-row-meta">
        invited {formatShortDate(row.createdAt)}
      </span>
      <span className="connection-row-meta">
        expires in {expires} {expires === 1 ? "day" : "days"}
      </span>
      <span className="connection-row-action connection-row-action-double">
        <button
          type="button"
          className="auth-rowlink auth-rowlink-button"
          onClick={() => act("resend")}
          disabled={isPending}
        >
          <span>resend</span>
          <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="auth-rowlink auth-rowlink-button"
          onClick={() => act("cancel")}
          disabled={isPending}
        >
          <span>cancel</span>
          <span aria-hidden="true">→</span>
        </button>
      </span>
    </li>
  );
}

type IncomingError =
  | { kind: "limit" }
  | { kind: "expired" }
  | { kind: "ended" }
  | { kind: "generic" };

function IncomingRow({ row }: { row: IncomingConnectionDisplay }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<IncomingError | null>(null);
  const expires = daysUntil(row.expiresAt);
  const name = (row.inviterFirstName ?? localOf(row.inviterEmail))
    .toLowerCase();

  function act(action: "accept-incoming" | "decline-incoming") {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/connections?action=${action}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ connection_id: row.id }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          const code = data?.error ?? "";
          if (code === "limit_reached") setError({ kind: "limit" });
          else if (code === "invite_expired") setError({ kind: "expired" });
          else if (code.startsWith("invite_")) setError({ kind: "ended" });
          else setError({ kind: "generic" });
          return;
        }
        router.refresh();
      } catch {
        setError({ kind: "generic" });
      }
    });
  }

  return (
    <li className="connection-row">
      <span className="connection-row-name">{name}</span>
      <span className="connection-row-meta">{roleLabel(row.role)}</span>
      <span className="connection-row-meta">
        received {formatShortDate(row.createdAt)}
      </span>
      <span className="connection-row-meta">
        expires in {expires} {expires === 1 ? "day" : "days"}
      </span>
      <span className="connection-row-action connection-row-action-double">
        {error?.kind === "limit" ? (
          <Link
            href="/subscribe/confirm"
            className="auth-rowlink"
          >
            <span>{incomingRequestsCopy.upsell}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <>
            <button
              type="button"
              className="auth-rowlink auth-rowlink-button"
              onClick={() => act("accept-incoming")}
              disabled={isPending}
            >
              <span>{incomingRequestsCopy.accept}</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="auth-rowlink auth-rowlink-button"
              onClick={() => act("decline-incoming")}
              disabled={isPending}
            >
              <span>{incomingRequestsCopy.decline}</span>
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </span>
      {error && error.kind !== "limit" ? (
        <span className="connection-row-meta connection-row-error">
          {errorText(error.kind)}
        </span>
      ) : null}
    </li>
  );
}

function errorText(kind: "expired" | "ended" | "generic"): string {
  if (kind === "expired") return incomingRequestsCopy.inviteExpired;
  if (kind === "ended") return incomingRequestsCopy.inviteEnded;
  return incomingRequestsCopy.generic;
}

function localOf(email: string): string {
  return email.split("@")[0] ?? email;
}

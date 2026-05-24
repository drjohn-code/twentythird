"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import DisconnectConfirm from "@/components/room/DisconnectConfirm";
import {
  daysUntil,
  formatShortDate,
  roleLabel,
} from "@/lib/connections";

// ConnectionList — renders active connections and pending invites.
// Client component because the resend / cancel actions need to fire
// fetch() and refresh the route on success.

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

type Props = {
  active: ActiveConnectionDisplay[];
  pending: PendingConnectionDisplay[];
};

export default function ConnectionList({ active, pending }: Props) {
  return (
    <div className="connection-list">
      {active.length === 0 && pending.length === 0 ? (
        <p className="settings-stub">
          no connections yet. the invite affordance is below.
        </p>
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

function localOf(email: string): string {
  return email.split("@")[0] ?? email;
}

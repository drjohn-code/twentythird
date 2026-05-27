"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CaseDetailSections from "./CaseDetailSections";

// Lazy generator + renderer for the case-file detail view.
//
// The server page either has the two cached fields and renders
// <CaseDetailSections /> directly, or — when nothing is cached yet —
// hands the entry to this client component. It POSTs to
// /api/case-file/detail on mount; the route generates, caches, and
// returns the pair. We render loading, error, and ready states.

type Props = {
  entryId: string;
  entryKind: "catchup" | "session";
};

type Detail = { summary: string; recommendation: string };
type State =
  | { phase: "loading" }
  | { phase: "ready"; detail: Detail }
  | { phase: "error"; message: string };

export default function CaseDetailGenerator({ entryId, entryKind }: Props) {
  const [state, setState] = useState<State>({ phase: "loading" });
  // Guard against double-fire from React strict mode in dev.
  const inflight = useRef(false);

  const run = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/case-file/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId, entry_kind: entryKind }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `request failed (${res.status})`);
      }
      const detail = (await res.json()) as Detail;
      if (!detail.summary || !detail.recommendation) {
        throw new Error("empty response");
      }
      setState({ phase: "ready", detail });
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "could not generate the detail view";
      setState({ phase: "error", message });
    } finally {
      inflight.current = false;
    }
  }, [entryId, entryKind]);

  useEffect(() => {
    void run();
  }, [run]);

  if (state.phase === "loading") {
    return (
      <p className="case-file-entry-line" aria-live="polite">
        preparing the read…
      </p>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="case-file-entry-error" role="alert">
        <p className="case-file-entry-line">
          the read could not be assembled just now.
        </p>
        <button
          type="button"
          onClick={() => void run()}
          className="auth-rowlink"
        >
          <span>try again</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return <CaseDetailSections detail={state.detail} />;
}

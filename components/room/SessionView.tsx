"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { sayItAffordance } from "@/lib/copy";

// ────────────────────────────────────────────────────────────────────
// SessionView — the consulting room.
//
// Single column, max-width 680. Held question and topic chips sit
// above. Transcript renders user turns sans, analyst turns serif.
// Input grows as you type; enter submits. The hairline timer at top
// fills against a 2h soft cap. Closing triggers the ritual server-side
// and routes back to /room.
// ────────────────────────────────────────────────────────────────────

const TOPICS = [
  "Dreaming future",
  "Night dream",
  "Relations in my life",
  "Professional growth",
] as const;

type Turn = {
  role: "user" | "analyst" | "system";
  text: string;
  at: string;
};

type SessionRow = {
  id: string;
  topic: string | null;
  held_question: string;
  transcript: Turn[];
  closed_at: string | null;
  duration_seconds: number;
  created_at: string;
};

type Props = {
  /** The currently open session row, if one was resumed from the server. */
  initialSession: SessionRow | null;
  /** Held-question line — pre-derived server-side. */
  heldQuestion: string;
  /** Soft duration cap in seconds (the timer fill normalizes to this). */
  softMaxSeconds: number;
};

export default function SessionView({
  initialSession,
  heldQuestion,
  softMaxSeconds,
}: Props) {
  const router = useRouter();
  const t = useTranslations("consulting");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const inputId = useId();

  const [session, setSession] = useState<SessionRow | null>(initialSession);
  const [topic, setTopic] = useState<string | null>(
    initialSession?.topic ?? null,
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    initialSession?.duration_seconds ?? 0,
  );

  const transcript: Turn[] = session?.transcript ?? [];

  // Live timer — derives from session.created_at when the session is
  // open, otherwise sits at the recorded duration.
  useEffect(() => {
    if (!session || session.closed_at) return;
    const tick = () => {
      const seconds = Math.floor(
        (Date.now() - new Date(session.created_at).getTime()) / 1000,
      );
      setElapsedSeconds(Math.min(seconds, softMaxSeconds));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session, softMaxSeconds]);

  // Keep the textarea height matching the content while typing.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, [draft]);

  // Scroll new turns into view.
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript.length]);

  // ──────────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────────

  const ensureSession = useCallback(
    async (selectedTopic: string | null): Promise<SessionRow | null> => {
      if (session) return session;
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "start",
          topic: selectedTopic,
          held_question: heldQuestion,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "could not open a session");
      }
      const data = (await res.json()) as { session: SessionRow };
      setSession(data.session);
      setTopic(data.session.topic ?? selectedTopic);
      return data.session;
    },
    [session, heldQuestion],
  );

  async function onPickTopic(t: string) {
    if (busy || closing) return;
    setError(null);
    setBusy(true);
    try {
      const opened = await ensureSession(t);
      if (opened) {
        // Persist the topic on the existing row if it differed.
        if (opened.topic !== t) setTopic(t);
        inputRef.current?.focus();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    const text = draft.trim();
    if (!text || busy || closing) return;
    setError(null);
    setBusy(true);
    try {
      const opened = await ensureSession(topic);
      if (!opened) return;

      // Optimistically append the user turn + an empty analyst turn
      // that grows as deltas arrive.
      const userAt = new Date().toISOString();
      const userTurn: Turn = { role: "user", text, at: userAt };
      const analystAt = new Date(Date.now() + 1).toISOString();
      const analystSeed: Turn = {
        role: "analyst",
        text: "",
        at: analystAt,
      };
      setSession((s) =>
        s
          ? {
              ...s,
              transcript: [
                ...(s.transcript ?? []),
                userTurn,
                analystSeed,
              ],
            }
          : s,
      );
      setDraft("");

      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "turn",
          session_id: opened.id,
          text,
        }),
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "could not record the turn");
      }

      await consumeSSE(res.body, {
        onDelta: (piece) => {
          setSession((s) => {
            if (!s) return s;
            const transcript = [...(s.transcript ?? [])];
            const last = transcript[transcript.length - 1];
            if (!last || last.role !== "analyst") return s;
            transcript[transcript.length - 1] = {
              ...last,
              text: last.text + piece,
            };
            return { ...s, transcript };
          });
        },
        onDone: (finalAnalyst, duration) => {
          setSession((s) => {
            if (!s) return s;
            const transcript = [...(s.transcript ?? [])];
            const last = transcript[transcript.length - 1];
            if (last && last.role === "analyst") {
              transcript[transcript.length - 1] = finalAnalyst;
            }
            return {
              ...s,
              transcript,
              duration_seconds:
                typeof duration === "number" ? duration : s.duration_seconds,
            };
          });
        },
        onError: (msg) => setError(msg),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onClose() {
    if (!session || closing) return;
    setError(null);
    setClosing(true);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "close",
          session_id: session.id,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "could not close the session");
      }
      const data = (await res.json()) as {
        closed_at: string;
        closing: Turn;
        ritual: Turn;
        duration_seconds: number;
      };
      setSession((s) =>
        s
          ? {
              ...s,
              transcript: [
                ...(s.transcript ?? []),
                data.closing,
                data.ritual,
              ],
              closed_at: data.closed_at,
              duration_seconds: data.duration_seconds,
            }
          : s,
      );
      // Refresh the shell so the Today line + case file reflect the close.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
      setClosing(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits; shift+enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────

  const isClosed = !!session?.closed_at;
  const timerWidth = useMemo(() => {
    const ratio = Math.max(0, Math.min(1, elapsedSeconds / softMaxSeconds));
    return `${(ratio * 100).toFixed(2)}%`;
  }, [elapsedSeconds, softMaxSeconds]);

  return (
    <div className="session-room">
      {/* Top row — timer strip and close link */}
      <div className="session-topbar">
        <div
          className="session-timer"
          aria-label={t("timerAria")}
          aria-hidden={!session || undefined}
        >
          <span
            className="session-timer-fill"
            style={{ width: timerWidth }}
          />
        </div>
        {session && !isClosed ? (
          <button
            type="button"
            className="session-close-link"
            onClick={() => void onClose()}
            disabled={closing}
          >
            <span>{closing ? t("closing") : t("closeSessionLabel")}</span>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </div>

      {/* Held question — the analyst's opening line for this sitting */}
      <p className="session-held">{heldQuestion}</p>

      {/* Topic rows — selectable hairline-bordered options */}
      {!session ? (
        <ul className="session-topics" aria-label={t("chooseTopicAria")}>
          {TOPICS.map((t) => (
            <li key={t}>
              <button
                type="button"
                className={[
                  "session-topic-row",
                  topic === t ? "is-selected" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => void onPickTopic(t)}
                disabled={busy}
                aria-pressed={topic === t}
              >
                <span>{t}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {session ? (
        <div className="session-meta" aria-hidden="true">
          {topic ? (
            <span className="session-meta-topic">{topic.toLowerCase()}</span>
          ) : (
            <span className="session-meta-topic">{t("noTopic")}</span>
          )}
          <span className="session-meta-dot">·</span>
          <span className="session-meta-time">{formatElapsed(elapsedSeconds, t)}</span>
        </div>
      ) : null}

      {/* Transcript */}
      {transcript.length > 0 ? (
        <div
          className="session-transcript"
          ref={transcriptRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {transcript.map((turn, i) => (
            <TurnLine key={`${turn.at}-${i}`} turn={turn} />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="session-error" role="alert">
          {error}
        </p>
      ) : null}

      {/* Input — only visible while the session is open */}
      {!isClosed ? (
        <div className="session-input-row">
          <label
            htmlFor={inputId}
            className="vh-legend"
            style={{ position: "absolute", left: -9999 }}
          >
            {t("speakToAnalyst")}
          </label>
          <textarea
            id={inputId}
            ref={inputRef}
            className="session-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={busy || closing}
            autoFocus
          />
          <button
            type="button"
            className="session-say"
            onClick={() => void onSubmit()}
            disabled={!draft.trim() || busy || closing}
            aria-label={t("send")}
          >
            {sayItAffordance}
          </button>
        </div>
      ) : (
        <p className="session-closed-foot">
          {t("sessionClosedFoot")}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Turn line — single voice block. No bubbles. No avatars. No timestamps.
// ────────────────────────────────────────────────────────────────────

function TurnLine({ turn }: { turn: Turn }) {
  if (turn.role === "system") {
    return (
      <p className="session-turn session-turn-system">{turn.text}</p>
    );
  }
  if (turn.role === "analyst") {
    return (
      <p className="session-turn session-turn-analyst">{turn.text}</p>
    );
  }
  return <p className="session-turn session-turn-user">{turn.text}</p>;
}

// ────────────────────────────────────────────────────────────────────
// Formatting helpers
// ────────────────────────────────────────────────────────────────────

function formatElapsed(
  totalSeconds: number,
  t: (key: string, values?: Record<string, string>) => string,
): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  if (minutes < 1) return t("justOpened");
  if (minutes === 1) return t("minutesIn", { count: "01" });
  return t("minutesIn", { count: String(minutes).padStart(2, "0") });
}

// ────────────────────────────────────────────────────────────────────
// SSE consumer — parses event/data pairs and dispatches.
// ────────────────────────────────────────────────────────────────────

type SSEHandlers = {
  onDelta: (text: string) => void;
  onDone: (analyst: Turn, durationSeconds?: number) => void;
  onError: (message: string) => void;
};

async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  handlers: SSEHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let currentEvent = "delta";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let boundary = buf.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buf.slice(0, boundary);
      buf = buf.slice(boundary + 2);
      boundary = buf.indexOf("\n\n");
      const lines = chunk.split("\n");
      currentEvent = "delta";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) currentEvent = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;
      try {
        const payload = JSON.parse(dataLine) as Record<string, unknown>;
        if (currentEvent === "delta" && typeof payload.text === "string") {
          handlers.onDelta(payload.text);
        } else if (currentEvent === "done") {
          const analyst = payload.analyst as Turn | undefined;
          const duration = payload.duration_seconds as number | undefined;
          if (analyst) handlers.onDone(analyst, duration);
        } else if (currentEvent === "error") {
          const message =
            typeof payload.message === "string"
              ? payload.message
              : "something went wrong";
          handlers.onError(message);
        }
      } catch {
        // ignore malformed event
      }
    }
  }
}

"use client";

type SaveIndicatorProps = {
  state: "idle" | "saving" | "saved" | "error";
  savedAt: Date | null;
};

function fmtTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Tiny mono indicator: "saving…" ↔ "saved · 14:22". */
export default function SaveIndicator({ state, savedAt }: SaveIndicatorProps) {
  let label: React.ReactNode = null;
  let mode = "is-idle";
  if (state === "saving") {
    label = <em className="serif-i">saving…</em>;
    mode = "is-saving";
  } else if (state === "saved" && savedAt) {
    label = (
      <span className="mono">
        saved <span className="save-dot">·</span> {fmtTime(savedAt)}
      </span>
    );
    mode = "is-saved";
  } else if (state === "error") {
    label = <em className="serif-i">save failed</em>;
    mode = "is-error";
  }
  return (
    <div
      className={["save-indicator", mode].join(" ")}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

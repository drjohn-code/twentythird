"use client";

import { useEffect, useRef, useState } from "react";

type BlockCardProps = {
  /** 1..6 catalogue index (rendered as "Reading 0N"). */
  index: number;
  /** Italic subtitle — e.g. "father‑imago". Lowercase, no trailing punctuation. */
  subtitle: string;
  /** Serif italic reading — the clinical observation. Max 18 words. */
  reading: string;
  /** Serif takeaway — what to be aware of. Max 14 words. */
  takeaway: string;
  /** Plain serif definition shown in the "what this is" expansion. 2–4 sentences. */
  definition: string;
  /** Weight in [0, 1] — rendered as ".72" mono in the metadata row. */
  weight: number;
  /** Free-form line, e.g. "refined after catchup · week 04". */
  refinedLabel: string;
};

function fmtWeight(w: number): string {
  const clamped = Math.max(0, Math.min(1, w));
  return clamped.toFixed(2).replace(/^0/, "");
}

export default function BlockCard({
  index,
  subtitle,
  reading,
  takeaway,
  definition,
  weight,
  refinedLabel,
}: BlockCardProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const num = `Reading ${String(index).padStart(2, "0")}`;

  return (
    <div
      ref={ref}
      className={`block-card glass${open ? " is-open" : ""}`}
    >
      <div className="block-card-head">
        <span className="block-card-num">{num}</span>
        <span className="block-card-subtitle">{subtitle}</span>
      </div>

      <p className="block-card-reading">{reading}</p>

      <hr className="hairline" aria-hidden="true" />

      <p className="block-card-takeaway">{takeaway}</p>

      <div className="block-card-meta">
        <span>weight · {fmtWeight(weight)}</span>
        <span>{refinedLabel}</span>
      </div>

      <button
        type="button"
        className="block-card-trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{open ? "close" : "what this is"}</span>
        <span aria-hidden="true">→</span>
      </button>

      <div
        className="block-card-defn"
        aria-hidden={!open}
      >
        <div className="block-card-defn-inner">{definition}</div>
      </div>
    </div>
  );
}

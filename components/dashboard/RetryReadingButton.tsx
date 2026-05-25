"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RetryReadingButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/intake/retry", { method: "POST" });
      if (!res.ok) {
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="cta"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
    >
      <span>{pending ? "Resuming" : "Resume the reading"}</span>
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

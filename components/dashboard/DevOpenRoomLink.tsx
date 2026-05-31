"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// TEMP: dev-only shortcut to open the Room without waiting for the
// 2-hour cron. Remove before launch (along with /api/dev/open-room
// and the corresponding paragraph in ROOM.md's "Known gaps").

export default function DevOpenRoomLink() {
  const router = useRouter();
  const t = useTranslations("room");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    setError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/dev/open-room", {
          method: "POST",
          credentials: "include",
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.ok) {
          console.error("[dev/open-room] failed:", { status: res.status, body });
          setError(true);
          return;
        }
        router.push("/room");
        router.refresh();
      } catch (err) {
        console.error("[dev/open-room] threw:", err);
        setError(true);
      }
    });
  }

  return (
    <div className="dev-open-room-wrap">
      <button
        type="button"
        className="auth-rowlink dev-open-room-link"
        onClick={onClick}
        disabled={pending}
        aria-busy={pending || undefined}
      >
        <span className="dev-open-room-prefix mono">{t("pending.devPrefix")} ·</span>
        <span>{pending ? t("pending.devOpening") : t("pending.devOpen")}</span>
        <span aria-hidden="true">→</span>
      </button>
      {error ? (
        <p className="dev-open-room-error serif-i">{t("pending.devError")}</p>
      ) : null}
    </div>
  );
}

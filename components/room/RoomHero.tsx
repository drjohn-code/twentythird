"use client";

import { useEffect, useRef } from "react";
import { depthLines, type DepthBand } from "@/lib/copy";
import { depthBand } from "@/lib/depth";

type RoomHeroProps = {
  firstName: string | null;
  depth: number;
};

export default function RoomHero({ firstName, depth }: RoomHeroProps) {
  const ref = useRef<HTMLElement | null>(null);

  // Trigger the entrance on mount. Above-the-fold, so we don't gate
  // on IntersectionObserver — we add `.in` on the next frame so the
  // initial paint has the pre-state and the transitions actually run.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.classList.add("in");
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const band: DepthBand = depthBand(depth);
  const name = firstName ? firstName.toLowerCase() : null;

  return (
    <section ref={ref} className="room-hero reveal" aria-label="Room landing">
      <div className="room-hero-text">
        <h1 className="room-hero-greet">
          <span>here again</span>
          {name ? (
            <>
              <span aria-hidden="true">,&nbsp;</span>
              <span className="it">{name}.</span>
            </>
          ) : (
            <span aria-hidden="true">.</span>
          )}
        </h1>
        <p className="room-hero-line">{depthLines[band]}</p>
      </div>
      <div className="room-hero-dial-wrap">
        <DepthDial depth={depth} band={band} />
      </div>
    </section>
  );
}

function DepthDial({ depth, band }: { depth: number; band: DepthBand }) {
  const size = 140;
  const stroke = 1.4;
  const seedR = 1.7;
  // Pull the arc in by a hair so the seed dot sits cleanly on it.
  const r = (size - stroke) / 2 - seedR;
  const c = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(1, depth));
  const offset = c * (1 - safe);

  const ringStyle = {
    ["--arc-c" as string]: `${c}`,
    ["--arc-offset" as string]: `${offset}`,
  } as React.CSSProperties;

  return (
    <div
      className="room-hero-dial"
      data-band={band}
      role="meter"
      aria-label="Reading depth"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={depth}
      aria-valuetext={depthLines[band]}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={ringStyle}
      >
        <circle
          className="room-hero-dial-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
        />
        <circle
          className="room-hero-dial-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
        />
        <circle
          className="room-hero-dial-seed"
          cx={size / 2}
          cy={size / 2 - r}
          r={seedR}
        />
      </svg>
      <span className="room-hero-dial-word" aria-hidden="true">
        {band}
      </span>
    </div>
  );
}

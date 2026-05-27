import type { ReactNode } from "react";
import Link from "next/link";

type WeakDataOverlayProps = {
  /** The diagram to render behind the blur. */
  children: ReactNode;
  /** Reserved for future copy variants. */
  reason?: "intake" | "depth";
};

/**
 * Wraps a placeholder diagram in a heavy blur with a centred
 * "weak data for analytics" notice. The diagram below is the same
 * component the user would have seen with adequate intake, seeded
 * with deterministic placeholder data. The blur is the contract —
 * the user must never mistake the underlay for an inference.
 */
export default function WeakDataOverlay({ children }: WeakDataOverlayProps) {
  return (
    <div className="weak-data-overlay">
      <div className="weak-data-blur" aria-hidden="true">
        {children}
      </div>
      <div className="weak-data-copy">
        <div className="weak-data-label">weak data for analytics</div>
        <Link href="/settings#depth" className="weak-data-link">
          <span>strengthen the reading</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

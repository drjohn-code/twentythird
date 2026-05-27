type ThresholdGraphProps = {
  /** 0..1, Y axis. High anxiety = top. */
  anxiety: number;
  /** 0..1, X axis. High avoidance = right. */
  avoidance: number;
  size: "card" | "section";
};

const VIEW = 220;
const PAD = 20;
const PLOT = VIEW - PAD * 2;

/**
 * Attachment-style 2D plot (Bartholomew & Horowitz, 1991;
 * Brennan, Clark & Shaver, 1998). Anxiety on Y, avoidance on X.
 *
 * Always label all four quadrants — the framework is what makes
 * the dot meaningful — but the entire figure is blurred above by
 * WeakDataOverlay when the underlying intake answers are absent.
 */
export default function ThresholdGraph({
  anxiety,
  avoidance,
  size,
}: ThresholdGraphProps) {
  const x = PAD + Math.max(0, Math.min(1, avoidance)) * PLOT;
  const y = PAD + (1 - Math.max(0, Math.min(1, anxiety))) * PLOT;
  return (
    <div className={`threshold-graph threshold-graph-${size}`}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="threshold-graph-svg"
      >
        <title>Intimacy threshold — figure</title>
        <desc>
          Attachment-style plot — anxiety on the vertical axis,
          avoidance on the horizontal. Quadrants labelled secure,
          preoccupied, dismissing, fearful.
        </desc>

        {/* Frame */}
        <rect
          x={PAD}
          y={PAD}
          width={PLOT}
          height={PLOT}
          className="threshold-graph-frame"
        />
        {/* Midlines */}
        <line
          x1={PAD + PLOT / 2}
          y1={PAD}
          x2={PAD + PLOT / 2}
          y2={PAD + PLOT}
          className="threshold-graph-mid"
        />
        <line
          x1={PAD}
          y1={PAD + PLOT / 2}
          x2={PAD + PLOT}
          y2={PAD + PLOT / 2}
          className="threshold-graph-mid"
        />

        {/* Quadrant labels */}
        <text
          x={PAD + PLOT * 0.25}
          y={PAD + PLOT * 0.25}
          textAnchor="middle"
          dy="0.32em"
          className="threshold-graph-quad"
        >
          PREOCCUPIED
        </text>
        <text
          x={PAD + PLOT * 0.75}
          y={PAD + PLOT * 0.25}
          textAnchor="middle"
          dy="0.32em"
          className="threshold-graph-quad"
        >
          FEARFUL
        </text>
        <text
          x={PAD + PLOT * 0.25}
          y={PAD + PLOT * 0.75}
          textAnchor="middle"
          dy="0.32em"
          className="threshold-graph-quad"
        >
          SECURE
        </text>
        <text
          x={PAD + PLOT * 0.75}
          y={PAD + PLOT * 0.75}
          textAnchor="middle"
          dy="0.32em"
          className="threshold-graph-quad"
        >
          DISMISSING
        </text>

        {/* User dot */}
        <circle
          cx={x}
          cy={y}
          r={4}
          className="threshold-graph-dot"
        />
      </svg>
      <div className="threshold-graph-axes">
        <span className="threshold-graph-axis-y">ANXIETY →</span>
        <span className="threshold-graph-axis-x">AVOIDANCE →</span>
      </div>
    </div>
  );
}

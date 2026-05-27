type LoopCycleProps = {
  nodes: string[];
  size: "card" | "section";
};

const VIEW = 220;
const CENTER = VIEW / 2;
const RING_RADIUS = 78;
const NODE_LABEL_RADIUS = 96;
const ARROW_RADIUS = 88;

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

/**
 * 3–5 nodes placed on a circle with arrow glyphs between them. The
 * last arrow returns to the first — a true closed cycle, the point
 * of the figure.
 */
export default function LoopCycle({ nodes, size }: LoopCycleProps) {
  const n = nodes.length;
  if (n < 2) return null;
  const step = 360 / n;

  return (
    <div className={`loop-cycle loop-cycle-${size}`}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="loop-cycle-svg">
        <title>Subconscious loop — figure</title>
        <desc>
          {nodes.join(" → ")} {nodes.length > 0 ? `→ ${nodes[0]}` : ""}
        </desc>

        {/* Hairline circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          className="loop-cycle-ring"
        />

        {/* Node dots */}
        {nodes.map((_, i) => {
          const angle = i * step;
          const p = polar(angle, RING_RADIUS);
          return (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r={3.2}
              className="loop-cycle-dot"
            />
          );
        })}

        {/* Arrow glyphs between nodes — placed at midpoint of each arc */}
        {nodes.map((_, i) => {
          const midAngle = i * step + step / 2;
          const p = polar(midAngle, ARROW_RADIUS);
          return (
            <text
              key={`arrow-${i}`}
              x={p.x}
              y={p.y}
              className="loop-cycle-arrow"
              transform={`rotate(${midAngle + 90} ${p.x} ${p.y})`}
              textAnchor="middle"
              dy="0.32em"
            >
              →
            </text>
          );
        })}

        {/* Node labels — placed outside the ring */}
        {nodes.map((label, i) => {
          const angle = i * step;
          const p = polar(angle, NODE_LABEL_RADIUS);
          const anchor = textAnchorFor(angle);
          return (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={p.y}
              className="loop-cycle-label"
              textAnchor={anchor.textAnchor}
              dy={anchor.dy}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function textAnchorFor(angleDeg: number): {
  textAnchor: "start" | "middle" | "end";
  dy: string;
} {
  // Angle is measured from top (0°) clockwise. Normalize to 0..360.
  const a = ((angleDeg % 360) + 360) % 360;
  if (a < 15 || a > 345) return { textAnchor: "middle", dy: "-0.4em" };
  if (a < 165) return { textAnchor: "start", dy: "0.32em" };
  if (a < 195) return { textAnchor: "middle", dy: "1em" };
  return { textAnchor: "end", dy: "0.32em" };
}

import FigureCard from "@/components/figures/FigureCard";
import WeakDataOverlay from "./WeakDataOverlay";
import {
  STRUCTURE_CODES,
  STRUCTURE_LABEL,
  formatDominantLine,
  type StructureCode,
  type StructureResult,
} from "@/lib/structures";

type StructureMapProps = {
  result: StructureResult;
};

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 76;
const RING_LEVELS = [0.25, 0.5, 0.75, 1.0];

// Angles in degrees, 0° = right, then clockwise.
// obsessional top, hysterical right, phobic bottom, depressive left.
const ANGLE_BY_CODE: Record<StructureCode, number> = {
  obsessional: -90,
  hysterical: 0,
  phobic: 90,
  depressive: 180,
};

function polar(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function axisLabelAnchor(angleDeg: number): {
  textAnchor: "start" | "middle" | "end";
  dy: string;
} {
  // For top/bottom (±90°) center; for left end; for right start.
  if (angleDeg === -90) return { textAnchor: "middle", dy: "-0.4em" };
  if (angleDeg === 90) return { textAnchor: "middle", dy: "1em" };
  if (angleDeg === 0) return { textAnchor: "start", dy: "0.32em" };
  return { textAnchor: "end", dy: "0.32em" };
}

export default function StructureMap({ result }: StructureMapProps) {
  const scoreByCode = new Map<StructureCode, number>(
    result.scores.map((s) => [s.code, s.score]),
  );

  // Build the polygon points string in stable axis order.
  const polyPoints = STRUCTURE_CODES.map((code) => {
    const raw = scoreByCode.get(code) ?? 0;
    const clamped = Math.max(0, Math.min(1, raw));
    const p = polar(ANGLE_BY_CODE[code], RADIUS * clamped);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ");

  const dominantLine = formatDominantLine(result.dominant);

  const diagram = (
    <div className="structure-map" aria-hidden={result.isBlurred}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        className="structure-radar"
      >
        <title>Structure radar — figure</title>
        <desc>
          Four-axis radar showing the user&apos;s position across the
          obsessional, hysterical, phobic, and depressive structures.
        </desc>

        {/* Concentric rings */}
        {RING_LEVELS.map((level) => (
          <circle
            key={level}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * level}
            className="structure-radar-ring"
          />
        ))}

        {/* Axis lines */}
        {STRUCTURE_CODES.map((code) => {
          const end = polar(ANGLE_BY_CODE[code], RADIUS);
          return (
            <line
              key={code}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              className="structure-radar-axis"
            />
          );
        })}

        {/* Data polygon — animates from center on reveal */}
        <polygon
          points={polyPoints}
          className="structure-radar-poly"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />

        {/* Axis dots — placed at the score position along each axis */}
        {STRUCTURE_CODES.map((code) => {
          const raw = scoreByCode.get(code) ?? 0;
          const clamped = Math.max(0, Math.min(1, raw));
          const p = polar(ANGLE_BY_CODE[code], RADIUS * clamped);
          return (
            <circle
              key={`dot-${code}`}
              cx={p.x}
              cy={p.y}
              r={2.4}
              className="structure-radar-dot"
            />
          );
        })}

        {/* Axis labels — mono uppercase */}
        {STRUCTURE_CODES.map((code) => {
          const labelPos = polar(ANGLE_BY_CODE[code], RADIUS + 14);
          const { textAnchor, dy } = axisLabelAnchor(ANGLE_BY_CODE[code]);
          return (
            <text
              key={`lbl-${code}`}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={textAnchor}
              dy={dy}
              className="structure-radar-label"
            >
              {STRUCTURE_LABEL[code].toUpperCase()}
            </text>
          );
        })}
      </svg>

      <div className="structure-map-foot">
        <div className="structure-map-foot-label">DOMINANT STRUCTURE</div>
        <div className="structure-map-foot-value">{dominantLine}</div>
      </div>
    </div>
  );

  const card = (
    <FigureCard label="STRUCTURE" subtitle="dominant figure" fig="Fig. 01">
      {result.isBlurred ? (
        <WeakDataOverlay>{diagram}</WeakDataOverlay>
      ) : (
        diagram
      )}
    </FigureCard>
  );

  return card;
}

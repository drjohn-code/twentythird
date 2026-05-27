type LinguisticMarkersProps = {
  markers: Array<{ label: string; count: number }>;
  size: "card" | "section";
};

/**
 * Horizontal bars showing the top linguistic markers tallied from
 * the user's free-text intake answers. Labels in serif italic on
 * the left, hairline bar in the middle, raw count in mono on the
 * right.
 */
export default function LinguisticMarkers({
  markers,
  size,
}: LinguisticMarkersProps) {
  if (markers.length === 0) return null;
  const max = Math.max(...markers.map((m) => m.count), 1);
  const top = markers.slice(0, 4);

  return (
    <div className={`ling-markers ling-markers-${size}`}>
      <title>Linguistic markers — figure</title>
      <ul className="ling-markers-list">
        {top.map((m, i) => {
          const pct = Math.min(100, Math.round((m.count / max) * 100));
          return (
            <li key={`${m.label}-${i}`} className="ling-markers-row">
              <span className="ling-markers-label">{m.label}</span>
              <span className="ling-markers-meter">
                <i
                  style={
                    {
                      ["--w" as string]: `${pct}%`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span className="ling-markers-count">{m.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

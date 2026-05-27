type DesireBarsProps = {
  /** 0..1 independent intensities — they are not a partition. */
  wantTo: number;
  oughtTo: number;
  forbidden: number;
  size: "card" | "section";
};

const ROWS: Array<{
  key: "wantTo" | "oughtTo" | "forbidden";
  label: string;
}> = [
  { key: "wantTo", label: "want-to" },
  { key: "oughtTo", label: "ought-to" },
  { key: "forbidden", label: "forbidden" },
];

/**
 * Three hairline bars showing the share of language between
 * want-to · ought-to · forbidden in the desire passages of intake.
 * The widths do not sum to 100% — they are independent intensities.
 */
export default function DesireBars({
  wantTo,
  oughtTo,
  forbidden,
  size,
}: DesireBarsProps) {
  const values = { wantTo, oughtTo, forbidden };
  return (
    <div className={`desire-bars desire-bars-${size}`}>
      <title>Desire structure — figure</title>
      <ul className="desire-bars-list">
        {ROWS.map(({ key, label }) => {
          const v = Math.max(0, Math.min(1, values[key]));
          const pct = Math.round(v * 100);
          return (
            <li key={key} className="desire-bars-row">
              <span className="desire-bars-label">{label}</span>
              <span className="desire-bars-meter">
                <i
                  style={
                    {
                      ["--w" as string]: `${pct}%`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span className="desire-bars-pct">
                {`.${String(pct).padStart(2, "0").slice(0, 2)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

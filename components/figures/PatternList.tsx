type PatternRow = {
  year: string;
  outcome: string;
  width: number;
  durationLabel?: string;
};

type PatternListProps = {
  rows: PatternRow[];
  summary?: Array<{ k: string; v: string; italic?: boolean }>;
};

export default function PatternList({ rows, summary }: PatternListProps) {
  return (
    <>
      <ul className="pattern-list pattern-list-fluid">
        {rows.map((row, i) => (
          <li key={i}>
            <span className="year">{row.year}</span>
            <span className="dur">
              <span
                className="bar"
                style={
                  {
                    ["--pl-w" as string]: `${row.width}%`,
                    ["--pl-delay" as string]: `${120 + i * 100}ms`,
                  } as React.CSSProperties
                }
              ></span>
              {row.durationLabel ? (
                <span className="bar-label">{row.durationLabel}</span>
              ) : null}
            </span>
            <span className="out">{row.outcome}</span>
          </li>
        ))}
      </ul>
      {summary?.length ? (
        <div className="pattern-summary">
          {summary.map((s, i) => (
            <div key={i} className="ps-row">
              <span className="k">{s.k}</span>
              <span className={s.italic ? "v it" : "v"}>{s.v}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

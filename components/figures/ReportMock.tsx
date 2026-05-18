type ReportRow = {
  k: string;
  pct: string;
  width: number;
};

type ReportMockProps = {
  caseLabel: string;
  prepared: string;
  rows: ReportRow[];
  footerLabel: string;
  footerValue: string;
};

export default function ReportMock({
  caseLabel,
  prepared,
  rows,
  footerLabel,
  footerValue,
}: ReportMockProps) {
  return (
    <div className="report-mock">
      <div className="rep-head">
        <span>{caseLabel}</span>
        <span>{prepared}</span>
      </div>
      <div className="rep-section">
        {rows.map((row, i) => (
          <div key={i} className="rep-row">
            <span className="k">{row.k}</span>
            <span className="meter">
              <i
                style={
                  { ["--w" as string]: `${row.width}%` } as React.CSSProperties
                }
              ></i>
            </span>
            <span className="pct">{row.pct}</span>
          </div>
        ))}
      </div>
      <div className="rep-foot">
        <div className="rf-label">{footerLabel}</div>
        <div className="rf-val">{footerValue}</div>
      </div>
    </div>
  );
}

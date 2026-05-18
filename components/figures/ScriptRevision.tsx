type RevisionRow = {
  prefix: string;
  old: string;
  next: string;
};

type ScriptRevisionProps = {
  rows: RevisionRow[];
  metaLeft?: { label: string; value: string };
  metaRight?: { label: string; value: string };
};

export default function ScriptRevision({
  rows,
  metaLeft,
  metaRight,
}: ScriptRevisionProps) {
  return (
    <div className="script-revision">
      {rows.map((row, i) => (
        <div key={i} className="sr-line">
          <span className="sr-prefix">{row.prefix}</span>
          <span className="sr-old">{row.old}</span>
          <span className="sr-new">{row.next}</span>
        </div>
      ))}
      {(metaLeft || metaRight) && (
        <div className="sr-meta">
          {metaLeft ? (
            <span>
              {metaLeft.label} <em>{metaLeft.value}</em>
            </span>
          ) : (
            <span />
          )}
          {metaRight ? (
            <span>
              {metaRight.label} <em>{metaRight.value}</em>
            </span>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

type DreamKeyEntry = {
  n: string;
  label: string;
  gloss?: string;
};

type DreamKeyProps = {
  entries: DreamKeyEntry[];
};

export default function DreamKey({ entries }: DreamKeyProps) {
  return (
    <div className="dream-key">
      {entries.map((entry, i) => (
        <div key={i} className="dk-item">
          <span className="dk-num">{entry.n}</span>
          <span className="dk-label">
            {entry.label}
            {entry.gloss ? (
              <>
                <span className="dk-sep"> — </span>
                <span className="dk-gloss">{entry.gloss}</span>
              </>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

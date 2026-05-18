type InboxRow = {
  type: string;
  time: string;
  duration: string;
  unread?: boolean;
};

type PromptCardProps = {
  heading: string;
  date: string;
  eyebrow: string;
  quote: React.ReactNode;
  rows: InboxRow[];
  footerLabel: string;
  footerValue: string;
};

export default function PromptCard({
  heading,
  date,
  eyebrow,
  quote,
  rows,
  footerLabel,
  footerValue,
}: PromptCardProps) {
  return (
    <div className="prompt-card">
      <div className="pc-head">
        <span className="pc-day">{heading}</span>
        <span className="pc-date">{date}</span>
      </div>
      <div className="pc-prompt">
        <span className="pc-eyebrow">{eyebrow}</span>
        <p className="pc-q">{quote}</p>
      </div>
      <div className="pc-stream">
        {rows.map((row, i) => (
          <div key={i} className="pc-stream-row">
            <span className={row.unread ? "dot" : "dot done"}></span>
            <span className="time">{row.time}</span>
            <span className="label">{row.type}</span>
            <span className="dur">{row.duration}</span>
          </div>
        ))}
      </div>
      <div className="pc-streak">
        <span className="streak-label">{footerLabel}</span>
        <span className="streak-val">{footerValue}</span>
      </div>
    </div>
  );
}

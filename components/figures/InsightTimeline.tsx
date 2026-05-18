type Marker = {
  day: number;
  label?: string;
  inflection?: boolean;
};

type InsightTimelineProps = {
  heading: string;
  range: string;
  markers: Marker[];
  summaryBig: string;
  summaryLabel: string;
};

export default function InsightTimeline({
  heading,
  range,
  markers,
  summaryBig,
  summaryLabel,
}: InsightTimelineProps) {
  const max = Math.max(...markers.map((m) => m.day));
  return (
    <div className="day23-arc">
      <div className="tl-row">
        <div className="tl-head">
          <span className="k">{heading}</span>
          <span className="v">{range}</span>
        </div>
        <div className="tl-bar day23-bar">
          <div className="tl-fill day23-fill"></div>
          {markers.map((m) => {
            const left = (m.day / max) * 100;
            return (
              <span
                key={m.day}
                className={`day23-marker${m.inflection ? " inflection" : ""}`}
                style={{ left: `${left}%` }}
              >
                <span className="day23-dot"></span>
                <span className="day23-num">{m.day}</span>
                {m.label ? <span className="day23-label">{m.label}</span> : null}
              </span>
            );
          })}
        </div>
        <div className="tl-axis day23-axis">
          <span>day 1</span>
          <span>day 7</span>
          <span>day 14</span>
          <span>day 23</span>
        </div>
      </div>
      <div className="tl-summary">
        <span className="big">{summaryBig}</span>
        <span className="big-label">{summaryLabel}</span>
      </div>
    </div>
  );
}

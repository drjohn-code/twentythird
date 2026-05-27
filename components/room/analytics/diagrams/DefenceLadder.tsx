type DefenceLadderProps = {
  highlight: "mature" | "neurotic" | "immature" | "psychotic";
  size: "card" | "section";
};

const TIERS: Array<{
  key: "mature" | "neurotic" | "immature" | "psychotic";
  label: string;
}> = [
  { key: "mature", label: "MATURE" },
  { key: "neurotic", label: "NEUROTIC" },
  { key: "immature", label: "IMMATURE" },
  { key: "psychotic", label: "PSYCHOTIC" },
];

/**
 * Vaillant's four-tier defence hierarchy (1971, 1977) rendered as
 * four stacked rungs. The rung the user's professional-block
 * defences cluster on is highlighted — usually NEUROTIC for adults
 * functioning in work contexts. The four-level form only; no
 * intermediates.
 */
export default function DefenceLadder({
  highlight,
  size,
}: DefenceLadderProps) {
  return (
    <div className={`defence-ladder defence-ladder-${size}`}>
      <title>Defence ladder — figure</title>
      <ul className="defence-ladder-list">
        {TIERS.map((tier) => {
          const active = tier.key === highlight;
          return (
            <li
              key={tier.key}
              className={`defence-ladder-rung${
                active ? " is-active" : ""
              }`}
            >
              <span
                className="defence-ladder-cap"
                aria-hidden="true"
              />
              <span className="defence-ladder-line" />
              <span className="defence-ladder-label">{tier.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

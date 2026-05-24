type HairlineProps = {
  /** When true, uses the heavier --hair-strong divider. */
  strong?: boolean;
  className?: string;
};

/** 1px divider, token-mapped. The default surface separator inside Room. */
export default function Hairline({ strong, className }: HairlineProps) {
  const cls = [
    "hairline",
    strong ? "is-strong" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <hr className={cls} aria-hidden="true" />;
}

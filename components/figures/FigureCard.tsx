import type { ReactNode } from "react";

type FigureCardProps = {
  label: string;
  subtitle: string;
  fig: string;
  className?: string;
  children: ReactNode;
};

export default function FigureCard({
  label,
  subtitle,
  fig,
  className,
  children,
}: FigureCardProps) {
  return (
    <div className={["split-visual glass", className].filter(Boolean).join(" ")}>
      <div className="vh">
        <span className="lhs">
          <span>{label}</span> <em>{subtitle}</em>
        </span>
        <span>{fig}</span>
      </div>
      <div className="vb">{children}</div>
    </div>
  );
}

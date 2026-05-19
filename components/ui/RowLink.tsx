import Link from "next/link";
import type { ReactNode } from "react";

type RowLinkProps = {
  children: ReactNode;
  href: string;
  /** Arrow direction. "right" appends →, "left" prepends ←. */
  arrow?: "right" | "left";
  className?: string;
};

/** Bottom-bordered link; arrow shifts +4px on hover. */
export default function RowLink({
  children,
  href,
  arrow = "right",
  className,
}: RowLinkProps) {
  return (
    <Link
      href={href}
      className={["auth-rowlink", className].filter(Boolean).join(" ")}
    >
      {arrow === "left" ? (
        <span aria-hidden="true">←</span>
      ) : null}
      <span>{children}</span>
      {arrow === "right" ? (
        <span aria-hidden="true">→</span>
      ) : null}
    </Link>
  );
}

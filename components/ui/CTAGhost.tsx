import Link from "next/link";
import type { ReactNode } from "react";

type CTAGhostProps = {
  children: ReactNode;
  href: string;
  /** The italic word that prefixes the link — defaults to "or". */
  prefix?: string;
  className?: string;
};

/** Text-only ghost CTA — italic "or" prefix + plain text link. */
export default function CTAGhost({
  children,
  href,
  prefix = "or",
  className,
}: CTAGhostProps) {
  return (
    <span className={["cta-ghost", className].filter(Boolean).join(" ")}>
      <em className="cta-ghost-or">{prefix}</em>{" "}
      <Link href={href} className="cta-ghost-link">
        {children}
      </Link>
    </span>
  );
}

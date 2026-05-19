import Link from "next/link";
import type { ReactNode } from "react";

type CTAProps = {
  children: ReactNode;
  href: string;
  className?: string;
};

/** Glass translucent pill — mid-page primary. Serif italic arrow. */
export default function CTA({ children, href, className }: CTAProps) {
  return (
    <Link
      href={href}
      className={["cta", className].filter(Boolean).join(" ")}
    >
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

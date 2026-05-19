import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "span" | "p";
};

/** Mono-ish 11px tracked uppercase label — the section opener. */
export default function Eyebrow({
  children,
  className,
  as: Tag = "div",
}: EyebrowProps) {
  const Component = Tag;
  return (
    <Component className={["eyebrow", className].filter(Boolean).join(" ")}>
      {children}
    </Component>
  );
}

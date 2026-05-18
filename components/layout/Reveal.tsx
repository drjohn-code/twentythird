import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
};

export default function Reveal({
  children,
  as: Tag = "div",
  className,
}: RevealProps) {
  const Component = Tag as React.ElementType;
  return (
    <Component className={["reveal", className].filter(Boolean).join(" ")}>
      {children}
    </Component>
  );
}

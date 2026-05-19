import type { ElementType, ReactNode } from "react";

type GlassProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

/** The signature surface — translucent + top-highlight, defined in globals.css */
export default function Glass({
  as: Tag = "div",
  className,
  children,
  ...rest
}: GlassProps & React.HTMLAttributes<HTMLElement>) {
  const Component = Tag as ElementType;
  return (
    <Component
      className={["glass", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

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
  const ref = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 },
    );

    const raf = requestAnimationFrame(() => {
      observer.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <Component
      ref={ref}
      className={["reveal", className].filter(Boolean).join(" ")}
    >
      {children}
    </Component>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const sections = [
  { id: "privacy", label: "Privacy Policy", href: "/legal/privacy" },
  { id: "terms", label: "Terms of Service", href: "/legal/terms" },
  { id: "cookies", label: "Cookie Policy", href: "/legal/cookies" },
];

function pathToId(pathname: string): string {
  if (pathname.includes("terms")) return "terms";
  if (pathname.includes("cookies")) return "cookies";
  return "privacy";
}

export default function LegalSidebar() {
  const pathname = usePathname();
  const [observedId, setObservedId] = useState<string | null>(null);

  useEffect(() => {
    setObservedId(null);

    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setObservedId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const active = observedId ?? pathToId(pathname);

  return (
    <aside className="legal-sidebar">
      <div className="legal-sidebar-label">ON THIS PAGE</div>
      <nav>
        {sections.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className={`legal-nav-link${active === s.id ? " active" : ""}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

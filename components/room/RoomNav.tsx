"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/brand/LogoMark";

type RoomNavProps = {
  /** First name for the right-side caption. Falls back to nothing when null. */
  firstName: string | null;
};

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/room", label: "Room" },
  { href: "/readings", label: "Readings" },
  { href: "/catchup", label: "Catchup" },
  { href: "/consulting", label: "Consulting" },
  { href: "/case-file", label: "Case File" },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/room") return pathname === "/room";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function RoomNav({ firstName }: RoomNavProps) {
  const pathname = usePathname();
  const settingsActive = isActive(pathname, "/settings");

  return (
    <nav className="room-nav glass" aria-label="Room">
      <Link href="/room" className="room-nav-brand" aria-label="TwentyThird Room">
        <LogoMark />
      </Link>

      <div className="room-nav-links">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`room-nav-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="room-nav-right">
        {/*
          id="themeToggle" reuses the global handler in SiteInteractions —
          a single toggle implementation lives on the page at a time, and
          the marketing nav is suppressed on /room/* (see MarketingChrome).
        */}
        <button
          className="theme-toggle"
          aria-label="Toggle theme"
          id="themeToggle"
          type="button"
        >
          <svg
            className="moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          </svg>
          <svg
            className="sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </button>
        {firstName ? (
          <Link
            href="/settings"
            className={`room-nav-name${settingsActive ? " is-active" : ""}`}
            aria-current={settingsActive ? "page" : undefined}
          >
            {firstName.toLowerCase()}
          </Link>
        ) : null}
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="room-nav-signout bg-transparent border-0 p-0 cursor-pointer"
          >
            sign out
          </button>
        </form>
      </div>
    </nav>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

// Room and invite routes render their own chrome (RoomNav + RoomFooter,
// or no chrome at all on /invite). The marketing Nav/Footer should not
// appear on top of them. The list mirrors every URL prefix served by
// app/(room)/* plus the public /invite landing.
const HIDE_PREFIXES = [
  "/room",
  "/readings",
  "/catchup",
  "/consulting",
  "/case-file",
  "/settings",
  "/subscribe",
  "/reports",
  "/invite",
];

function isHidden(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function MarketingNav() {
  if (isHidden(usePathname())) return null;
  return <Nav />;
}

export function MarketingFooter() {
  if (isHidden(usePathname())) return null;
  return <Footer />;
}

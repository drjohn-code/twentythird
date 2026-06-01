"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";
import { isPrivatePath } from "@/lib/routes";

// Room, invite, auth, onboarding, and internal routes render their own
// chrome (RoomNav + RoomFooter, a self-contained auth/onboarding shell, or
// no chrome at all on /invite). The marketing Nav/Footer must not appear on
// top of them. lib/routes.ts (PRIVATE_PREFIXES) is the single source of
// truth — shared with app/robots.ts so the private-route list can never
// drift. (Analytics no longer path-gates — see lib/routes.ts.)

export function MarketingNav() {
  if (isPrivatePath(usePathname())) return null;
  return <Nav />;
}

export function MarketingFooter() {
  if (isPrivatePath(usePathname())) return null;
  return <Footer />;
}

import { redirect } from "next/navigation";

// /dashboard is replaced by /room. This file stays as a permanent
// redirect so any stale links (emails, bookmarks, prior auth flows)
// keep working. Intake gating and the PendingStatus screen are
// handled inside the (room) layout, not here.
export default function DashboardRedirect(): never {
  redirect("/room");
}

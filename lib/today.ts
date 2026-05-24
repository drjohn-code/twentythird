// Today line — the single italic serif sentence rendered between the
// Room nav and the page content. Computed server-side per request, no
// cache. This element does more work for premium feel than anything
// else in the build; treat the priority order accordingly.
//
// Priority (highest wins):
//   1. connectionAccepted    — first visit after a connection accepts
//   2. connectionEnded       — first visit after disconnect by either side
//   3. reportReady           — a queued/generating report is now ready
//   4. unfinished            — open (not-closed) consulting session exists
//   5. openDream             — a recent catchup mentioned a dream that
//                              hasn't been worked
//   6. catchupReady          — no catchup this ISO week, week is current
//   7. thinReading           — depth band == 'thin'
//   8. catchupCompleted      — first visit after submitting a catchup
//   9. quiet                 — default
//
// `welcomeBack` is reserved for the first visit after magic-link auth
// (handled at the auth callback, not here).

import type { DepthBand } from "@/lib/copy";
import type { TodayLineRef } from "@/lib/copy";

export type TodayContext = {
  /** First name for personalization in the connection-accepted variant. */
  firstName: string | null;
  /** Current ISO week number (1..53). */
  isoWeek: number;
  /** True if a catchups row exists for the current ISO week. */
  catchupForThisWeek: boolean;
  /** Most-recently accepted connection within the last 7 days, if any. */
  recentlyAcceptedConnection: { firstName: string; acceptedAt: Date } | null;
  /** Most-recently ended connection within the last 7 days, if any. */
  recentlyEndedConnection: { firstName: string; endedAt: Date } | null;
  /** True if a session row with closed_at IS NULL exists. */
  hasOpenSession: boolean;
  /** Day-of-week string if there's a recent open dream (e.g. "tuesday"). */
  openDreamDay: string | null;
  /** True if a reports row with status='ready' was finalized in the last 24h. */
  reportRecentlyReady: boolean;
  /** True if a catchups row was created in the last 36 hours. */
  catchupRecentlySubmitted: boolean;
  /** Current depth band. */
  depthBand: DepthBand;
};

export function computeTodayLine(ctx: TodayContext): TodayLineRef {
  if (ctx.recentlyAcceptedConnection) {
    return {
      key: "connectionAccepted",
      args: [ctx.recentlyAcceptedConnection.firstName],
    };
  }

  if (ctx.recentlyEndedConnection) {
    return {
      key: "connectionEnded",
      args: [ctx.recentlyEndedConnection.firstName],
    };
  }

  if (ctx.reportRecentlyReady) {
    return { key: "reportReady" };
  }

  if (ctx.hasOpenSession) {
    return { key: "unfinished" };
  }

  if (ctx.openDreamDay) {
    return { key: "openDream", args: [ctx.openDreamDay] };
  }

  if (!ctx.catchupForThisWeek) {
    return { key: "catchupReady", args: [ctx.isoWeek] };
  }

  if (ctx.depthBand === "thin") {
    return { key: "thinReading" };
  }

  if (ctx.catchupRecentlySubmitted) {
    return { key: "catchupCompleted" };
  }

  return { key: "quiet" };
}

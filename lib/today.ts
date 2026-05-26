// Today line — the single italic serif sentence rendered between the
// Room nav and the page content. Computed server-side per request, no
// cache. This element does more work for premium feel than anything
// else in the build; treat the priority order accordingly.
//
// Priority (highest wins):
//   1. safetyFollowup          — unacknowledged high/critical flag exists
//   2. initialReadingsGenerating — post-intake reading generation in flight
//   3. connectionAccepted      — first visit after a connection accepts
//   4. connectionEnded         — first visit after disconnect by either side
//   5. reportReady             — a queued/generating report is now ready
//   6. unfinished              — open (not-closed) consulting session exists
//   7. openDream               — a recent catchup mentioned a dream that
//                                hasn't been worked
//   8. catchupConsider         — latest catchup feedback has a "consider" line
//                                and no session has happened since
//   9. thinReading             — depth band == 'thin'
//  10. catchupCompleted        — first visit after submitting a catchup
//  11. quiet                   — default
//
// `welcomeBack` is reserved for the first visit after magic-link auth
// (handled at the auth callback, not here).

import type { DepthBand } from "@/lib/copy";
import type { TodayLineRef } from "@/lib/copy";

export type TodayContext = {
  /** First name for personalization in the connection-accepted variant. */
  firstName: string | null;
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
  /** True if any unacknowledged high/critical safety flag exists. */
  hasUnacknowledgedSafetyFlag?: boolean;
  /** True if initial post-intake readings are still being generated. */
  initialReadingsPending?: boolean;
  /** True if the latest catchup carried a "consider" line and no session has happened since. */
  catchupHasUnaddressedConsider?: boolean;
};

export function computeTodayLine(ctx: TodayContext): TodayLineRef {
  if (ctx.hasUnacknowledgedSafetyFlag) {
    return { key: "safetyFollowup" };
  }

  if (ctx.initialReadingsPending) {
    return { key: "initialReadingsGenerating" };
  }

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

  if (ctx.catchupHasUnaddressedConsider) {
    return { key: "catchupConsider" };
  }

  if (ctx.depthBand === "thin") {
    return { key: "thinReading" };
  }

  if (ctx.catchupRecentlySubmitted) {
    return { key: "catchupCompleted" };
  }

  return { key: "quiet" };
}

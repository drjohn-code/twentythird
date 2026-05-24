import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_PATH,
  INTAKE_INTRO_PATH,
  fetchIntakeGate,
} from "@/lib/onboarding/routing";
import PendingStatus from "@/components/dashboard/PendingStatus";
import RoomNav from "@/components/room/RoomNav";
import TodayLine from "@/components/room/TodayLine";
import RoomFooter from "@/components/room/RoomFooter";
import {
  computeTodayLine,
  type TodayContext,
} from "@/lib/today";
import { resolveTodayLine } from "@/lib/copy";
import { depthBand } from "@/lib/depth";

// All Room routes mount under this layout — it owns the auth gate,
// the intake gate (with PendingStatus passthrough), the nav, the
// per-request Today line, and the footer.
export default async function RoomLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/room");
  }

  const gate = await fetchIntakeGate(supabase, user.id);
  if (!gate || !gate.account_initiated_at) {
    redirect(ACCOUNT_PATH);
  }
  if (!gate.intake_submitted_at) {
    redirect(INTAKE_INTRO_PATH);
  }

  // Profile-being-read state — preserved verbatim from the prior
  // /dashboard implementation, still rendered inside the Room shell
  // so the user sees the same chrome.
  if (gate.intake_status === "processing") {
    const submittedAt = gate.intake_submitted_at
      ? new Date(gate.intake_submitted_at)
      : null;
    return (
      <div className="room-shell">
        <PendingStatus submittedAt={submittedAt} />
        <RoomFooter />
      </div>
    );
  }

  // Pull what the Today line + nav need. Everything here is cheap and
  // server-side; depth + today have no caches by design.
  const [
    metaRes,
    profileRes,
    catchupsRes,
    sessionsRes,
    connectionsRes,
    reportsRes,
  ] = await Promise.all([
    supabase
      .from("users_meta")
      .select("display_name, reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string | null; reading_depth: number | null }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>(),
    supabase
      .from("catchups")
      .select("created_at, week_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("sessions")
      .select("id")
      .eq("user_id", user.id)
      .is("closed_at", null)
      .limit(1),
    supabase
      .from("connections")
      .select(
        "status, accepted_at, ended_at, connection_first_name, inviter_user_id, connection_user_id",
      )
      .or(
        `inviter_user_id.eq.${user.id},connection_user_id.eq.${user.id}`,
      )
      .order("accepted_at", { ascending: false, nullsFirst: false })
      .limit(5),
    supabase
      .from("reports")
      .select("status, created_at")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const fullName =
    metaRes.data?.display_name ?? profileRes.data?.full_name ?? null;
  const firstName = firstNameFrom(fullName);

  const depth = metaRes.data?.reading_depth ?? 0;
  const band = depthBand(depth);

  const isoWeek = currentIsoWeek(new Date());
  const latestCatchup = catchupsRes.data?.[0] ?? null;
  const catchupForThisWeek =
    latestCatchup ? latestCatchup.week_number === isoWeek : false;
  const catchupRecentlySubmitted =
    latestCatchup
      ? Date.now() - new Date(latestCatchup.created_at).getTime() <
        36 * 60 * 60 * 1000
      : false;

  const recentlyAcceptedConnection = (() => {
    const rows =
      (connectionsRes.data as
        | Array<{
            status: string;
            accepted_at: string | null;
            connection_first_name: string | null;
          }>
        | null) ?? [];
    const within7d = (iso: string | null) => {
      if (!iso) return false;
      return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
    };
    const hit = rows.find(
      (r) =>
        r.status === "active" &&
        within7d(r.accepted_at) &&
        r.connection_first_name,
    );
    return hit && hit.connection_first_name && hit.accepted_at
      ? {
          firstName: hit.connection_first_name,
          acceptedAt: new Date(hit.accepted_at),
        }
      : null;
  })();

  const recentlyEndedConnection = (() => {
    const rows =
      (connectionsRes.data as
        | Array<{
            status: string;
            ended_at: string | null;
            connection_first_name: string | null;
          }>
        | null) ?? [];
    const within7d = (iso: string | null) => {
      if (!iso) return false;
      return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
    };
    const hit = rows.find(
      (r) =>
        r.status === "ended" &&
        within7d(r.ended_at) &&
        r.connection_first_name,
    );
    return hit && hit.connection_first_name && hit.ended_at
      ? {
          firstName: hit.connection_first_name,
          endedAt: new Date(hit.ended_at),
        }
      : null;
  })();

  const reportRecentlyReady = (() => {
    const r = reportsRes.data?.[0];
    if (!r) return false;
    return (
      Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000
    );
  })();

  const todayCtx: TodayContext = {
    firstName,
    isoWeek,
    catchupForThisWeek,
    recentlyAcceptedConnection,
    recentlyEndedConnection,
    hasOpenSession: (sessionsRes.data?.length ?? 0) > 0,
    openDreamDay: null, // wired in Phase 3 (parses recent catchup answers)
    reportRecentlyReady,
    catchupRecentlySubmitted,
    depthBand: band,
  };
  const todaySentence = resolveTodayLine(computeTodayLine(todayCtx));

  return (
    <div className="room-shell">
      <RoomNav firstName={firstName} />
      <main className="room-main">
        <TodayLine sentence={todaySentence} />
        {children}
      </main>
      <RoomFooter />
    </div>
  );
}

function firstNameFrom(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

// ISO-8601 week number. Trigger source: weeks start on Monday; week 1
// is the one containing the first Thursday of the year.
function currentIsoWeek(d: Date): number {
  const date = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

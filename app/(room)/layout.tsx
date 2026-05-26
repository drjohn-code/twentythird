import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_PATH,
  INTAKE_INTRO_PATH,
  fetchIntakeGate,
} from "@/lib/onboarding/routing";
import PendingStatus from "@/components/dashboard/PendingStatus";
import IntakeFailedState from "@/components/dashboard/IntakeFailedState";
import RoomNav from "@/components/room/RoomNav";
import TodayLine from "@/components/room/TodayLine";
import RoomFooter from "@/components/room/RoomFooter";
import SafetyResponse from "@/components/room/SafetyResponse";
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

  // Permanent-failure state — the initial readings job hit a
  // non-transient error (parse failure, code bug, non-recoverable
  // 4xx). The user gets a quiet error head and a single retry CTA;
  // POST /api/intake/retry resets intake_status back to 'processing'
  // and re-fires the AI pipeline. Only renders when the gate
  // explicitly reads 'failed' — never on 'processing' (which would
  // let the user spam the pipeline mid-run).
  if (gate.intake_status === "failed") {
    return (
      <div className="room-shell">
        <IntakeFailedState />
        <RoomFooter />
      </div>
    );
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

  // Initial-readings pending — intake is submitted but the v2
  // readings are still being generated. Show the same PendingStatus
  // so the user never lands on placeholder copy.
  const initialReadingsStatus = await readInitialReadingsStatus(
    supabase,
    user.id,
  );
  if (
    initialReadingsStatus === "pending" ||
    initialReadingsStatus === "generating"
  ) {
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
    safetyFlagsRes,
  ] = await Promise.all([
    supabase
      .from("users_meta")
      .select("display_name, reading_depth, initial_readings_status")
      .eq("user_id", user.id)
      .maybeSingle<{
        display_name: string | null;
        reading_depth: number | null;
        initial_readings_status: string | null;
      }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>(),
    supabase
      .from("catchups")
      .select("created_at")
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
    supabase
      .from("safety_flags")
      .select("id, severity, source, acknowledged_at, created_at")
      .eq("user_id", user.id)
      .in("severity", ["high", "critical"])
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const fullName =
    metaRes.data?.display_name ?? profileRes.data?.full_name ?? null;
  const firstName = firstNameFrom(fullName);

  const depth = metaRes.data?.reading_depth ?? 0;
  const band = depthBand(depth);

  const latestCatchup = catchupsRes.data?.[0] ?? null;
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

  const unacknowledgedFlagRow =
    (safetyFlagsRes.data as
      | Array<{
          id: string;
          severity: string;
          source: string;
          acknowledged_at: string | null;
        }>
      | null
      | undefined)?.[0] ?? null;

  const initialReadingsPending =
    metaRes.data?.initial_readings_status === "pending" ||
    metaRes.data?.initial_readings_status === "generating";

  const catchupHasUnaddressedConsider = await readCatchupConsider(
    supabase,
    user.id,
  );

  const todayCtx: TodayContext = {
    firstName,
    recentlyAcceptedConnection,
    recentlyEndedConnection,
    hasOpenSession: (sessionsRes.data?.length ?? 0) > 0,
    openDreamDay: null, // wired in Phase 3 (parses recent catchup answers)
    reportRecentlyReady,
    catchupRecentlySubmitted,
    depthBand: band,
    hasUnacknowledgedSafetyFlag: !!unacknowledgedFlagRow,
    initialReadingsPending,
    catchupHasUnaddressedConsider,
  };
  const todaySentence = resolveTodayLine(computeTodayLine(todayCtx));

  return (
    <div className="room-shell">
      <RoomNav firstName={firstName} />
      <main className="room-main">
        <TodayLine sentence={todaySentence} />
        {unacknowledgedFlagRow ? (
          <div className="safety-response-wrap">
            <SafetyResponse
              context={
                unacknowledgedFlagRow.source === "intake"
                  ? "intake"
                  : unacknowledgedFlagRow.source === "catchup"
                    ? "catchup"
                    : "session"
              }
              showResources
            />
          </div>
        ) : null}
        {children}
      </main>
      <RoomFooter />
    </div>
  );
}

async function readCatchupConsider(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("catchups")
    .select("created_at, feedback")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      created_at: string;
      feedback: { consider?: string | null } | null;
    }>();
  if (!data?.feedback?.consider) return false;
  const since = new Date(data.created_at).getTime();
  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", new Date(since).toISOString());
  return (count ?? 0) === 0;
}

async function readInitialReadingsStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("users_meta")
    .select("initial_readings_status")
    .eq("user_id", userId)
    .maybeSingle<{ initial_readings_status: string | null }>();
  return data?.initial_readings_status ?? "ready";
}

function firstNameFrom(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}


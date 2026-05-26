import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_PATH,
  INTAKE_INTRO_PATH,
  fetchIntakeGate,
} from "@/lib/onboarding/routing";
import { firstNameFrom } from "@/lib/connections";
import PendingStatus from "@/components/dashboard/PendingStatus";
import IntakeFailedState from "@/components/dashboard/IntakeFailedState";
import RoomNav from "@/components/room/RoomNav";
import RoomFooter from "@/components/room/RoomFooter";
import SafetyResponse from "@/components/room/SafetyResponse";

// All Room routes mount under this layout — it owns the auth gate,
// the intake gate (with PendingStatus passthrough), the nav, and the
// footer.
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

  if (gate.intake_status === "failed") {
    return (
      <div className="room-shell">
        <IntakeFailedState />
        <RoomFooter />
      </div>
    );
  }

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

  const [metaRes, profileRes, safetyFlagsRes] = await Promise.all([
    supabase
      .from("users_meta")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle<{ display_name: string | null }>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>(),
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

  return (
    <div className="room-shell">
      <RoomNav firstName={firstName} />
      <main className="room-main">
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


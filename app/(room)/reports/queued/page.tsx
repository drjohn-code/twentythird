import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";

// ────────────────────────────────────────────────────────────────────
// /reports/queued
//
// Stripe success_url for the one-off report checkout. The webhook may
// or may not have landed by the time the browser arrives. If a recent
// queued report exists for the user, hop to its status page; otherwise
// show the quiet single-line "being prepared" copy and let the user
// return to the readings.
// ────────────────────────────────────────────────────────────────────

type ReportRow = { id: string };

const RECENT_WINDOW_MS = 10 * 60 * 1000;

export default async function ReportsQueuedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
  const { data: recent } = await supabase
    .from("reports")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ReportRow>();

  if (recent?.id) {
    redirect(`/reports/${recent.id}`);
  }

  const t = await getTranslations("room");

  return (
    <section className="report-status">
      <Eyebrow>{t("reports.queued.eyebrow")}</Eyebrow>
      <p className="report-status-line">{t("reports.queued.line")}</p>
      <RowLink href="/readings" arrow="left">
        {t("reports.queued.back")}
      </RowLink>
    </section>
  );
}

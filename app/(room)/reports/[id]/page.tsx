import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";

type ReportRow = {
  id: string;
  status: "queued" | "generating" | "ready" | "failed";
  pdf_url: string | null;
  created_at: string;
};

type RouteParams = { id: string };

/**
 * /reports/[id] — quiet status page for a queued or ready report.
 *
 * Per the build prompt: no spinners, a single serif italic line. We
 * surface the four possible states (queued, generating, ready, failed)
 * with appropriately quiet copy.
 */
export default async function ReportStatusPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The (room) layout has already guaranteed a session.
  if (!user) return null;

  const { data: report } = await supabase
    .from("reports")
    .select("id, status, pdf_url, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<ReportRow>();

  if (!report) {
    redirect("/readings");
  }

  return (
    <section className="report-status">
      <Eyebrow>CLINICAL REPORT</Eyebrow>
      <p className="report-status-line">{lineFor(report.status)}</p>
      {report.status === "ready" && report.pdf_url ? (
        <RowLink href={report.pdf_url}>open the report</RowLink>
      ) : (
        <RowLink href="/readings" arrow="left">
          back to the readings
        </RowLink>
      )}
    </section>
  );
}

function lineFor(status: ReportRow["status"]): string {
  switch (status) {
    case "queued":
      return "your report is being prepared — we'll email you when it's ready.";
    case "generating":
      return "the report is being written.";
    case "ready":
      return "the report is ready.";
    case "failed":
      return "the report did not complete. we'll try again shortly.";
  }
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
 * No spinners, a single serif italic line. When status is ready, we
 * mint a 24-hour signed URL for the stored artifact and link to it.
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

  let signedUrl: string | null = null;
  if (report.status === "ready" && report.pdf_url) {
    const { data: signed } = await supabase.storage
      .from("reports")
      .createSignedUrl(report.pdf_url, 60 * 60 * 24);
    signedUrl = signed?.signedUrl ?? null;
  }

  const t = await getTranslations("room");

  return (
    <section className="report-status">
      <Eyebrow>{t("reports.status.eyebrow")}</Eyebrow>
      <p className="report-status-line">
        {t(`reports.status.line.${report.status}`)}
      </p>
      {report.status === "ready" && signedUrl ? (
        <RowLink href={signedUrl}>{t("reports.status.open")}</RowLink>
      ) : (
        <RowLink href="/readings" arrow="left">
          {t("reports.status.back")}
        </RowLink>
      )}
    </section>
  );
}

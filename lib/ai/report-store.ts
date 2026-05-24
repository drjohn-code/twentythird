import "server-only";

// Report storage + PDF capture.
//
// The PDF artifact for a report lives in Supabase Storage under the
// `reports` bucket. The path is `<user_id>/<report_id>.pdf`. RLS on
// the bucket restricts SELECT to the owning user (configured in the
// Supabase dashboard or via SQL: see docs/STORAGE.md when added).
//
// capturePdf is the seam where Playwright or a hosted browser service
// produces the bytes from the HTML render route. In dev (no headless
// browser available) it falls back to storing the HTML directly,
// which the PDF page can still serve as text/html via an alternate
// route. Production must wire a real capture.

import type { ReportDocument } from "@/lib/ai/prompts/report-generation";
import { adminClient } from "@/lib/supabase/admin";

export type CapturedArtifact = {
  contentType: "application/pdf" | "text/html";
  bytes: Uint8Array;
  ext: "pdf" | "html";
};

export async function captureReportArtifact(
  reportPdfUrl: string,
): Promise<CapturedArtifact> {
  // If a hosted browser service URL is set, use it.
  const serviceUrl = process.env.PDF_RENDER_SERVICE_URL;
  const serviceToken = process.env.PDF_RENDER_SERVICE_TOKEN;
  if (serviceUrl) {
    try {
      const res = await fetch(serviceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
        },
        body: JSON.stringify({ url: reportPdfUrl, options: { format: "A4" } }),
      });
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        return { contentType: "application/pdf", bytes: buf, ext: "pdf" };
      }
    } catch {
      // fall through to local fallback
    }
  }

  // Fallback — fetch the HTML render directly and store as text/html.
  // The report is still accessible; production should wire a real
  // capture by setting PDF_RENDER_SERVICE_URL.
  const res = await fetch(reportPdfUrl);
  const html = await res.text();
  return {
    contentType: "text/html",
    bytes: new TextEncoder().encode(html),
    ext: "html",
  };
}

export async function uploadReportArtifact(
  userId: string,
  reportId: string,
  artifact: CapturedArtifact,
): Promise<string | null> {
  const admin = adminClient();
  if (!admin) return null;
  const path = `${userId}/${reportId}.${artifact.ext}`;
  const { error } = await admin.storage
    .from("reports")
    .upload(path, artifact.bytes, {
      contentType: artifact.contentType,
      upsert: true,
    });
  if (error) return null;
  return path;
}

export function safetySummaryFrom(doc: ReportDocument): string {
  if (doc.clinical_priorities.length === 0) return "no clinical priorities";
  const top = doc.clinical_priorities
    .map(
      (p) => `${p.severity.toUpperCase()} · ${p.category} — ${p.note}`,
    )
    .join("\n\n");
  return top;
}

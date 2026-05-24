import { notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { ensureCache } from "@/app/api/internal/report-generate/route";
import { BLOCKS, type BlockSlug } from "@/lib/blocks";

// /internal/report-pdf/[id] — the HTML page that Playwright (or a
// hosted browser service) captures into a PDF. Not linked from
// anywhere in the user-facing app. Auth is via the AI_INTERNAL_TOKEN
// query parameter `?t=…`, which only the report-generate route
// supplies.

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

export default async function ReportPdfPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { t } = await searchParams;
  const expected = process.env.AI_INTERNAL_TOKEN;
  if (!expected || t !== expected) {
    notFound();
  }

  const doc = ensureCache().get(id);
  if (!doc) {
    notFound();
  }

  const admin = adminClient();
  if (!admin) {
    notFound();
  }

  const { data: report } = await admin
    .from("reports")
    .select("id, user_id, depth_at_generation, created_at")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      user_id: string;
      depth_at_generation: number | null;
      created_at: string;
    }>();
  if (!report) {
    notFound();
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", report.user_id)
    .maybeSingle<{ full_name: string | null }>();
  const subject = profile?.full_name ?? "case · unnamed";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Clinical report</title>
        <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />
      </head>
      <body className="report-pdf">
        <header className="report-pdf__head">
          <div className="report-pdf__eyebrow">TWENTYTHIRD · CLINICAL REPORT</div>
          <h1 className="report-pdf__h">
            For the receiving <em>clinician</em>.
          </h1>
          <div className="report-pdf__meta">
            <span>case · {subject}</span>
            <span>prepared · {formatDate(new Date(report.created_at))}</span>
            <span>
              reading depth · {Math.round((report.depth_at_generation ?? 0) * 100)}
            </span>
          </div>
        </header>

        {doc.clinical_priorities.length > 0 ? (
          <section className="report-pdf__priorities">
            <div className="report-pdf__eyebrow report-pdf__eyebrow--strong">
              CLINICAL PRIORITIES
            </div>
            <ul>
              {doc.clinical_priorities.map((p, i) => (
                <li key={i}>
                  <span className="report-pdf__sev">{p.severity.toUpperCase()}</span>
                  <span className="report-pdf__cat">
                    <em>{p.category.replace(/_/g, " ")}</em>
                  </span>
                  <p className="report-pdf__note">{p.note}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="report-pdf__section">
          <div className="report-pdf__eyebrow">EXECUTIVE SUMMARY</div>
          <div className="report-pdf__prose">
            {doc.executive_summary
              .split(/\n\s*\n/)
              .map((p, i) => <p key={i}>{p.trim()}</p>)}
          </div>
        </section>

        <section className="report-pdf__section">
          <div className="report-pdf__eyebrow">READINGS</div>
          {BLOCKS.map((b) => {
            const block = doc.blocks[b.slug as BlockSlug];
            if (!block) return null;
            return (
              <article key={b.slug} className="report-pdf__block">
                <div className="report-pdf__block-head">
                  <span className="report-pdf__block-no">
                    {String(b.index).padStart(2, "0")}
                  </span>
                  <span className="report-pdf__block-subtitle">
                    <em>{b.subtitle}</em>
                  </span>
                  <span className="report-pdf__block-naming">
                    {block.clinical_naming}
                  </span>
                </div>
                <p className="report-pdf__block-reading">
                  <em>{block.reading}</em>
                </p>
                <div className="report-pdf__prose">
                  {block.interpretation
                    .split(/\n\s*\n/)
                    .map((p, i) => <p key={i}>{p.trim()}</p>)}
                </div>
                {block.evidence.length > 0 ? (
                  <ul className="report-pdf__evidence">
                    {block.evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </section>

        {doc.relational_field ? (
          <section className="report-pdf__section">
            <div className="report-pdf__eyebrow">RELATIONAL FIELD</div>
            <div className="report-pdf__prose">
              {doc.relational_field
                .split(/\n\s*\n/)
                .map((p, i) => <p key={i}>{p.trim()}</p>)}
            </div>
          </section>
        ) : null}

        <section className="report-pdf__section">
          <div className="report-pdf__eyebrow">TRAJECTORY</div>
          <div className="report-pdf__prose">
            {doc.trajectory
              .split(/\n\s*\n/)
              .map((p, i) => <p key={i}>{p.trim()}</p>)}
          </div>
        </section>

        {doc.questions_for_the_analyst.length > 0 ? (
          <section className="report-pdf__section">
            <div className="report-pdf__eyebrow">QUESTIONS FOR THE ANALYST</div>
            <ul className="report-pdf__questions">
              {doc.questions_for_the_analyst.map((q, i) => (
                <li key={i}>
                  <em>{q}</em>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="report-pdf__foot">
          <p>
            TwentyThird is a psychodynamic AI platform. This document is
            a working tool for the receiving clinician, not a diagnosis.
          </p>
        </footer>
      </body>
    </html>
  );
}

function formatDate(d: Date): string {
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

const REPORT_CSS = `
  :root {
    --bg: #f5f5f3;
    --fg: #121214;
    --fg-dim: #5a5a60;
    --fg-mute: #6a6a72;
    --hair: rgba(0,0,0,0.12);
    --hair-strong: rgba(0,0,0,0.28);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--fg); font-family: "Source Serif 4", Georgia, serif; font-size: 12pt; line-height: 1.55; padding: 36mm 26mm; }
  em { font-style: italic; }
  .report-pdf__eyebrow { font-family: "JetBrains Mono", monospace; font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-mute); border-top: 1px solid var(--hair); padding-top: 10pt; margin-bottom: 14pt; }
  .report-pdf__eyebrow--strong { border-top-color: var(--hair-strong); color: var(--fg); }
  .report-pdf__head { padding-bottom: 28pt; border-bottom: 1px solid var(--hair); margin-bottom: 28pt; }
  .report-pdf__h { font-family: "Instrument Serif", "Source Serif 4", serif; font-size: 32pt; line-height: 1.1; margin: 10pt 0 18pt; font-weight: 400; }
  .report-pdf__meta { font-family: "JetBrains Mono", monospace; font-size: 9pt; color: var(--fg-mute); letter-spacing: 0.04em; display: flex; flex-wrap: wrap; gap: 18pt; }
  .report-pdf__priorities { padding: 18pt 0 24pt; border-bottom: 1px solid var(--hair-strong); margin-bottom: 28pt; }
  .report-pdf__priorities ul { list-style: none; }
  .report-pdf__priorities li { padding: 14pt 0; border-bottom: 1px solid var(--hair); display: grid; grid-template-columns: 70pt 1fr; column-gap: 18pt; row-gap: 8pt; }
  .report-pdf__priorities li:last-child { border-bottom: 0; }
  .report-pdf__sev { font-family: "JetBrains Mono", monospace; font-size: 10pt; letter-spacing: 0.1em; color: var(--fg); }
  .report-pdf__cat { font-size: 14pt; }
  .report-pdf__note { grid-column: 1 / -1; color: var(--fg-dim); font-size: 12pt; }
  .report-pdf__section { padding: 22pt 0; }
  .report-pdf__prose p { margin-bottom: 12pt; }
  .report-pdf__block { padding: 20pt 0; border-top: 1px solid var(--hair); page-break-inside: avoid; }
  .report-pdf__block-head { display: flex; gap: 14pt; align-items: baseline; margin-bottom: 12pt; flex-wrap: wrap; }
  .report-pdf__block-no { font-family: "JetBrains Mono", monospace; font-size: 10pt; color: var(--fg-mute); letter-spacing: 0.08em; }
  .report-pdf__block-subtitle { font-size: 16pt; color: var(--fg); }
  .report-pdf__block-naming { font-family: "Source Serif 4", serif; font-style: italic; font-size: 11pt; color: var(--fg-dim); margin-left: auto; }
  .report-pdf__block-reading { font-size: 14pt; margin-bottom: 12pt; color: var(--fg); }
  .report-pdf__evidence { list-style: none; margin-top: 12pt; padding-left: 0; }
  .report-pdf__evidence li { padding: 6pt 0; padding-left: 12pt; border-left: 1px solid var(--hair); color: var(--fg-dim); font-size: 11pt; margin-bottom: 4pt; }
  .report-pdf__questions { list-style: none; padding-left: 0; }
  .report-pdf__questions li { padding: 10pt 0; border-top: 1px solid var(--hair); font-size: 13pt; }
  .report-pdf__questions li:first-child { border-top: 0; }
  .report-pdf__foot { margin-top: 36pt; padding-top: 18pt; border-top: 1px solid var(--hair); font-size: 10pt; color: var(--fg-mute); font-family: "Source Serif 4", serif; }
`;

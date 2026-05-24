import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";

// /case-file/[id] — the per-entry detail view.
//
// Phase 5 stub: looks the entry up in the union view, confirms it
// belongs to the user, and renders a single italic line plus a return
// link. Full per-kind layouts (catchup read-back, session transcript,
// report PDF link) follow in later phases.

type Params = Promise<{ id: string }>;

type CaseEntryRow = {
  entry_id: string;
  entry_kind: string;
  entry_title: string;
  entry_summary: string | null;
  occurred_at: string;
};

export default async function CaseFileEntryPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("case_file_entries")
    .select("entry_id, entry_kind, entry_title, entry_summary, occurred_at")
    .eq("user_id", user.id)
    .eq("entry_id", id)
    .maybeSingle<CaseEntryRow>();

  if (!data) notFound();

  return (
    <Reveal as="section" className="room-section case-file-entry">
      <Eyebrow>CASE FILE · ENTRY</Eyebrow>
      <div className="case-file-entry-meta">
        <span className="case-file-date">{formatDate(data.occurred_at)}</span>
        <span className="case-file-kind">{data.entry_kind}</span>
      </div>
      <h1 className="case-file-entry-h">{data.entry_title}</h1>
      <p className="case-file-entry-line">
        this entry&rsquo;s detail view is coming. for now, the case file
        keeps the date, the kind, and the title — and the rest is still
        in the room.
      </p>
      {data.entry_summary ? (
        <p className="case-file-entry-summary">{data.entry_summary}</p>
      ) : null}
      <div className="case-file-entry-actions">
        <RowLink href="/case-file" arrow="left">
          back to the case file
        </RowLink>
        <Link href="/room" className="auth-rowlink">
          <span>return to the room</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </Reveal>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

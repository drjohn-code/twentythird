import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import CaseDetailSections from "@/components/room/CaseDetailSections";
import CaseDetailGenerator from "@/components/room/CaseDetailGenerator";

// /case-file/[id] — the per-entry detail view.
//
// Catchup and session entries get a two-section read: a 40-word
// summary of what the user answered + a 40-word recommendation. The
// pair is cached on the row (catchups.detail_summary,
// sessions.detail_recommendation, etc.). When cached, we render
// server-side; otherwise the client generator posts to
// /api/case-file/detail, which generates and writes the cache.
//
// Other kinds (report, reading, connection, safety_flag) keep the
// stub copy for now — they have their own roadmaps.

type Params = Promise<{ id: string }>;

type CaseEntryRow = {
  entry_id: string;
  entry_kind: string;
  entry_title: string;
  entry_summary: string | null;
  occurred_at: string;
};

type CatchupDetailRow = {
  detail_summary: string | null;
  detail_recommendation: string | null;
};

type SessionDetailRow = {
  closed_at: string | null;
  detail_summary: string | null;
  detail_recommendation: string | null;
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

  const detailBlock = await renderDetail(supabase, user.id, data);

  return (
    <Reveal as="section" className="room-section case-file-entry">
      <Eyebrow>CASE FILE · ENTRY</Eyebrow>
      <div className="case-file-entry-meta">
        <span className="case-file-date">{formatDate(data.occurred_at)}</span>
        <span className="case-file-kind">{data.entry_kind}</span>
      </div>
      <h1 className="case-file-entry-h">{data.entry_title}</h1>

      {detailBlock}

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

async function renderDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entry: CaseEntryRow,
): Promise<React.ReactNode> {
  if (entry.entry_kind === "catchup") {
    const { data: row } = await supabase
      .from("catchups")
      .select("detail_summary, detail_recommendation")
      .eq("user_id", userId)
      .eq("id", entry.entry_id)
      .maybeSingle<CatchupDetailRow>();

    if (row?.detail_summary && row?.detail_recommendation) {
      return (
        <CaseDetailSections
          detail={{
            summary: row.detail_summary,
            recommendation: row.detail_recommendation,
          }}
        />
      );
    }
    return (
      <CaseDetailGenerator entryId={entry.entry_id} entryKind="catchup" />
    );
  }

  if (entry.entry_kind === "session") {
    const { data: row } = await supabase
      .from("sessions")
      .select("closed_at, detail_summary, detail_recommendation")
      .eq("user_id", userId)
      .eq("id", entry.entry_id)
      .maybeSingle<SessionDetailRow>();

    if (!row?.closed_at) {
      return (
        <p className="case-file-entry-line">
          this session is still open. the read appears once it closes.
        </p>
      );
    }
    if (row.detail_summary && row.detail_recommendation) {
      return (
        <CaseDetailSections
          detail={{
            summary: row.detail_summary,
            recommendation: row.detail_recommendation,
          }}
        />
      );
    }
    return (
      <CaseDetailGenerator entryId={entry.entry_id} entryKind="session" />
    );
  }

  // Other kinds — keep the existing stub copy. They have their own
  // per-kind layouts coming in later phases.
  return (
    <>
      <p className="case-file-entry-line">
        this entry&rsquo;s detail view is coming. for now, the case file
        keeps the date, the kind, and the title — and the rest is still
        in the room.
      </p>
      {entry.entry_summary ? (
        <p className="case-file-entry-summary">{entry.entry_summary}</p>
      ) : null}
    </>
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

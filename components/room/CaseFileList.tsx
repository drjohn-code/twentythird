import Link from "next/link";

// CaseFileList — the chronological dossier.
//
// Entries arrive most-recent-first. We walk the list and insert a
// "silent week" divider whenever there is a ≥ 7-day gap between two
// adjacent entries. Silent weeks are computed here (not in the view)
// because they are about the absence of data — a property of the
// stream, not of any row.

export type CaseEntry = {
  entry_id: string;
  entry_kind: string;
  entry_title: string;
  entry_summary: string | null;
  occurred_at: string;
};

type Filter = "all" | "catchups" | "sessions" | "reports" | "connections";

type CaseFileListProps = {
  entries: CaseEntry[];
  /** When 'all', silent weeks are rendered between entries — they read as the
   *  absence the page is making visible. For filtered views the absence is an
   *  artefact of the filter, not a fact about the case, so they are suppressed. */
  filter: Filter;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function CaseFileList({ entries, filter }: CaseFileListProps) {
  // Empty state is rendered by the page so it can vary per active tab
  // (different wording, different CTA, sometimes a Subscription block
  // beneath instead of the Clinical Report).

  // Walk newest → oldest; insert a silent-week node where the gap
  // between adjacent entries crosses 7 days. We only render these
  // when the user is looking at the unfiltered view.
  const nodes: Array<
    | { kind: "entry"; entry: CaseEntry }
    | { kind: "silent"; key: string }
  > = [];

  entries.forEach((entry, idx) => {
    nodes.push({ kind: "entry", entry });
    if (filter !== "all") return;
    const next = entries[idx + 1];
    if (!next) return;
    const gapMs =
      new Date(entry.occurred_at).getTime() -
      new Date(next.occurred_at).getTime();
    if (gapMs >= SEVEN_DAYS_MS) {
      nodes.push({ kind: "silent", key: `silent-${entry.entry_id}` });
    }
  });

  return (
    <ol className="case-file-list">
      {nodes.map((n) =>
        n.kind === "silent" ? (
          <li key={n.key} className="case-file-silent" aria-hidden="true">
            <span>— silent week —</span>
          </li>
        ) : (
          <li key={n.entry.entry_id} className="case-file-row">
            <span className="case-file-date">
              {formatDate(n.entry.occurred_at)}
            </span>
            <span className="case-file-kind">{kindLabel(n.entry.entry_kind)}</span>
            <div className="case-file-body">
              <h3 className="case-file-title">{n.entry.entry_title}</h3>
              {n.entry.entry_summary ? (
                <p className="case-file-summary">{n.entry.entry_summary}</p>
              ) : null}
              <Link
                href={`/case-file/${n.entry.entry_id}`}
                className="auth-rowlink case-file-link"
              >
                <span>open</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </li>
        ),
      )}
    </ol>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "catchup":
      return "catchup";
    case "session":
      return "session";
    case "report":
      return "clinical report";
    case "reading":
      return "intake reading";
    case "connection":
      return "connection event";
    default:
      return kind;
  }
}

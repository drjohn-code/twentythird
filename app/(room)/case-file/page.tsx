import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import CaseFileList, {
  type CaseEntry,
} from "@/components/room/CaseFileList";

// /case-file — the chronological dossier.
//
// Filter is passed via ?filter= so it stays a server render. Hairline
// text toggles (not chips). Silent weeks are computed in the list
// component, not the view.

const FILTERS = ["all", "readings", "catchups", "sessions", "reports"] as const;
type Filter = (typeof FILTERS)[number];

const KIND_BY_FILTER: Record<
  Exclude<Filter, "all">,
  ReadonlyArray<string>
> = {
  readings: ["reading"],
  catchups: ["catchup"],
  sessions: ["session"],
  reports: ["report"],
};

type SearchParams = Promise<{ filter?: string }>;

export default async function CaseFilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = isFilter(params.filter) ? params.filter : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("case_file_entries")
    .select("entry_id, entry_kind, entry_title, entry_summary, occurred_at")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false })
    .limit(300);

  if (filter !== "all") {
    const kinds = KIND_BY_FILTER[filter];
    query = query.in("entry_kind", kinds as string[]);
  }

  const { data } = await query;
  const entries = (data ?? []) as CaseEntry[];

  return (
    <>
      <Reveal as="section" className="room-section">
        <div className="room-section-head">
          <Eyebrow>CASE FILE</Eyebrow>
          <h2 className="case-file-h">
            A record, kept <span className="it">quietly.</span>
          </h2>
          <p className="lede">
            Every catchup, session, and report — kept in date order.
            The gaps are part of the record.
          </p>
        </div>

        <nav className="case-file-filters" aria-label="Filter">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/case-file" : `/case-file?filter=${f}`}
              className={
                "case-file-filter" + (f === filter ? " is-active" : "")
              }
              aria-current={f === filter ? "page" : undefined}
            >
              {f}
            </Link>
          ))}
        </nav>
      </Reveal>

      <section className="room-section">
        <CaseFileList entries={entries} filter={filter} />
      </section>
    </>
  );
}

function isFilter(v: string | undefined): v is Filter {
  return !!v && (FILTERS as readonly string[]).includes(v);
}

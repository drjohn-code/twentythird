import { createClient } from "@/lib/supabase/server";
import CatchupRunner from "@/components/room/CatchupRunner";
import CTA from "@/components/ui/CTA";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";

type CatchupRow = {
  id: string;
  week_number: number;
  summary: string | null;
  created_at: string;
};

export default async function CatchupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The (room) layout already enforces auth.
  if (!user) return null;

  const weekNumber = currentIsoWeek(new Date());

  const { data: existing } = await supabase
    .from("catchups")
    .select("id, week_number, summary, created_at")
    .eq("user_id", user.id)
    .eq("week_number", weekNumber)
    .maybeSingle<CatchupRow>();

  if (existing) {
    return <ReadBack row={existing} />;
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle<{ status: string | null }>();
  const isSubscribed = sub?.status === "active";

  return (
    <section className="room-section">
      <CatchupRunner weekNumber={weekNumber} isSubscribed={isSubscribed} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Read-back state (catchup already submitted for this ISO week)
// ────────────────────────────────────────────────────────────────────

function ReadBack({ row }: { row: CatchupRow }) {
  const weekLabel = `WEEK ${String(row.week_number).padStart(2, "0")}`;
  const paragraphs = (row.summary ?? "").split("\n\n").filter(Boolean);

  return (
    <section className="room-section">
      <Reveal as="div" className="catchup-summary">
        <div className="catchup-summary-eyebrow">{weekLabel} · READ BACK</div>
        <h2 className="catchup-summary-h">
          The week, <span className="it">already in.</span>
        </h2>

        {paragraphs.length > 0 ? (
          <div className="catchup-summary-body">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="catchup-summary-empty">
            the catchup is on file. the summary will be brief this week.
          </p>
        )}

        <p className="catchup-summary-foot">
          the next catchup opens at the start of week{" "}
          {String(row.week_number + 1).padStart(2, "0")}.
        </p>

        <div className="catchup-summary-cta">
          <CTA href="/room">Return to the room</CTA>
          <RowLink href="/case-file">read it again in the case file</RowLink>
        </div>
      </Reveal>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function currentIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

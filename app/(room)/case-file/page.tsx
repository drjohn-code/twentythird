import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import CaseFileList, {
  type CaseEntry,
} from "@/components/room/CaseFileList";
import CaseFileEmpty from "@/components/room/CaseFileEmpty";
import ClinicalReportCTA from "@/components/room/ClinicalReportCTA";
import SubscriptionCard from "@/components/room/SubscriptionCard";
import SettingsBlock from "@/components/room/SettingsBlock";
import { loadSubscriptionRow } from "@/lib/subscription";

// /case-file — the chronological dossier.
//
// Filter is passed via ?filter= so it stays a server render. Hairline
// text toggles (not chips). Silent weeks are computed in the list
// component, not the view. Intake readings live on /readings — they
// are not surfaced here.

const FILTERS = ["all", "catchups", "sessions", "reports"] as const;
type Filter = (typeof FILTERS)[number];

const KIND_BY_FILTER: Record<
  Exclude<Filter, "all">,
  ReadonlyArray<string>
> = {
  catchups: ["catchup"],
  sessions: ["session"],
  reports: ["report"],
};

// The "all" tab merges catchups, sessions, and reports — never intake
// readings (which are surfaced on /readings, not here).
const ALL_KINDS: ReadonlyArray<string> = ["catchup", "session", "report"];

type SearchParams = Promise<{ filter?: string }>;

export default async function CaseFilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = isFilter(params.filter) ? params.filter : "all";

  const t = await getTranslations("caseFile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const kindsForQuery =
    filter === "all" ? ALL_KINDS : KIND_BY_FILTER[filter];

  const entriesQuery = supabase
    .from("case_file_entries")
    .select("entry_id, entry_kind, entry_title, entry_summary, occurred_at")
    .eq("user_id", user.id)
    .in("entry_kind", kindsForQuery as string[])
    .order("occurred_at", { ascending: false })
    .limit(300);

  const monthStartIso = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      1,
      0,
      0,
      0,
    ),
  ).toISOString();

  const [entriesRes, subscription, metaRes, monthReportRes] = await Promise.all([
    entriesQuery,
    loadSubscriptionRow(supabase, user.id),
    supabase
      .from("users_meta")
      .select("reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<{ reading_depth: number | null }>(),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "clinical")
      .gte("created_at", monthStartIso),
  ]);

  const entries = (entriesRes.data ?? []) as CaseEntry[];
  const isSubscribed = subscription?.status === "active";
  const depth = metaRes.data?.reading_depth ?? 0;
  const monthlyReportUsed =
    isSubscribed && (monthReportRes.count ?? 0) >= 1;

  const isEmpty = entries.length === 0;

  return (
    <>
      <Reveal as="section" className="room-section">
        <div className="room-section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="case-file-h">
            {t("headlineLead")} <span className="it">{t("headlineItalic")}</span>
          </h2>
          <p className="lede">
            {t("lede")}
          </p>
        </div>

        <nav className="case-file-filters" aria-label={t("filterAria")}>
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? "/case-file" : `/case-file?filter=${f}`}
              className={
                "case-file-filter" + (f === filter ? " is-active" : "")
              }
              aria-current={f === filter ? "page" : undefined}
            >
              {t(`filter.${f}`)}
            </Link>
          ))}
        </nav>

        {isEmpty ? (
          <CaseFileEmpty {...emptyStateFor(filter, t)} />
        ) : (
          <CaseFileList entries={entries} filter={filter} />
        )}
      </Reveal>

      {filter === "sessions" ? (
        isSubscribed ? (
          <SettingsBlock title={t("subscriptionTitle")} id="subscription">
            <SubscriptionCard subscription={subscription} />
          </SettingsBlock>
        ) : (
          <div className="mx-auto max-w-[480px] text-center">
            <SettingsBlock title={t("subscriptionTitle")} id="subscription">
              <SubscriptionCard subscription={subscription} />
            </SettingsBlock>
          </div>
        )
      ) : (
        <ClinicalReportCTA
          isSubscribed={isSubscribed}
          depth={depth}
          monthlyReportUsed={monthlyReportUsed}
        />
      )}
    </>
  );
}

function isFilter(v: string | undefined): v is Filter {
  return !!v && (FILTERS as readonly string[]).includes(v);
}

// Per-tab empty-state text + CTA. The all and catchups tabs share the
// same copy (the first catchup is what opens the file in both cases).
// Sessions speaks to the consultation, reports has no CTA — it cannot
// be willed into existence by the user.
function emptyStateFor(
  filter: Filter,
  t: (key: string) => string,
): { text: string; cta?: { label: string; href: string } } {
  switch (filter) {
    case "all":
    case "catchups":
      return {
        text: t("emptyCatchups"),
        cta: { label: t("emptyCatchupsCta"), href: "/catchup" },
      };
    case "sessions":
      return {
        text: t("emptySessions"),
        cta: { label: t("emptySessionsCta"), href: "/consulting" },
      };
    case "reports":
      return {
        text: t("emptyReports"),
      };
  }
}

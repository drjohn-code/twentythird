import { getTranslations } from "next-intl/server";
import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";
import CTAGhost from "@/components/ui/CTAGhost";
import Reveal from "@/components/layout/Reveal";
import DevOpenRoomLink from "@/components/dashboard/DevOpenRoomLink";

type PendingStatusProps = {
  submittedAt: Date | null;
};

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Dashboard pending-state. Three meter rows mirror the brand's
 * <ReportMock> grammar without depending on its props shape — the
 * values are deterministic (100 / ~10 / 0), they are visual state,
 * not live progress.
 */
export default async function PendingStatus({ submittedAt }: PendingStatusProps) {
  const t = await getTranslations("room");
  return (
    <main className="dashboard-shell">
      <Reveal as="section" className="dashboard-head">
        <Eyebrow>{t("pending.eyebrow")}</Eyebrow>
        <h1 className="serif dashboard-headline">
          {t.rich("pending.headline", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>
        <p className="dashboard-lede">
          <span className="serif-i">{t("pending.lede")}</span>
        </p>
      </Reveal>

      <Reveal as="div" className="dashboard-panel-wrap">
        <Glass className="dashboard-panel">
          <div className="vh">
            <span className="lhs">
              <span>{t("pending.figIntake")}</span>{" "}
              <em>{t("pending.figSubmitted", { date: fmtDate(submittedAt) })}</em>
            </span>
            <span className="mono">Fig. 01</span>
          </div>
          <div className="dashboard-meters">
            <div className="rep-row dash-row is-done">
              <span className="k">{t("pending.rowResponses")}</span>
              <span className="meter">
                <i style={{ width: "100%" }} />
              </span>
              <span className="pct mono">100%</span>
            </div>
            <div className="rep-row dash-row is-running">
              <span className="k">{t("pending.rowPattern")}</span>
              <span className="meter">
                <i style={{ width: "10%" }} />
              </span>
              <span className="pct serif-i">{t("pending.statusInProgress")}</span>
            </div>
            <div className="rep-row dash-row is-queued">
              <span className="k">{t("pending.rowSynthesis")}</span>
              <span className="meter">
                <i style={{ width: "0%" }} />
              </span>
              <span className="pct serif-i">{t("pending.statusQueued")}</span>
            </div>
          </div>
          <div className="dashboard-foot">
            <span className="serif-i">{t("pending.foot")}</span>
          </div>
        </Glass>
      </Reveal>

      <div className="dashboard-cta">
        <CTAGhost href="/">{t("pending.returnCta")}</CTAGhost>
      </div>

      {/* TEMP: dev-only shortcut to open the Room without waiting for the 2-hour cron. Remove before launch. */}
      {process.env.NODE_ENV === "development" ? (
        <div className="dev-open-room-slot">
          <DevOpenRoomLink />
        </div>
      ) : null}
    </main>
  );
}

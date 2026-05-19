import Glass from "@/components/ui/Glass";
import Eyebrow from "@/components/ui/Eyebrow";
import CTAGhost from "@/components/ui/CTAGhost";
import Reveal from "@/components/layout/Reveal";

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
export default function PendingStatus({ submittedAt }: PendingStatusProps) {
  return (
    <main className="dashboard-shell">
      <Reveal as="section" className="dashboard-head">
        <Eyebrow>STATUS · PROCESSING</Eyebrow>
        <h1 className="serif dashboard-headline">
          Your profile is <em>being read</em>.
        </h1>
        <p className="dashboard-lede">
          <span className="serif-i">
            We are running your responses through the psychodynamic
            models now.
          </span>
          <br />
          The first pass usually takes about 48 hours. You will get an
          email when it is ready, and the room will reopen.
        </p>
      </Reveal>

      <Reveal as="div" className="dashboard-panel-wrap">
        <Glass className="dashboard-panel">
          <div className="vh">
            <span className="lhs">
              <span>INTAKE</span> <em>submitted {fmtDate(submittedAt)}</em>
            </span>
            <span className="mono">Fig. 01</span>
          </div>
          <div className="dashboard-meters">
            <div className="rep-row dash-row is-done">
              <span className="k">Responses received</span>
              <span className="meter">
                <i style={{ width: "100%" }} />
              </span>
              <span className="pct mono">100%</span>
            </div>
            <div className="rep-row dash-row is-running">
              <span className="k">Pattern extraction</span>
              <span className="meter">
                <i style={{ width: "10%" }} />
              </span>
              <span className="pct serif-i">in progress</span>
            </div>
            <div className="rep-row dash-row is-queued">
              <span className="k">Profile synthesis</span>
              <span className="meter">
                <i style={{ width: "0%" }} />
              </span>
              <span className="pct serif-i">queued</span>
            </div>
          </div>
          <div className="dashboard-foot">
            <span className="serif-i">we&apos;ll write when the work is ready</span>
          </div>
        </Glass>
      </Reveal>

      <div className="dashboard-cta">
        <CTAGhost href="/">return to the quiet room</CTAGhost>
      </div>
    </main>
  );
}

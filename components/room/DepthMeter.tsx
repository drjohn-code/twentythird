import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import {
  depthLines,
  depthExplainer,
  type DepthBand,
} from "@/lib/copy";
import {
  depthBand,
  type DepthBreakdown,
} from "@/lib/depth";

type LandingProps = {
  variant: "landing";
  depth: number;
  /** What's the largest missing source? Shown as a row-link only when depth < 0.5. */
  prompt?: { href: string; label: string } | null;
};

type SettingsProps = {
  variant: "settings";
  depth: number;
  breakdown: DepthBreakdown[];
};

type DepthMeterProps = LandingProps | SettingsProps;

/**
 * Reading Depth — the data-completeness signal.
 *
 * Renders as a hairline meter + italic serif line. Never displays a
 * percentage number. Two variants:
 *   - landing  → just the meter + line + optional row-link to the
 *                largest missing source (when depth < 0.5).
 *   - settings → adds a per-source breakdown (intake · catchups ·
 *                sessions · connections) and the explainer paragraph.
 */
export default function DepthMeter(props: DepthMeterProps) {
  const band: DepthBand = depthBand(props.depth);
  const pctWidth = `${Math.max(0, Math.min(1, props.depth)) * 100}%`;

  return (
    <Reveal as="div" className="depth-meter">
      <Eyebrow>READING DEPTH</Eyebrow>
      <div
        className="depth-meter-track"
        role="meter"
        aria-label="Reading depth"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={props.depth}
        aria-valuetext={depthLines[band]}
      >
        <span
          className="depth-meter-fill"
          style={
            { ["--depth-w" as string]: pctWidth } as React.CSSProperties
          }
        />
      </div>
      <p className="depth-meter-line">{depthLines[band]}</p>

      {props.variant === "landing" && props.prompt && props.depth < 0.5 ? (
        <div className="depth-meter-prompt">
          <Link href={props.prompt.href} className="auth-rowlink">
            <span>{props.prompt.label}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}

      {props.variant === "settings" ? (
        <>
          <div className="depth-breakdown">
            {props.breakdown.map((row) => {
              const w = `${Math.max(0, Math.min(1, row.value / row.max)) * 100}%`;
              return (
                <div key={row.label} className="depth-breakdown-row">
                  <span className="depth-breakdown-label">{row.label}</span>
                  <div className="depth-breakdown-track">
                    <span
                      className="depth-breakdown-fill"
                      style={
                        {
                          ["--breakdown-w" as string]: w,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="depth-explainer">{depthExplainer}</p>
        </>
      ) : null}
    </Reveal>
  );
}

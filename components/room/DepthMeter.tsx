import Link from "next/link";
import type { ReactNode } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import {
  depthLines,
  depthExplainer,
  depthSourceSubtitle,
  depthStatusLine,
  depthStatusWord,
  type DepthBand,
  type DepthStatus,
} from "@/lib/copy";
import {
  depthBand,
  depthStatusFromBand,
  type DepthBreakdown,
} from "@/lib/depth";

type LandingProps = {
  variant: "landing";
  depth: number;
  /** What's the largest missing source? Shown as a row-link only when depth < 0.5. */
  prompt?: { href: string; label: string } | null;
};

/**
 * One sub-block in the 2×2 Settings grid (Intake / Catchups / Sessions /
 * Connections). The parent computes a context-aware CTA and passes it in.
 */
export type DepthSubBlock = {
  source: DepthBreakdown["label"];
  /** Title rendered at the top of the block — e.g. "Your intake". */
  title: string;
  /** [0,1] completeness used for the ring fill. */
  ratio: number;
  status: DepthStatus;
  /** Short caption next to the status word — e.g. "12 / 77 answered". */
  caption?: string;
  cta: { label: string; href: string };
};

type SettingsProps = {
  variant: "settings";
  depth: number;
  /** The four sub-blocks, in display order. */
  subBlocks: DepthSubBlock[];
};

type DepthMeterProps = LandingProps | SettingsProps;

/**
 * Reading Depth — the data-completeness signal.
 *
 *   - landing  → meter + line + optional row-link to the largest
 *                missing source (when depth < 0.5).
 *   - settings → the big block on /settings: explainer paragraph at top,
 *                overall colored status + bar + italic line, then a 2×2
 *                grid of interactive sub-blocks.
 */
export default function DepthMeter(props: DepthMeterProps) {
  if (props.variant === "landing") return <LandingMeter {...props} />;
  return <SettingsBlockMeter {...props} />;
}

function LandingMeter({ depth, prompt }: LandingProps) {
  const band: DepthBand = depthBand(depth);
  const pctWidth = `${clamp01Pct(depth)}%`;

  return (
    <Reveal as="div" className="depth-meter">
      <Eyebrow>READING DEPTH</Eyebrow>
      <div
        className="depth-meter-track"
        role="meter"
        aria-label="Reading depth"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={depth}
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

      {prompt && depth < 0.5 ? (
        <div className="depth-meter-prompt">
          <Link href={prompt.href} className="auth-rowlink">
            <span>{prompt.label}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}
    </Reveal>
  );
}

function SettingsBlockMeter({ depth, subBlocks }: SettingsProps) {
  const band: DepthBand = depthBand(depth);
  const status: DepthStatus = depthStatusFromBand(band);
  const pctWidth = `${clamp01Pct(depth)}%`;

  return (
    <Reveal as="div" className="depth-block">
      <p className="depth-block-intro">{depthExplainer}</p>

      <div className="depth-block-overall">
        <div className="depth-block-overall-head">
          <span className="depth-block-overall-label">OVERALL READING DEPTH</span>
          <span className="depth-status-word" data-status={status}>
            {depthStatusWord[status]}
          </span>
        </div>
        <div
          className="depth-meter-track"
          data-status={status}
          role="meter"
          aria-label="Reading depth"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={depth}
          aria-valuetext={depthStatusLine[status]}
        >
          <span
            className="depth-meter-fill"
            style={
              { ["--depth-w" as string]: pctWidth } as React.CSSProperties
            }
          />
        </div>
        <p className="depth-block-line">{depthStatusLine[status]}</p>
      </div>

      <div className="depth-sub-grid">
        {subBlocks.map((b) => (
          <SubBlockCard key={b.source} block={b} />
        ))}
      </div>
    </Reveal>
  );
}

function SubBlockCard({ block }: { block: DepthSubBlock }) {
  return (
    <article className="depth-sub-block">
      <header className="depth-sub-block-head">
        <h3 className="depth-sub-block-title">{block.title}</h3>
        <p className="depth-sub-block-subtitle">
          {depthSourceSubtitle[block.source]}
        </p>
      </header>
      <div className="depth-sub-block-body">
        <DepthRing ratio={block.ratio} status={block.status} />
        <div className="depth-sub-block-meta">
          <span
            className="depth-sub-block-status-word"
            data-status={block.status}
          >
            {depthStatusWord[block.status]}
          </span>
          {block.caption ? (
            <span className="depth-sub-block-status-caption">{block.caption}</span>
          ) : null}
        </div>
      </div>
      <CTAArrow href={block.cta.href} label={block.cta.label} />
    </article>
  );
}

function CTAArrow({ href, label }: { href: string; label: ReactNode }) {
  return (
    <Link href={href} className="depth-sub-block-cta">
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * Circular completeness ring. SVG so the color comes from the
 * data-status attribute via currentColor.
 */
export function DepthRing({
  ratio,
  status,
  size = 54,
}: {
  ratio: number;
  status: DepthStatus;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(1, ratio));
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - safe);
  return (
    <svg
      className="depth-ring"
      data-status={status}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle
        className="depth-ring-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
      />
      <circle
        className="depth-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function clamp01Pct(n: number): number {
  return Math.max(0, Math.min(1, n)) * 100;
}

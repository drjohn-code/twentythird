import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/layout/Reveal";
import { type DepthBand, type DepthStatus } from "@/lib/copy";
import {
  depthBand,
  depthStatusFromBand,
  type DepthBreakdown,
} from "@/lib/depth";

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

type DepthMeterProps = {
  variant: "settings";
  depth: number;
  /** The four sub-blocks, in display order. */
  subBlocks: DepthSubBlock[];
};

/**
 * Reading Depth — the data-completeness signal. Settings-block layout:
 * explainer paragraph at top, overall colored status + bar + italic
 * line, then a 2×2 grid of interactive sub-blocks.
 */
export default function DepthMeter(props: DepthMeterProps) {
  return <SettingsBlockMeter {...props} />;
}

async function SettingsBlockMeter({ depth, subBlocks }: DepthMeterProps) {
  const t = await getTranslations("room.depth");
  const band: DepthBand = depthBand(depth);
  const status: DepthStatus = depthStatusFromBand(band);
  const pctWidth = `${clamp01Pct(depth)}%`;

  return (
    <Reveal as="div" className="depth-block">
      <p className="depth-block-intro">{t("explainer")}</p>

      <div className="depth-block-column">
        <div className="depth-block-overall">
          <div className="depth-block-overall-head">
            <span className="depth-block-overall-label">{t("overallEyebrow")}</span>
            <span className="depth-status-word" data-status={status}>
              {t(`status.${status}`)}
            </span>
          </div>
          <div
            className="depth-meter-track"
            data-status={status}
            role="meter"
            aria-label={t("eyebrow")}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={depth}
            aria-valuetext={t(`statusLine.${status}`)}
          >
            <span
              className="depth-meter-fill"
              style={
                { ["--depth-w" as string]: pctWidth } as React.CSSProperties
              }
            />
          </div>
          <p className="depth-block-line">{t(`statusLine.${status}`)}</p>
        </div>

        <div className="depth-sub-grid">
          {subBlocks.map((b) => (
            <SubBlockCard key={b.source} block={b} />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

async function SubBlockCard({ block }: { block: DepthSubBlock }) {
  const t = await getTranslations("room.depth");
  return (
    <article className="depth-sub-block">
      <header className="depth-sub-block-head">
        <h3 className="depth-sub-block-title">{block.title}</h3>
        <p className="depth-sub-block-subtitle">{t(`source.${block.source}`)}</p>
      </header>
      <div className="depth-sub-block-body">
        <DepthRing ratio={block.ratio} status={block.status} />
        <div className="depth-sub-block-meta">
          <span
            className="depth-sub-block-status-word"
            data-status={block.status}
          >
            {t(`status.${block.status}`)}
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
 *
 * Sizing is driven by CSS (`.depth-ring { width; height }`) rather than
 * the `size` prop, so the same component works at 78px in /settings
 * and 40px in /intake. The `size` prop only controls the viewBox math
 * — the rendered pixel size follows CSS.
 *
 * Animation: the final stroke-dashoffset is exposed as a CSS custom
 * property (`--ring-offset`) and the full circumference as `--ring-c`.
 * CSS holds the ring at `--ring-c` (empty) until the parent .reveal
 * gains `.in`, at which point it transitions to `--ring-offset` once.
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
  const isEmpty = safe <= 0;
  const ringStyle = {
    ["--ring-c" as string]: `${c}`,
    ["--ring-offset" as string]: `${offset}`,
  } as React.CSSProperties;
  return (
    <svg
      className="depth-ring"
      data-status={status}
      data-empty={isEmpty ? "true" : "false"}
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={ringStyle}
    >
      <circle
        className="depth-ring-track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
      />
      {isEmpty ? null : (
        <circle
          className="depth-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
        />
      )}
    </svg>
  );
}

function clamp01Pct(n: number): number {
  return Math.max(0, Math.min(1, n)) * 100;
}

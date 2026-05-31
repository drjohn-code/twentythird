import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type BlockCardProps = {
  /** 1..6 catalogue index (rendered as "Reading 0N"). */
  index: number;
  /** Slug — used to build the /readings#<slug> deep-link. */
  slug: string;
  /** Italic subtitle — e.g. "father‑imago". Lowercase, no trailing punctuation. */
  subtitle: string;
  /** Serif italic reading — the clinical observation. Max 18 words. */
  reading: string;
  /** Serif takeaway — what to be aware of. Max 14 words. */
  takeaway: string;
  /** The per-slug diagram, pre-rendered (already wrapped in WeakDataOverlay if needed). */
  diagram: ReactNode;
};

export default async function BlockCard({
  index,
  slug,
  subtitle,
  reading,
  takeaway,
  diagram,
}: BlockCardProps) {
  const t = await getTranslations("readings");
  const num = t("card.reading", { index: String(index).padStart(2, "0") });
  return (
    <div className="block-card glass">
      <div className="block-card-head">
        <span className="block-card-num">{num}</span>
        <span className="block-card-subtitle">{subtitle}</span>
      </div>

      <p className="block-card-reading">{reading}</p>

      <hr className="hairline" aria-hidden="true" />

      <p className="block-card-takeaway">{takeaway}</p>

      <div className="block-card-diagram">{diagram}</div>

      <Link
        href={`/readings#${slug}`}
        className="block-card-trigger"
      >
        <span>{t("whatThisIs")}</span>
      </Link>
    </div>
  );
}

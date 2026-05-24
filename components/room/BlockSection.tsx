import type { ReactNode } from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";

type BlockSectionProps = {
  /** 1..6 catalogue index. Used in the eyebrow ("READING 04 · ..."). */
  index: number;
  /** Slug — also the section anchor id, matches /readings#<slug>. */
  slug: string;
  /** Italic subtitle inside the headline. Lowercase, no trailing punctuation. */
  subtitle: string;
  /** Plain serif definition of the clinical term (2–3 sentences). */
  definition: string;
  /** 3–4 short serif sentences — the reading lede specific to the user. */
  readingLede: string[];
  /** When true, render the "see in case file →" row-link (omit on first visit). */
  hasPriorReadings?: boolean;
  /** The figure pattern on the opposite side. */
  figure: ReactNode;
};

/**
 * One reading on /readings — split-row with copy + figure, alternating
 * reverse based on parity of `index`. The `split-section` class lets
 * the inner figure bars / meters fill when the section reveals.
 */
export default function BlockSection({
  index,
  slug,
  subtitle,
  definition,
  readingLede,
  hasPriorReadings,
  figure,
}: BlockSectionProps) {
  const reverse = index % 2 === 0;

  return (
    <>
      <Hairline />
      <Reveal
        as="section"
        className={`split-section reading-section${reverse ? " reverse" : ""}`}
      >
        <div
          id={slug}
          className={`split-row reading-row${reverse ? " reverse" : ""}`}
        >
          <div className="split-copy reading-copy">
            <Eyebrow>
              READING {String(index).padStart(2, "0")} · {subtitle.toUpperCase()}
            </Eyebrow>
            <h2 className="reading-h2">
              <span className="it">{subtitle}.</span>
            </h2>
            <p className="reading-defn">{definition}</p>
            <div className="reading-lede">
              {readingLede.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {hasPriorReadings ? (
              <RowLink href={`/case-file?filter=readings#${slug}`}>
                see in case file
              </RowLink>
            ) : null}
          </div>
          <div className="reading-figure">{figure}</div>
        </div>
      </Reveal>
    </>
  );
}

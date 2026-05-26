import Link from "next/link";
import { DepthRing } from "@/components/room/DepthMeter";
import { depthStatusWord } from "@/lib/copy";
import {
  titleForStep,
  subtitleForStep,
  type StepCompletion,
} from "@/lib/intake/answers";

type Props = {
  completions: StepCompletion[];
};

/**
 * The 10-block grid that replaces the long flat list of intake
 * questions. Each block summarizes one step (Origins, Attachment,
 * …) with a completion ring and a "Review & edit" CTA that routes
 * to /intake/[step].
 */
export default function IntakeBlocksGrid({ completions }: Props) {
  return (
    <div className="intake-blocks-shell">
      <div className="intake-blocks-grid">
        {completions.map((c) => {
          const title = titleForStep(c.step);
          const subtitle = subtitleForStep(c.step);
          const caption =
            c.total > 0 ? `${c.answered} / ${c.total}` : "0 / 0";
          return (
            <article key={c.step.number} className="intake-block">
              <span className="intake-block-number">
                {String(c.step.number).padStart(2, "0")}
              </span>
              <h3 className="intake-block-title">{title}</h3>
              <p className="intake-block-subtitle">{subtitle}</p>
              <div className="intake-block-body">
                <DepthRing ratio={c.ratio} status={c.status} size={40} />
                <div className="depth-sub-block-meta">
                  <span
                    className="intake-block-status"
                    data-status={c.status}
                  >
                    {depthStatusWord[c.status]}
                  </span>
                  <span className="depth-sub-block-status-caption">
                    {caption}
                  </span>
                </div>
              </div>
              <Link
                href={`/intake/${c.step.slug}`}
                className="intake-block-cta"
              >
                <span>Review &amp; edit</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

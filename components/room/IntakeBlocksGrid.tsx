import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DepthRing } from "@/components/room/DepthMeter";
import { type StepCompletion } from "@/lib/intake/answers";

type Props = {
  completions: StepCompletion[];
};

/**
 * The 10-block grid that replaces the long flat list of intake
 * questions. Each block summarizes one step (Origins, Attachment,
 * …) with a completion ring and a "Review & edit" CTA that routes
 * to /intake/[step].
 */
export default async function IntakeBlocksGrid({ completions }: Props) {
  const t = await getTranslations("room");
  const ti = await getTranslations("intake");
  return (
    <div className="intake-blocks-shell">
      <div className="intake-blocks-grid">
        {completions.map((c) => {
          const title = ti(`steps.${c.step.slug}.title`);
          const subtitle = ti(`steps.${c.step.slug}.subtitle`);
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
                    {t(`depth.status.${c.status}`)}
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
                <span>{t("reviewEdit")}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

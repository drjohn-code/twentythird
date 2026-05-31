import { getTranslations } from "next-intl/server";
import { sayItAffordance } from "@/lib/copy";

// Static visual preview of SessionView for the /room landing teaser.
// No state, no handlers, no SSE — purely presentational.
export default async function SessionPreview() {
  const t = await getTranslations("consulting");
  const topics = [
    t("previewTopicDreamingFuture"),
    t("previewTopicNightDream"),
    t("previewTopicRelations"),
    t("previewTopicProfessionalGrowth"),
  ];

  return (
    <div className="session-preview" aria-hidden="true">
      <p className="session-preview-held">
        &ldquo;{t("previewHeld")}&rdquo;
      </p>

      <ul className="session-preview-topics">
        {topics.map((t, i) => (
          <li key={t}>
            <div
              className={
                "session-preview-topic-row" +
                (i === 1 ? " is-selected" : "")
              }
            >
              <span>{t}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="session-preview-transcript">
        <p className="session-preview-turn session-preview-turn-analyst">
          {t.rich("previewTurnAnalyst1", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </p>
        <p className="session-preview-turn session-preview-turn-user">
          {t("previewTurnUser1")}
        </p>
        <p className="session-preview-turn session-preview-turn-analyst">
          {t.rich("previewTurnAnalyst2", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </p>
      </div>

      <div className="session-preview-input-row">
        <span className="session-preview-input">{t("sayItEllipsis")}</span>
        <span className="session-preview-say">{sayItAffordance}</span>
      </div>
    </div>
  );
}

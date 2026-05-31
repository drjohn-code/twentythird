import { getTranslations } from "next-intl/server";
import FigureCard from "@/components/figures/FigureCard";

// ────────────────────────────────────────────────────────────────────
// ConsultingPreview — the transcript figure shown to unsubscribed
// users on /consulting. Two halves inside one FigureCard:
//
//   • Left rail — six "areas" the analyst is reading from, each with
//     two italic case-file snippets so the rail reads as a record,
//     not nav. The Partner area is marked active.
//
//   • Right column — a chat-style transcript. User turns sit in glass
//     bubbles with a YOU mono label; analyst turns are plain serif
//     paragraphs with an ANALYST mono label. Both align left. The
//     asymmetry — user in a bubble, analyst on the page — is the
//     design tell. The middle analyst reply references the intimacy
//     threshold reading from week 04 — that is the proof-of-memory
//     beat. A decorative "say it…" input sits below the transcript;
//     it is a <div>, not a form, and is aria-hidden.
//
// This chat-bubble grammar is local to this preview only. The live
// SessionView keeps its own transcript rules.
// ────────────────────────────────────────────────────────────────────

// decorative — preview only, not tied to block_readings
type Snippet = { wk: string; text: string };
type Area = { title: string; active?: boolean; snippets: [Snippet, Snippet] };

const AREAS: Area[] = [
  {
    title: "Family",
    snippets: [
      { wk: "WK 06", text: "the mother’s silence as a kind of instruction…" },
      { wk: "WK 02", text: "father came up unprompted, again…" },
    ],
  },
  {
    title: "Partner",
    active: true,
    snippets: [
      { wk: "WK 04", text: "the week-they-get-serious pattern surfaced…" },
      { wk: "WK 03", text: "“I just woke up and knew” — a verdict, not a trial…" },
    ],
  },
  {
    title: "Work",
    snippets: [
      { wk: "WK 05", text: "the promotion as exposure, not reward…" },
      { wk: "WK 01", text: "imposter language softened slightly…" },
    ],
  },
  {
    title: "Dream",
    snippets: [
      { wk: "WK 04", text: "recurring house dream, doors locked from inside…" },
      { wk: "WK 02", text: "the dream of being told to leave…" },
    ],
  },
  {
    title: "Friends",
    snippets: [
      { wk: "WK 06", text: "withdrawal noted around close friends too…" },
      { wk: "WK 03", text: "keeps the count of confidants low…" },
    ],
  },
  {
    title: "Self",
    snippets: [
      { wk: "WK 05", text: "the “I don’t know” as a structural refusal…" },
      { wk: "WK 02", text: "still calls it “the thing I do”…" },
    ],
  },
];

export default async function ConsultingPreview() {
  const t = await getTranslations("consulting");
  return (
    <FigureCard
      label={t("previewFigureLabel")}
      subtitle={t("previewFigureSubtitle")}
      fig="Fig. 08"
      className="consulting-preview-figure"
    >
      <div className="consulting-preview-grid">
        <aside
          className="consulting-preview-rail"
          aria-label={t("previewRailAria")}
        >
          <p className="consulting-preview-rail-eyebrow">{t("previewReadingFrom")}</p>
          <ul className="consulting-preview-rail-list">
            {AREAS.map(({ title, active, snippets }) => (
              <li
                key={title}
                className={
                  "consulting-preview-rail-row" +
                  (active ? " is-active" : "")
                }
              >
                <div className="consulting-preview-rail-head">
                  <span className="consulting-preview-rail-label">{title}</span>
                  {active ? (
                    <span
                      className="consulting-preview-rail-dot"
                      aria-label={t("previewActive")}
                    />
                  ) : null}
                </div>
                <div className="consulting-preview-rail-snippets">
                  {snippets.map((s, i) => (
                    <p key={i} className="consulting-preview-rail-snippet">
                      <span className="consulting-preview-rail-wk">{s.wk}</span>
                      <span className="consulting-preview-rail-snippet-text">
                        {" · "}
                        {s.text}
                      </span>
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="consulting-preview-main">
          <p className="consulting-preview-held">
            &ldquo;{t("previewHeld")}&rdquo;
          </p>

          <div className="consulting-preview-turns">
            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleYou")}</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  {t("previewBubble1")}
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleAnalyst")}</span>
              <p className="consulting-preview-analyst">
                {t.rich("previewAnalyst1", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
              </p>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleYou")}</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  {t("previewBubble2")}
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleAnalyst")}</span>
              <p className="consulting-preview-analyst">
                {t.rich("previewAnalyst2", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleYou")}</span>
              <div className="consulting-preview-bubble glass">
                <p className="consulting-preview-bubble-text">
                  {t("previewBubble3")}
                </p>
              </div>
            </div>

            <div className="consulting-preview-turn">
              <span className="consulting-preview-role-label">{t("previewRoleAnalyst")}</span>
              <p className="consulting-preview-analyst">
                {t.rich("previewAnalyst3", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
              </p>
            </div>
          </div>

          <div className="consulting-preview-faux-input" aria-hidden="true">
            <span className="consulting-preview-faux-input-prompt">
              {t("sayItEllipsis")}
            </span>
            <span className="consulting-preview-faux-input-affordance">
              {t("sayIt")}
            </span>
          </div>
        </div>
      </div>

      <p className="consulting-preview-mark">
        {t("previewExampleMark")}
      </p>
    </FigureCard>
  );
}

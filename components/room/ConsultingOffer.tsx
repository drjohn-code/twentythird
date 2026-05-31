import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Pill from "@/components/ui/Pill";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import ConsultingPreview from "@/components/room/ConsultingPreview";

// ────────────────────────────────────────────────────────────────────
// ConsultingOffer — the full unsubscribed page body for /consulting.
// Eyebrow → headline → lede → printed sitting → "what a session does"
// panels → centered footer (closing clinical line above the inverted
// Pill, with a RowLink back to /room beneath it).
//
// Subscribed users skip this entirely — see app/(room)/consulting/page.tsx.
// ────────────────────────────────────────────────────────────────────

export default async function ConsultingOffer() {
  const t = await getTranslations("consulting");
  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="consulting-offer-h">
        {t("offerHeadline")}<span className="it">.</span>
      </h1>
      <p className="consulting-offer-lede">
        {t("offerLede")}
      </p>

      <ConsultingPreview />

      <Hairline className="consulting-preview-divider" />

      <div className="consulting-offer-panels" aria-label={t("offerPanelsAria")}>
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">{t("offerPanel1Title")}</p>
          <p className="consulting-offer-panel-body">
            {t("offerPanel1Body")}
          </p>
        </article>
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">{t("offerPanel2Title")}</p>
          <p className="consulting-offer-panel-body">
            {t("offerPanel2Body")}
          </p>
        </article>
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">{t("offerPanel3Title")}</p>
          <p className="consulting-offer-panel-body">
            {t("offerPanel3Body")}
          </p>
        </article>
      </div>

      <div className="consulting-offer-footer">
        <p className="consulting-offer-foot-line">
          {t("offerFootLine")}
        </p>
        <Pill href="/subscribe/confirm" arrow className="consulting-offer-pill">
          {t("offerPillCta")}
        </Pill>
        <RowLink href="/room">{t("offerReturnToRoom")}</RowLink>
      </div>
    </Reveal>
  );
}

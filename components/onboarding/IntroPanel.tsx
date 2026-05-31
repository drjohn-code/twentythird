import { getTranslations } from "next-intl/server";
import Glass from "@/components/ui/Glass";
import CTA from "@/components/ui/CTA";
import SaveExitModalTrigger from "@/components/onboarding/SaveExitModal";
import { INTAKE_INTRO_PATH } from "@/lib/onboarding/routing";

/** Screen 2 — the long-form brief panel before step 1. */
export default async function IntroPanel() {
  const t = await getTranslations("onboarding");
  return (
    <Glass className="intro-panel">
      <div className="vh">
        <span className="lhs">
          <span>{t("brief.title")}</span> <em>{t("brief.hint")}</em>
        </span>
        <span className="mono">Fig. 00</span>
      </div>
      <div className="intro-body">
        <p className="intro-opener serif-i">
          {t("brief.opener")}
        </p>
        <p className="intro-graf">
          {t("brief.privacy")}
        </p>
        <p className="intro-graf">
          {t("brief.length")}
        </p>
        <p className="intro-graf">
          {t("brief.resume")}
        </p>
      </div>
      <div className="intro-divider" aria-hidden="true" />
      <div className="intro-actions">
        <CTA href={`${INTAKE_INTRO_PATH}/1`}>{t("brief.begin")}</CTA>
        <SaveExitModalTrigger />
      </div>
    </Glass>
  );
}

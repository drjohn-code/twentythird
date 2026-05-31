import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import RetryReadingButton from "@/components/dashboard/RetryReadingButton";

export default async function IntakeFailedState() {
  const t = await getTranslations("room");
  return (
    <main className="dashboard-shell">
      <Reveal as="section" className="dashboard-head">
        <Eyebrow>{t("intake.failed.eyebrow")}</Eyebrow>
        <h1 className="serif dashboard-headline">
          {t.rich("intake.failed.headline", {
            em: (chunks) => <em>{chunks}</em>,
          })}
        </h1>
        <p className="dashboard-lede">{t("intake.failed.lede")}</p>
      </Reveal>

      <div className="dashboard-cta">
        <RetryReadingButton />
      </div>
    </main>
  );
}

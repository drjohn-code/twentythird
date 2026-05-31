import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import IntakeBlocksGrid from "@/components/room/IntakeBlocksGrid";
import {
  buildIntakeAnswers,
  computeStepCompletions,
  type IntakeAnswerRow,
  type IntakeResponseRow,
} from "@/lib/intake/answers";

// /intake — the redesigned intake landing.
// Ten small topic blocks instead of one long list. Each block shows
// completion at a glance and routes to its own per-step editor.

export default async function IntakeBlocksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [responsesRes, answersRes] = await Promise.all([
    supabase
      .from("intake_responses")
      .select("step_number, payload")
      .eq("user_id", user.id),
    supabase
      .from("intake_answers")
      .select("question_key, answer, version")
      .eq("user_id", user.id)
      .order("version", { ascending: false }),
  ]);

  const items = buildIntakeAnswers(
    (responsesRes.data as IntakeResponseRow[] | null) ?? [],
    (answersRes.data as IntakeAnswerRow[] | null) ?? [],
  );
  const completions = computeStepCompletions(items);
  const t = await getTranslations("room");

  return (
    <>
      <Reveal as="section" className="room-section settings-head">
        <Eyebrow>{t("intake.index.eyebrow")}</Eyebrow>
        <h1 className="settings-h">
          {t.rich("intake.index.title", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
        </h1>
        <p className="lede settings-lede">{t("intake.index.lede")}</p>
      </Reveal>

      <IntakeBlocksGrid completions={completions} />

      <Hairline />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import IntakeAnswersList from "@/components/room/IntakeAnswersList";
import { STEPS } from "@/lib/onboarding/steps";
import {
  buildIntakeAnswers,
  type IntakeAnswerRow,
  type IntakeResponseRow,
} from "@/lib/intake/answers";

// /intake/[slug] — per-step editor. Filtered view of the same
// IntakeAnswersList used previously, scoped to one of the ten steps.

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function IntakeStepPage({ params }: Props) {
  const { slug } = await params;
  const step = STEPS.find((s) => s.slug === slug);
  if (!step) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [responsesRes, answersRes] = await Promise.all([
    supabase
      .from("intake_responses")
      .select("step_number, payload")
      .eq("user_id", user.id)
      .eq("step_number", step.number),
    supabase
      .from("intake_answers")
      .select("question_key, answer, version")
      .eq("user_id", user.id)
      .order("version", { ascending: false }),
  ]);

  const allItems = buildIntakeAnswers(
    (responsesRes.data as IntakeResponseRow[] | null) ?? [],
    (answersRes.data as IntakeAnswerRow[] | null) ?? [],
  );
  const items = allItems.filter((i) => i.stepNumber === step.number);
  const t = await getTranslations("room");
  const ti = await getTranslations("intake");

  return (
    <>
      <Reveal as="section" className="room-section settings-head">
        <Eyebrow>
          {t("intake.step.eyebrow")} · {String(step.number).padStart(2, "0")}
        </Eyebrow>
        <h1 className="settings-h">
          {ti(`steps.${step.slug}.title`)}
          <span className="it">.</span>
        </h1>
        <p className="lede settings-lede">{ti(`steps.${step.slug}.lede`)}</p>
        <p className="depth-block-intro">
          <Link href="/intake" className="auth-rowlink">
            <span>{t("intake.step.backToAll")}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </p>
      </Reveal>

      <IntakeAnswersList items={items} />

      <Hairline />
    </>
  );
}

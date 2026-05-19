import Reveal from "@/components/layout/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import StepProgress from "@/components/onboarding/StepProgress";
import StepForm from "@/components/onboarding/StepForm";
import { TOTAL_STEPS } from "@/lib/onboarding/steps";
import type { StepDef, StepPayload } from "@/lib/types/intake";

type StepShellProps = {
  step: StepDef;
  initialPayload: StepPayload;
  completedThrough: number;
};

/** Two-column chrome around a single step. Server-rendered shell + client form island. */
export default function StepShell({
  step,
  initialPayload,
  completedThrough,
}: StepShellProps) {
  const isLast = step.number === TOTAL_STEPS;

  return (
    <main className="step-shell">
      <div className="step-shell-mobile-progress">
        <span className="mono">
          STEP {String(step.number).padStart(2, "0")} / {TOTAL_STEPS} ·{" "}
          {topicFromEyebrow(step.eyebrow)}
        </span>
        <div className="step-shell-mobile-bar" aria-hidden="true">
          <div
            className="step-shell-mobile-bar-fill"
            style={{
              width: `${Math.min(
                100,
                ((completedThrough + 0.4) / TOTAL_STEPS) * 100,
              ).toFixed(2)}%`,
            }}
          />
        </div>
      </div>

      <div className="step-shell-grid">
        <aside className="step-shell-side">
          <StepProgress
            current={step.number}
            completedThrough={completedThrough}
          />
          <div className="step-shell-side-meta mono">
            STEP {String(step.number).padStart(2, "0")} OF {TOTAL_STEPS} ·{" "}
            ~{step.estMinutes} MIN
          </div>
        </aside>

        <Reveal as="section" className="step-shell-content">
          <Eyebrow className="step-eyebrow">{step.eyebrow}</Eyebrow>
          <h2
            className={[
              "serif step-headline",
              isLast ? "is-final" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {step.headline.map((seg, i) =>
              seg.italic ? (
                <em key={i}>{seg.text}</em>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </h2>
          {isLast ? (
            <p className="step-epigraph serif-i">
              the last question is always the first one again.
            </p>
          ) : null}
          <p className="step-lede">{step.lede}</p>

          <StepForm
            step={step}
            initialPayload={initialPayload}
            isLast={isLast}
          />
        </Reveal>
      </div>
    </main>
  );
}

function topicFromEyebrow(eyebrow: string): string {
  const parts = eyebrow.split("·").map((s) => s.trim());
  return parts[1] ?? "";
}

import { STEPS, TOTAL_STEPS } from "@/lib/onboarding/steps";

type StepProgressProps = {
  current: number;
  completedThrough: number;
};

/**
 * Vertical column of 10 rows. Above 980px renders as the side rail;
 * below, the parent flips this into a single horizontal mono row via
 * the .step-progress.is-mobile selector.
 */
export default function StepProgress({
  current,
  completedThrough,
}: StepProgressProps) {
  return (
    <ol className="step-progress" aria-label="Intake progress">
      {STEPS.map((step) => {
        const isDone = step.number <= completedThrough;
        const isActive = step.number === current;
        return (
          <li
            key={step.number}
            className={[
              "step-progress-row",
              isDone ? "is-done" : null,
              isActive ? "is-active" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="step-progress-num mono">
              {String(step.number).padStart(2, "0")} / {TOTAL_STEPS}
            </span>
            <span className="step-progress-bar" aria-hidden="true">
              <span className="step-progress-bar-fill" />
            </span>
            {isActive ? (
              <span className="step-progress-title serif">
                {sectionTitle(step.eyebrow)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** "SECTION 03 · AUTHORITY · SYMBOLIC LAW" → "Authority" */
function sectionTitle(eyebrow: string): string {
  const parts = eyebrow.split("·").map((s) => s.trim());
  const name = parts[1] ?? "";
  if (!name) return "";
  return name.charAt(0) + name.slice(1).toLowerCase();
}

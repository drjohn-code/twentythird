import Glass from "@/components/ui/Glass";
import CTA from "@/components/ui/CTA";
import SaveExitModalTrigger from "@/components/onboarding/SaveExitModal";
import { INTAKE_INTRO_PATH } from "@/lib/onboarding/routing";

/** Screen 2 — the long-form brief panel before step 1. */
export default function IntroPanel() {
  return (
    <Glass className="intro-panel">
      <div className="vh">
        <span className="lhs">
          <span>THE BRIEF</span> <em>read once, then begin</em>
        </span>
        <span className="mono">Fig. 00</span>
      </div>
      <div className="intro-body">
        <p className="intro-opener serif-i">
          The wrong answers — the hesitations, the typos, the skips —
          speak as clearly as the right ones.
        </p>
        <p className="intro-graf">
          Everything you write is private. Nothing leaves this room.
        </p>
        <p className="intro-graf">
          Because the work is deep, the intake is long. We have split
          it into ten parts. The whole thing takes about two hours.
        </p>
        <p className="intro-graf">
          Save and continue another day. Edit any section after you
          finish it — the profile keeps listening.
        </p>
      </div>
      <div className="intro-divider" aria-hidden="true" />
      <div className="intro-actions">
        <CTA href={`${INTAKE_INTRO_PATH}/1`}>Begin intake</CTA>
        <SaveExitModalTrigger />
      </div>
    </Glass>
  );
}

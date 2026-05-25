import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/layout/Reveal";
import RetryReadingButton from "@/components/dashboard/RetryReadingButton";

export default function IntakeFailedState() {
  return (
    <main className="dashboard-shell">
      <Reveal as="section" className="dashboard-head">
        <Eyebrow>INTAKE — INCOMPLETE</Eyebrow>
        <h1 className="serif dashboard-headline">
          The reading was <em>not completed</em>.
        </h1>
        <p className="dashboard-lede">
          Your intake is on file. The analysis that follows it did not
          finish.
        </p>
      </Reveal>

      <div className="dashboard-cta">
        <RetryReadingButton />
      </div>
    </main>
  );
}

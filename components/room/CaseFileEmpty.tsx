import Pill from "@/components/ui/Pill";

type CaseFileEmptyProps = {
  /** Italic serif line. Wording differs per active tab. */
  text: string;
  /** Optional CTA below the text. Omit for tabs that do not get a button (reports). */
  cta?: { label: string; href: string };
};

/**
 * Centered empty-state block for the Case File tabs. Renders the italic
 * line and (optionally) a single Pill CTA inside a comfortable vertical
 * container — not full-viewport, just enough that the text does not feel
 * pinned to the top of the page.
 */
export default function CaseFileEmpty({ text, cta }: CaseFileEmptyProps) {
  return (
    <div className="case-file-empty-block">
      <p className="case-file-empty">{text}</p>
      {cta ? (
        <Pill href={cta.href} arrow>
          {cta.label}
        </Pill>
      ) : null}
    </div>
  );
}

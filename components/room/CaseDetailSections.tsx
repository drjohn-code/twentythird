// Two-section detail view: summary of the user's answers + a single
// recommendation. Used by both the server-cached path (page) and the
// client generator (after lazy generation). Hairline-divided to match
// the rest of the case-file surface.
//
// Italic phrases in the model output are written as Markdown *like
// this*. We render them as <em> spans, plain text otherwise — no
// dependency on a markdown library.

type Detail = { summary: string; recommendation: string };

type Props = { detail: Detail };

export default function CaseDetailSections({ detail }: Props) {
  return (
    <div className="case-file-detail">
      <section className="case-file-detail-section">
        <div className="eyebrow">SUMMARY · USER ANSWERS</div>
        <p className="case-file-detail-body">{renderItalics(detail.summary)}</p>
      </section>
      <section className="case-file-detail-section">
        <div className="eyebrow">RECOMMENDATION</div>
        <p className="case-file-detail-body">
          {renderItalics(detail.recommendation)}
        </p>
      </section>
    </div>
  );
}

// Minimal *italic* → <em> pass. Splits on `*…*`, treats matched pairs
// as italic, leaves stray asterisks alone. Good enough for the
// analyst-voice convention (Markdown italics for the half-said).
function renderItalics(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

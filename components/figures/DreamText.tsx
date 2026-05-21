import type { ReactNode } from "react";

type DreamTextProps = {
  paragraphs: ReactNode[];
};

export default function DreamText({ paragraphs }: DreamTextProps) {
  return (
    <div className="dream-text">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

type AnnProps = {
  n: string;
  children: ReactNode;
};

export function Ann({ n, children }: AnnProps) {
  return (
    <span className="ann">
      <sup>{n}</sup>
      {children}
    </span>
  );
}

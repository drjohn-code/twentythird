import type { ReactNode } from "react";
import FigureCard from "@/components/figures/FigureCard";
import WeakDataOverlay from "./WeakDataOverlay";
import LoopCycle from "./diagrams/LoopCycle";
import LinguisticMarkers from "./diagrams/LinguisticMarkers";
import AuthorityAxis from "./diagrams/AuthorityAxis";
import ThresholdGraph from "./diagrams/ThresholdGraph";
import DesireBars from "./diagrams/DesireBars";
import DefenceLadder from "./diagrams/DefenceLadder";
import type { DiagramInput } from "@/lib/structures";

type ReadingDiagramProps = {
  input: DiagramInput;
  /** "card" sits inline in a BlockCard; "section" wraps in FigureCard. */
  size: "card" | "section";
};

type CardMeta = { label: string; subtitle: string; fig: string };

const CARD_META: Record<DiagramInput["slug"], CardMeta> = {
  "subconscious-loops": {
    label: "LOOP",
    subtitle: "recurrence cycle",
    fig: "Fig. 01",
  },
  "linguistic-unconscious": {
    label: "MARKERS",
    subtitle: "speech sample",
    fig: "Fig. 02",
  },
  "father-imago": {
    label: "AXIS",
    subtitle: "authority position",
    fig: "Fig. 03",
  },
  "intimacy-threshold": {
    label: "ATTACHMENT",
    subtitle: "anxiety · avoidance",
    fig: "Fig. 04",
  },
  "desire-structure": {
    label: "DESIRE",
    subtitle: "want · ought · forbidden",
    fig: "Fig. 05",
  },
  "professional-block": {
    label: "DEFENCES",
    subtitle: "vaillant hierarchy",
    fig: "Fig. 06",
  },
};

function diagramFor(input: DiagramInput, size: "card" | "section"): ReactNode {
  switch (input.slug) {
    case "subconscious-loops":
      return <LoopCycle nodes={input.nodes} size={size} />;
    case "linguistic-unconscious":
      return <LinguisticMarkers markers={input.markers} size={size} />;
    case "father-imago":
      return <AuthorityAxis position={input.position} size={size} />;
    case "intimacy-threshold":
      return (
        <ThresholdGraph
          anxiety={input.anxiety}
          avoidance={input.avoidance}
          size={size}
        />
      );
    case "desire-structure":
      return (
        <DesireBars
          wantTo={input.wantTo}
          oughtTo={input.oughtTo}
          forbidden={input.forbidden}
          size={size}
        />
      );
    case "professional-block":
      return <DefenceLadder highlight={input.highlight} size={size} />;
  }
}

export default function ReadingDiagram({
  input,
  size,
}: ReadingDiagramProps) {
  const body = diagramFor(input, size);
  const wrapped = input.isBlurred ? (
    <WeakDataOverlay>{body}</WeakDataOverlay>
  ) : (
    body
  );

  if (size === "section") {
    const meta = CARD_META[input.slug];
    return (
      <FigureCard
        label={meta.label}
        subtitle={meta.subtitle}
        fig={meta.fig}
      >
        {wrapped}
      </FigureCard>
    );
  }

  // "card" size — no FigureCard, just the diagram inline.
  return <div className="reading-diagram-card">{wrapped}</div>;
}

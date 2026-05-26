import type { ReactNode } from "react";
import Hairline from "@/components/room/Hairline";

type SettingsBlockProps = {
  /** Plain serif title, lowercase voice — e.g. "Reading depth". */
  title: string;
  /** Optional italic line beneath the title — the analyst framing. */
  intro?: ReactNode;
  /** Anchor id for in-page navigation. */
  id?: string;
  children: ReactNode;
};

/** The section wrapper used by every block on /settings. */
export default function SettingsBlock({
  title,
  intro,
  id,
  children,
}: SettingsBlockProps) {
  return (
    <section className="settings-block" id={id}>
      <header className="settings-block-head">
        <h2 className="settings-block-h">{title}</h2>
        {intro ? <p className="settings-block-intro">{intro}</p> : null}
      </header>
      <div className="settings-block-body">{children}</div>
      <Hairline />
    </section>
  );
}

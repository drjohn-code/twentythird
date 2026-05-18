import type { ReactNode } from "react";
import LegalSidebar from "../../components/legal/LegalSidebar";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <section className="page-hero no-figure">
        <div className="container">
          <div className="eyebrow" style={{ marginBottom: "28px" }}>
            LEGAL
          </div>
          <h1>
            Legal documents, <em className="it">stated plainly.</em>
          </h1>
          <p className="lede">
            Privacy policy, terms of service, and cookie policy — governed by
            Swedish law and the GDPR.
          </p>
        </div>
      </section>

      <div className="legal-body">
        <div className="container">
          <div className="legal-grid">
            <LegalSidebar />
            <div className="legal-content">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

import Eyebrow from "@/components/ui/Eyebrow";
import Pill from "@/components/ui/Pill";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import ConsultingPreview from "@/components/room/ConsultingPreview";

// ────────────────────────────────────────────────────────────────────
// ConsultingOffer — the full unsubscribed page body for /consulting.
// Eyebrow → headline → lede → printed sitting → "what a session does"
// panels → centered footer (closing clinical line above the inverted
// Pill, with a RowLink back to /room beneath it).
//
// Subscribed users skip this entirely — see app/(room)/consulting/page.tsx.
// ────────────────────────────────────────────────────────────────────

export default function ConsultingOffer() {
  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>CONSULTING ROOM</Eyebrow>
      <h1 className="consulting-offer-h">
        The consulting room<span className="it">.</span>
      </h1>
      <p className="consulting-offer-lede">
        A long-form sitting with the analyst, held in the same voice as your
        readings. Sessions are private, kept in the case file, and feed the
        readings between sittings.
      </p>

      <ConsultingPreview />

      <Hairline className="consulting-preview-divider" />

      <div className="consulting-offer-panels" aria-label="what a session does">
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">named, not narrated</p>
          <p className="consulting-offer-panel-body">
            The analyst will name what&rsquo;s happening in your speech — the
            slip, the qualifier, the half-said — and hold it there until you
            can see it.
          </p>
        </article>
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">kept in the case file</p>
          <p className="consulting-offer-panel-body">
            Every sitting is written down. The next reading reads it. Patterns
            surface across weeks, not turns.
          </p>
        </article>
        <article className="consulting-offer-panel glass">
          <p className="consulting-offer-panel-title">one voice, no roster</p>
          <p className="consulting-offer-panel-body">
            Not a chatbot rotation. A single analytic voice, trained on your
            intake and refined by every catchup.
          </p>
        </article>
      </div>

      <div className="consulting-offer-footer">
        <p className="consulting-offer-foot-line">
          Subscribers receive one clinical report each month.
        </p>
        <Pill href="/subscribe/confirm" arrow className="consulting-offer-pill">
          Enter the consulting room
        </Pill>
        <RowLink href="/room">return to the room</RowLink>
      </div>
    </Reveal>
  );
}

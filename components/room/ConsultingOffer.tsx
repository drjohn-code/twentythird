import Eyebrow from "@/components/ui/Eyebrow";
import Pill from "@/components/ui/Pill";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import Hairline from "@/components/room/Hairline";
import ConsultingPreview from "@/components/room/ConsultingPreview";

// ────────────────────────────────────────────────────────────────────
// ConsultingOffer — the full unsubscribed page body for /consulting.
// Eyebrow → headline → lede → printed sitting → what a session does →
// what is included → "subscribers receive…" line → centered footer
// (inverted Pill above a RowLink back to /room).
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

      <Hairline className="consulting-preview-divider" />

      <ul
        className="consulting-offer-list"
        aria-label="what the subscription includes"
      >
        <li className="consulting-offer-list-row">
          <span className="consulting-offer-list-left">
            unlimited sittings with the analyst
          </span>
          <span className="consulting-offer-list-right">INCLUDED</span>
        </li>
        <li className="consulting-offer-list-row">
          <span className="consulting-offer-list-left">
            one clinical report each month
          </span>
          <span className="consulting-offer-list-right">
            INCLUDED · 12–18 PAGES
          </span>
        </li>
        <li className="consulting-offer-list-row">
          <span className="consulting-offer-list-left">
            up to two named connections
          </span>
          <span className="consulting-offer-list-right">INCLUDED</span>
        </li>
        <li className="consulting-offer-list-row">
          <span className="consulting-offer-list-left">
            the case file, kept always
          </span>
          <span className="consulting-offer-list-right">YOURS · ALWAYS</span>
        </li>
      </ul>

      <p className="consulting-offer-lede consulting-offer-lede-second">
        Subscribers receive one clinical report each month.
      </p>

      <div className="consulting-offer-footer">
        <Pill href="/subscribe/confirm" arrow className="consulting-offer-pill">
          Enter the consulting room
        </Pill>
        <RowLink href="/room">return to the room</RowLink>
      </div>
    </Reveal>
  );
}

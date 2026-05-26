import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import { effectiveConnectionsLimit } from "@/lib/connections";

// ────────────────────────────────────────────────────────────────────
// /subscribe/confirm
//
// The one and only file under app/(room) where the subscription price
// string is allowed to appear (€23.23). Pricing on a button is
// forbidden by the build prompt; here it is clinical context.
//
// Submits via a real <form method="POST"> so a bot or stale link
// cannot start a checkout — the user has to press the button.
// ────────────────────────────────────────────────────────────────────

type Search = { canceled?: string };

export default async function SubscribeConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const canceled = sp.canceled === "1";
  const subscriberLimit = effectiveConnectionsLimit(true);

  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>CONSULTING ROOM · CONFIRM</Eyebrow>
      <h1 className="consulting-offer-h">
        Entry to the consulting room<span className="it">.</span>
      </h1>
      <p className="consulting-offer-lede">
        The subscription is <span className="serif-i">€23.23 a month</span>.
        It includes the consulting room, the ability to invite up to{" "}
        {subscriberLimit} connections, and one clinical report each calendar
        month.
      </p>
      <p className="consulting-offer-lede consulting-offer-lede-second">
        Billing is handled by Stripe. Cancel at any time from settings —
        access continues until the period ends.
      </p>

      {canceled ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          <span className="serif-i">checkout was closed.</span> nothing was
          charged. you can return below when you are ready.
        </p>
      ) : null}

      <form
        method="POST"
        action="/api/stripe/checkout"
        className="consulting-offer-cta"
      >
        <input type="hidden" name="kind" value="subscription" />
        <button type="submit" className="cta">
          <span>Continue to checkout</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <RowLink href="/consulting" arrow="left">
          return to the consulting room
        </RowLink>
      </form>
    </Reveal>
  );
}

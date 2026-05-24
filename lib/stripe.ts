// Stripe — server-only.
//
// Lazy singleton so the SDK isn't instantiated unless a route handler
// actually needs it. Price ids are read from env; the two visible
// price strings live in their confirmation pages only — never on a
// button, never duplicated here.
//
// import "server-only" guarantees the bundler will error if this file
// is ever pulled into a client component.

import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local before calling getStripe().",
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export const PRICE_SUBSCRIPTION = process.env.STRIPE_PRICE_SUBSCRIPTION!;
export const PRICE_REPORT = process.env.STRIPE_PRICE_REPORT!;

import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// ────────────────────────────────────────────────────────────────────
// POST /api/stripe/portal
//
// Opens a Stripe Customer Portal session for the signed-in user. The
// Settings page invokes this via a <form method="POST"> — link-style
// "manage subscription" affordance.
//
// If the user has no Stripe customer id yet (they have not subscribed
// or paid for anything), redirect back to the consulting offer.
// ────────────────────────────────────────────────────────────────────

type SubscriptionRow = {
  stripe_customer_id: string | null;
};

function siteOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL("/auth/sign-in", siteOrigin(request));
    url.searchParams.set("next", "/settings");
    return NextResponse.redirect(url, 303);
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();

  const customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const url = new URL("/consulting", siteOrigin(request));
    return NextResponse.redirect(url, 303);
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteOrigin(request)}/settings`,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown stripe error";
    return NextResponse.json(
      { error: `could not open the billing portal — ${message}` },
      { status: 500 },
    );
  }
}

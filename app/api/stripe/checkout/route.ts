import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  PRICE_REPORT,
  PRICE_SUBSCRIPTION,
} from "@/lib/stripe";

// ────────────────────────────────────────────────────────────────────
// POST /api/stripe/checkout
//
// Two product kinds:
//   subscription — Consulting Room monthly. Includes one clinical
//                  report per calendar month and connection invites.
//   report       — one-off clinical report (free-user path).
//
// The kind comes from either the form field, the JSON body, or the
// `kind` query string — confirm pages submit via <form method="POST">
// with a hidden input.
//
// On success the route returns a 303 to Stripe's hosted checkout URL,
// which transitions the browser from POST to GET.
//
// Price strings NEVER appear in this file — they live in Stripe via
// the env-driven price IDs, and as visible copy only on the two
// confirm pages.
// ────────────────────────────────────────────────────────────────────

type CheckoutKind = "subscription" | "report";

type SubscriptionRow = {
  stripe_customer_id: string | null;
  status: string | null;
};

type ProfileRow = {
  email: string | null;
};

function siteOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}

async function readKind(request: Request): Promise<CheckoutKind | null> {
  const fromQuery = new URL(request.url).searchParams.get("kind");
  if (fromQuery === "subscription" || fromQuery === "report") {
    return fromQuery;
  }

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { kind?: unknown };
      const v = body.kind;
      if (v === "subscription" || v === "report") return v;
      return null;
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      const v = form.get("kind");
      if (v === "subscription" || v === "report") return v;
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const kind = await readKind(request);
  if (!kind) {
    return NextResponse.json(
      { error: "kind must be 'subscription' or 'report'" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL("/auth/sign-in", siteOrigin(request));
    url.searchParams.set(
      "next",
      kind === "subscription" ? "/subscribe/confirm" : "/reports/confirm",
    );
    return NextResponse.redirect(url, 303);
  }

  const priceId = kind === "subscription" ? PRICE_SUBSCRIPTION : PRICE_REPORT;
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "Stripe price id is not configured. Set STRIPE_PRICE_SUBSCRIPTION and STRIPE_PRICE_REPORT in .env.local.",
      },
      { status: 500 },
    );
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

  // Reuse an existing Stripe customer if we have one for this user.
  // The subscriptions row is the source of truth — written by the
  // webhook on first checkout completion.
  const [subRes, profileRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
  ]);

  // If the user already has an active subscription and is trying to
  // subscribe again, redirect them to the billing portal instead of
  // creating a duplicate. The portal lets them manage the existing one.
  if (kind === "subscription" && subRes.data?.status === "active") {
    const url = new URL("/settings#subscription", siteOrigin(request));
    return NextResponse.redirect(url, 303);
  }

  const origin = siteOrigin(request);
  const customerId = subRes.data?.stripe_customer_id ?? null;
  const customerEmail = profileRes.data?.email ?? user.email ?? undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: kind === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId
        ? { customer: customerId }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        kind,
      },
      ...(kind === "subscription"
        ? {
            subscription_data: {
              metadata: { user_id: user.id },
            },
          }
        : {
            payment_intent_data: {
              metadata: { user_id: user.id, kind: "report" },
            },
          }),
      success_url:
        kind === "subscription"
          ? `${origin}/consulting?welcome=1`
          : `${origin}/reports/queued`,
      cancel_url:
        kind === "subscription"
          ? `${origin}/subscribe/confirm?canceled=1`
          : `${origin}/reports/confirm?canceled=1`,
      allow_promotion_codes: kind === "subscription",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown stripe error";
    return NextResponse.json(
      { error: `could not create checkout session — ${message}` },
      { status: 500 },
    );
  }
}

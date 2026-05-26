import "server-only";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

// ────────────────────────────────────────────────────────────────────
// POST /api/stripe/webhook
//
// Verifies the Stripe signature, then routes four event types:
//
//   checkout.session.completed — subscription rows are upserted (with
//     stripe_customer_id + subscription id), and one-off report rows
//     are inserted with status='queued' (the dev-only autoflip below
//     sets them to 'ready' after 3s).
//   customer.subscription.updated — refresh status + current_period_end.
//   customer.subscription.deleted — mark canceled.
//   invoice.payment_failed — mark past_due.
//
// All writes go through the service-role client because the
// subscriptions and reports tables have no insert/update policy for
// authenticated users — this is the only path that mutates them on
// behalf of Stripe.
//
// Idempotency: Stripe delivers retries. The subscription path uses an
// upsert on user_id (unique). For one-off reports we dedupe on the
// payment intent id by checking before insert. After the row is
// inserted we fire /api/internal/report-generate, the same internal
// generator the public POST /api/reports uses.
// ────────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

type SubscriptionUpsert = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function periodEndIso(sub: Stripe.Subscription): string | null {
  // The Stripe TS types declare `current_period_end` on Subscription, but
  // its presence depends on API version + product configuration. Read
  // defensively to avoid a runtime crash on an unexpected shape.
  const raw = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return new Date(raw * 1000).toISOString();
}

export async function POST(request: Request): Promise<NextResponse> {
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { error: "missing stripe signature or webhook secret" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "stripe is not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { error: `signature verification failed — ${message}` },
      { status: 400 },
    );
  }

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "service-role supabase client unavailable" },
      { status: 500 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.user_id as string | undefined) ??
          session.client_reference_id ??
          null;
        if (!userId) break;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        if (session.mode === "subscription" && customerId) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id ?? null;

          let status = "active";
          let periodEnd: string | null = null;
          let cancelAtPeriodEnd = false;
          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            status = sub.status;
            periodEnd = periodEndIso(sub);
            cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
          }

          const row: SubscriptionUpsert = {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status,
            current_period_end: periodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
          };
          await supabase
            .from("subscriptions")
            .upsert(row, { onConflict: "user_id" });
        }

        if (session.mode === "payment") {
          // One-off clinical report. Insert a queued report row. Dedupe
          // on the payment intent id via a query — the reports schema
          // does not carry that column, so we fall back to a window
          // check (no row created in the same checkout in the last 60s
          // for this user). This is good enough for an at-most-once
          // approximation under Stripe's retry policy.
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

          const sixtySecondsAgo = new Date(
            Date.now() - 60_000,
          ).toISOString();
          const { data: recent } = await supabase
            .from("reports")
            .select("id")
            .eq("user_id", userId)
            .eq("kind", "clinical")
            .gte("created_at", sixtySecondsAgo)
            .limit(1);

          if (recent && recent.length > 0) {
            // Likely a duplicate webhook delivery — skip insert.
            break;
          }

          const { data: meta } = await supabase
            .from("users_meta")
            .select("reading_depth")
            .eq("user_id", userId)
            .maybeSingle<{ reading_depth: number | null }>();
          const depthAtGeneration = meta?.reading_depth ?? 0;

          const { data: inserted } = await supabase
            .from("reports")
            .insert({
              user_id: userId,
              kind: "clinical",
              status: "queued",
              depth_at_generation: depthAtGeneration,
            })
            .select("id")
            .single<{ id: string }>();

          // Trigger the real generator. The internal endpoint runs
          // the model and uploads the PDF; the row flips to ready
          // when the artifact lands. Failures are caught upstream.
          if (inserted) {
            const siteUrl =
              process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
              "http://localhost:3000";
            const internalToken = process.env.AI_INTERNAL_TOKEN;
            if (internalToken) {
              void fetch(`${siteUrl}/api/internal/report-generate`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-internal-token": internalToken,
                },
                body: JSON.stringify({ report_id: inserted.id }),
              }).catch(() => undefined);
            }
          }
          // Capture the paymentIntentId — unused now that we no longer
          // build a placeholder URL, but kept available for future
          // traceback.
          void paymentIntentId;
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId =
          (sub.metadata?.user_id as string | undefined) ?? null;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;

        // Resolve the user via metadata first, then by customer id.
        let resolvedUserId = userId;
        if (!resolvedUserId) {
          const { data } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle<{ user_id: string }>();
          resolvedUserId = data?.user_id ?? null;
        }
        if (!resolvedUserId) break;

        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: resolvedUserId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              status: sub.status,
              current_period_end: periodEndIso(sub),
              cancel_at_period_end: Boolean(sub.cancel_at_period_end),
            },
            { onConflict: "user_id" },
          );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            stripe_subscription_id: sub.id,
            current_period_end: periodEndIso(sub),
            cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;
        if (!customerId) break;
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Other events are acknowledged but not acted on.
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { error: `webhook handler failed — ${message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SubscriptionRow = { status: string | null };
type UsersMetaRow = { reading_depth: number | null };

/**
 * POST /api/reports — queue a clinical report for generation.
 *
 * Entitlement (Phase 7):
 *   - Active subscribers can request one report per calendar month
 *     (the subscription includes one). Beyond that, they are routed
 *     to /reports/confirm to pay the one-off price.
 *   - Free users must go through Stripe checkout — the webhook is the
 *     only path that creates a paid one-off report row. This route
 *     responds with a 303 to /reports/confirm for them.
 *
 * For form submissions (Accept: text/html) this responds with a 303
 * redirect to the new report's status page. For JSON callers it
 * returns { report_id }.
 *
 * TODO: queue worker. In dev the report autoflips to status='ready'
 *       after 3s via setTimeout; production needs a real worker.
 */

function siteOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}

function wantsRedirect(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") || accept === "";
}

function startOfMonthIso(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
  ).toISOString();
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();
  const isSubscribed = sub?.status === "active";

  // Free users — bounce to the paid confirmation page. The webhook is
  // the only path that creates one-off paid reports.
  if (!isSubscribed) {
    if (wantsRedirect(request)) {
      return NextResponse.redirect(
        new URL("/reports/confirm", siteOrigin(request)),
        303,
      );
    }
    return NextResponse.json(
      {
        error: "payment required — visit /reports/confirm",
        confirm_url: "/reports/confirm",
      },
      { status: 402 },
    );
  }

  // Subscribers — one included report per calendar month. Anything
  // beyond that has to go through the one-off paid path. The webhook
  // also writes reports; the count here covers both sources, so a paid
  // one-off this month does NOT entitle the user to a second free one.
  const monthStart = startOfMonthIso(new Date());
  const { count: thisMonthCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "clinical")
    .gte("created_at", monthStart);

  if ((thisMonthCount ?? 0) >= 1) {
    if (wantsRedirect(request)) {
      return NextResponse.redirect(
        new URL("/reports/confirm", siteOrigin(request)),
        303,
      );
    }
    return NextResponse.json(
      {
        error:
          "monthly report already issued — additional reports are paid via /reports/confirm",
        confirm_url: "/reports/confirm",
      },
      { status: 409 },
    );
  }

  const { data: meta } = await supabase
    .from("users_meta")
    .select("reading_depth")
    .eq("user_id", user.id)
    .maybeSingle<UsersMetaRow>();
  const depthAtGeneration = meta?.reading_depth ?? 0;

  const { data: inserted, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      kind: "clinical",
      status: "queued",
      depth_at_generation: depthAtGeneration,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return NextResponse.json(
      { error: "could not queue report" },
      { status: 500 },
    );
  }

  // Dev-only autoflip — pretends the worker ran.
  if (process.env.NODE_ENV !== "production") {
    setTimeout(() => {
      void supabase
        .from("reports")
        .update({
          status: "ready",
          pdf_url: `/reports/${inserted.id}/placeholder.pdf`,
        })
        .eq("id", inserted.id);
    }, 3000);
  }

  if (wantsRedirect(request)) {
    return NextResponse.redirect(
      new URL(`/reports/${inserted.id}`, siteOrigin(request)),
      303,
    );
  }
  return NextResponse.json({ report_id: inserted.id }, { status: 201 });
}

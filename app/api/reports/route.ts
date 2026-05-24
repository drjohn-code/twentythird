import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/reports — queue a clinical report for generation.
//
// Subscriber gets one included report per calendar month. Free users
// are bounced to /reports/confirm to pay. The Stripe webhook is the
// only path that creates a paid one-off report.
//
// The actual generation happens in the background — this route only
// inserts the row and fires the internal generator endpoint.

type SubscriptionRow = { status: string | null };
type UsersMetaRow = { reading_depth: number | null };

function siteOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, "");
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
  // beyond that has to go through the one-off paid path.
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

  // One in-flight at a time.
  const { count: inFlightCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["queued", "generating"]);
  if ((inFlightCount ?? 0) >= 1) {
    return NextResponse.json(
      { error: "a report is already in progress." },
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

  // Fire the internal generator. We do not await — the page renders
  // the queued state and polls /reports/[id] until status is 'ready'.
  void triggerGenerator(inserted.id);

  if (wantsRedirect(request)) {
    return NextResponse.redirect(
      new URL(`/reports/${inserted.id}`, siteOrigin(request)),
      303,
    );
  }
  return NextResponse.json({ report_id: inserted.id }, { status: 201 });
}

async function triggerGenerator(reportId: string): Promise<void> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const internalToken = process.env.AI_INTERNAL_TOKEN;
  if (!internalToken) return;
  try {
    await fetch(`${siteUrl}/api/internal/report-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": internalToken,
      },
      body: JSON.stringify({ report_id: reportId }),
    });
  } catch {
    // best effort — the row stays queued; a future worker pass can pick it up
  }
}

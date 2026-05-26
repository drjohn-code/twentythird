import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// POST /api/settings/reset-password
//
// Triggers Supabase Auth's recovery email against the signed-in
// user's current address. The redirectTo path matches the existing
// forgot-password flow (`/auth/callback/recovery` → exchanges the
// code → routes to `/auth/reset-password` for the form), so a single
// recovery template serves both forgot-password and the in-room
// reset action.

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (await headers()).get("origin") ??
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${origin}/auth/callback/recovery`,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "send failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

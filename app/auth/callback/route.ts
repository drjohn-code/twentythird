import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import { syncLocaleOnAuth } from "@/lib/i18n/locale";

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  // Recovery is signalled either by path (/auth/callback/recovery, which
  // survives Supabase's verify redirect intact) or by ?type=recovery on
  // the legacy query-param flow.
  const isRecovery =
    type === "recovery" || pathname === "/auth/callback/recovery";

  // Diagnostic: dump every param Supabase actually delivered to us, so
  // we can tell when type=recovery is being stripped by /auth/v1/verify.
  console.log("[auth/callback] pathname:", pathname);
  console.log(
    "[auth/callback] searchParams:",
    Object.fromEntries(searchParams.entries()),
  );
  console.log("[auth/callback] parsed type:", type, "isRecovery:", isRecovery);

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=callback_failed`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    if (isRecovery) {
      return NextResponse.redirect(
        `${origin}/auth/forgot-password?error=reset_link_expired`,
      );
    }
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=callback_failed`,
    );
  }

  // Recovery: the session exists, but the user must set a new password
  // before being routed onward. The reset-password page reads getUser()
  // and renders the form; resetPassword() then routes via the normal
  // post-auth helper.
  if (isRecovery) {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // Carry the anonymous locale choice into the account on first sign-in
  // (covers email confirmation and OAuth flows).
  await syncLocaleOnAuth(supabase, data.session.user.id);

  const destination = await resolveDestinationForUser(
    supabase,
    data.session.user.id,
    nextParam,
  );

  return NextResponse.redirect(`${origin}${destination}`);
}

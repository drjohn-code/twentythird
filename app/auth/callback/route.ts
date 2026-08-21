import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import { syncLocaleOnAuth } from "@/lib/i18n/locale";

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  // Supabase's /auth/v1/verify redirects a dead email-OTP link (expired or
  // already consumed) here with no `code` at all — just these two params.
  // This shape is specific to email-link flows (signup confirmation,
  // recovery); it is not how OAuth denial/failure presents, so it's safe
  // to route on without touching the shared code-exchange-failure branch
  // below, which OAuth and confirmation both still fall through to.
  const isDeadEmailLink =
    searchParams.get("error") === "access_denied" &&
    searchParams.get("error_code") === "otp_expired";
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
    if (isDeadEmailLink && !isRecovery) {
      return NextResponse.redirect(
        `${origin}/auth/sign-up?error=confirm_link_expired`,
      );
    }
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
    // OAuth never sends type=signup/type=email on its callback, so this
    // arm is unreachable from the OAuth-denial path by construction.
    if (type === "signup" || type === "email") {
      return NextResponse.redirect(
        `${origin}/auth/sign-up?error=confirm_link_expired`,
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

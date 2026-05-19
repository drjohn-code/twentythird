import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import { AUTH_ERRORS } from "@/lib/auth/messages";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(AUTH_ERRORS.CALLBACK_FAILED)}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(AUTH_ERRORS.CALLBACK_FAILED)}`,
    );
  }

  const destination = await resolveDestinationForUser(
    supabase,
    data.session.user.id,
    nextParam,
  );

  return NextResponse.redirect(`${origin}${destination}`);
}

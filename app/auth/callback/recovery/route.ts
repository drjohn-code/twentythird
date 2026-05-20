import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ERRORS } from "@/lib/auth/messages";

// Recovery callback. The path itself carries the "this is a password
// reset" signal — encoding it in the path instead of a ?type=recovery
// query param ensures Supabase's /auth/v1/verify redirect can't strip
// it when it appends ?code=... to redirectTo.
export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("[auth/callback/recovery] request.url:", request.url);
  console.log("[auth/callback/recovery] pathname:", pathname);
  console.log(
    "[auth/callback/recovery] searchParams:",
    Object.fromEntries(searchParams.entries()),
  );
  console.log(
    "[auth/callback/recovery] code (first 8):",
    code ? code.slice(0, 8) : null,
  );

  if (!code) {
    console.log("[auth/callback/recovery] no code — redirecting to forgot-password");
    return NextResponse.redirect(
      `${origin}/auth/forgot-password?error=${encodeURIComponent(AUTH_ERRORS.RESET_LINK_INVALID)}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.log("[auth/callback/recovery] exchange failed");
    console.log("[auth/callback/recovery] error:", error);
    console.log(
      "[auth/callback/recovery] error fields:",
      error
        ? {
            name: error.name,
            message: error.message,
            status: (error as { status?: number }).status,
            code: (error as { code?: string }).code,
          }
        : null,
    );
    console.log(
      "[auth/callback/recovery] session present:",
      Boolean(data?.session),
    );
    return NextResponse.redirect(
      `${origin}/auth/forgot-password?error=${encodeURIComponent(AUTH_ERRORS.RESET_LINK_EXPIRED)}`,
    );
  }

  console.log("[auth/callback/recovery] exchange succeeded — redirecting to reset-password");

  return NextResponse.redirect(`${origin}/auth/reset-password`);
}

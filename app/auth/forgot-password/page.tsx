import Link from "next/link";
import { redirect } from "next/navigation";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { forgotPassword } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import { AUTH_SUCCESS } from "@/lib/auth/messages";

type SearchParams = Promise<{
  error?: string;
  sent?: string;
  email?: string;
}>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, sent, email } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const dest = await resolveDestinationForUser(supabase, user.id, null);
    redirect(dest);
  }

  if (sent === "1") {
    return (
      <main className="auth-shell">
        <div className="auth-card glass">
          <div className="eyebrow">{AUTH_SUCCESS.RESET_SENT_EYEBROW}</div>
          <h1 className="serif">
            {AUTH_SUCCESS.RESET_SENT_HEADLINE_BEFORE}
            <em>{AUTH_SUCCESS.RESET_SENT_HEADLINE_ITALIC}</em>
            {AUTH_SUCCESS.RESET_SENT_HEADLINE_AFTER}
          </h1>
          <p className="auth-lede">{AUTH_SUCCESS.RESET_SENT_LEDE}</p>
          <p className="auth-foot">
            <Link href="/auth/sign-in">Back to sign in</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          Forgot your <em>password</em>.
        </h1>
        <p className="auth-lede">
          Enter the address you signed up with. We'll send a link to
          reset it.
        </p>

        {error ? <InlineError>{error}</InlineError> : null}

        <form action={forgotPassword} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="forgot-email">
              EMAIL
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              defaultValue={email ?? ""}
            />
          </div>

          <AuthSubmit>Send reset link</AuthSubmit>
        </form>

        <p className="auth-foot">
          Remembered it? <Link href="/auth/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { signUp, resendConfirmation } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import {
  AUTH_SUCCESS,
  PASSWORD_HINT,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth/messages";

type SearchParams = Promise<{
  error?: string;
  email?: string;
  pending?: string;
  resent?: string;
  next?: string;
}>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, email, pending, resent, next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const dest = await resolveDestinationForUser(supabase, user.id, next);
    redirect(dest);
  }

  if (pending === "1" && email) {
    return (
      <main className="auth-shell">
        <div className="auth-card glass">
          <div className="eyebrow">{AUTH_SUCCESS.CHECK_INBOX_EYEBROW}</div>
          <h1 className="serif">
            {AUTH_SUCCESS.CONFIRMATION_HEADLINE_BEFORE}
            <em>{AUTH_SUCCESS.CONFIRMATION_HEADLINE_ITALIC}</em>
            {AUTH_SUCCESS.CONFIRMATION_HEADLINE_AFTER}
            <span className="auth-email-echo">{email}</span>.
          </h1>
          <p className="auth-lede">{AUTH_SUCCESS.CONFIRMATION_LEDE}</p>

          {resent === "1" ? (
            <p className="auth-note">A new link has been sent.</p>
          ) : null}

          <form action={resendConfirmation} className="auth-form">
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="auth-rowlink auth-rowlink-button">
              Resend confirmation<span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-foot">
            Wrong address? <Link href="/auth/sign-up">Start over</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          Create an <em>account</em>.
        </h1>

        {error ? <InlineError>{error}</InlineError> : null}

        <GoogleAuthButton label="Continue with Google" next="/onboarding" />

        <div className="auth-divider" role="separator" aria-label="or">
          <span>or</span>
        </div>

        <form action={signUp} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="signup-email">
              EMAIL
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              defaultValue={email ?? ""}
            />
          </div>

          <div className="auth-field">
            <label className="eyebrow" htmlFor="signup-password">
              PASSWORD
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              aria-required="true"
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              aria-describedby="signup-password-hint"
            />
            <p id="signup-password-hint" className="auth-hint">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="auth-field">
            <label className="eyebrow" htmlFor="signup-confirm">
              CONFIRM PASSWORD
            </label>
            <input
              id="signup-confirm"
              name="confirmPassword"
              type="password"
              required
              aria-required="true"
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>

          <AuthSubmit>Create account</AuthSubmit>
        </form>

        <p className="auth-foot">
          Already have one? <Link href="/auth/sign-in">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

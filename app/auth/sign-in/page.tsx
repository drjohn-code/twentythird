import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { signIn } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";

type SearchParams = Promise<{
  error?: string;
  message?: string;
  email?: string;
  next?: string;
}>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message, email, next } = await searchParams;

  // If the user is already signed in, route them via the helper.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const dest = await resolveDestinationForUser(supabase, user.id, next);
    redirect(dest);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          Sign <em>in</em>.
        </h1>

        {error ? <InlineError>{error}</InlineError> : null}
        {message ? (
          <InlineError label="note">{message}</InlineError>
        ) : null}

        <GoogleAuthButton label="Sign in with Google" next={next} />

        <div className="auth-divider" role="separator" aria-label="or">
          <span>or</span>
        </div>

        <form action={signIn} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="signin-email">
              EMAIL
            </label>
            <input
              id="signin-email"
              name="email"
              type="email"
              required
              aria-required="true"
              autoComplete="email"
              defaultValue={email ?? ""}
            />
          </div>

          <div className="auth-field">
            <label className="eyebrow" htmlFor="signin-password">
              PASSWORD
            </label>
            <input
              id="signin-password"
              name="password"
              type="password"
              required
              aria-required="true"
              autoComplete="current-password"
            />
            <Link
              href="/auth/forgot-password"
              className="auth-rowlink"
            >
              Forgot password<span aria-hidden="true">→</span>
            </Link>
          </div>

          <AuthSubmit>Sign in</AuthSubmit>
        </form>

        <p className="auth-foot">
          New here? <Link href="/auth/sign-up">Create an account</Link>
        </p>
      </div>
    </main>
  );
}

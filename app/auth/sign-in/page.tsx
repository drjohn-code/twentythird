import Link from "next/link";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import { signIn } from "../actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="auth-shell">
        <form action={signIn} className="auth-card glass">
          <h1 className="serif">Sign in</h1>
          <GoogleAuthButton label="Sign in with Google" />
          <div className="auth-divider" role="separator" aria-label="or">
            <span>or</span>
          </div>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button type="submit">
            Sign in <span>→</span>
          </button>
          <p className="auth-foot">
            New here? <Link href="/auth/sign-up">Create an account</Link>
          </p>
      </form>
    </main>
  );
}

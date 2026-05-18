import Link from "next/link";
import { signUp } from "../actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message } = await searchParams;

  return (
    <>
      <div className="atmosphere" aria-hidden="true">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
      </div>
      <div className="grain" aria-hidden="true"></div>

      <main className="auth-shell">
        <form action={signUp} className="auth-card glass">
          <h1 className="serif">Create account</h1>
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
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button type="submit">
            Create account <span>→</span>
          </button>
          <p className="auth-foot">
            Already have one? <Link href="/auth/sign-in">Sign in</Link>
          </p>
        </form>
      </main>
    </>
  );
}

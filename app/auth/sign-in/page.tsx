import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("auth");

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
          {t("signIn.titleBefore")}
          <em>{t("signIn.titleItalic")}</em>
          {t("signIn.titleAfter")}
        </h1>

        {error ? (
          <InlineError>
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")}
          </InlineError>
        ) : null}
        {message ? (
          <InlineError label="note">{message}</InlineError>
        ) : null}

        <GoogleAuthButton label={t("signIn.googleLabel")} next={next} />

        <div className="auth-divider" role="separator" aria-label="or">
          <span>{t("signIn.or")}</span>
        </div>

        <form action={signIn} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="signin-email">
              {t("signIn.emailLabel")}
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
              {t("signIn.passwordLabel")}
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
              {t("signIn.forgotPassword")}<span aria-hidden="true">→</span>
            </Link>
          </div>

          <AuthSubmit>{t("signIn.submit")}</AuthSubmit>
        </form>

        <p className="auth-foot">
          {t("signIn.footPrompt")}
          <Link href="/auth/sign-up">{t("signIn.footLink")}</Link>
        </p>
      </div>
    </main>
  );
}

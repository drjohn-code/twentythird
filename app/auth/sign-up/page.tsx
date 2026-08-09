import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { signUp, resendConfirmation } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import { PASSWORD_HINT, MIN_PASSWORD_LENGTH } from "@/lib/auth/messages";

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
  const t = await getTranslations("auth");

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
          <div className="eyebrow">{t("success.checkInboxEyebrow")}</div>
          <h1 className="serif">
            {t("success.confirmationHeadlineBefore")}
            <em>{t("success.confirmationHeadlineItalic")}</em>
            {t("success.confirmationHeadlineAfter")}
            <span className="auth-email-echo">{email}</span>.
          </h1>
          <p className="auth-lede">{t("success.confirmationLede")}</p>

          {resent === "1" ? (
            <p className="auth-note">{t("signUp.resentNote")}</p>
          ) : null}

          <form action={resendConfirmation} className="auth-form">
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="auth-rowlink auth-rowlink-button">
              {t("signUp.resendConfirmation")}<span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-foot">
            {t("signUp.pendingFootPrompt")}
            <Link href="/auth/sign-up">{t("signUp.pendingFootLink")}</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          {t("signUp.titleBefore")}
          <em>{t("signUp.titleItalic")}</em>
          {t("signUp.titleAfter")}
        </h1>

        {error ? (
          <InlineError>
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")}
          </InlineError>
        ) : null}

        <GoogleAuthButton label={t("signUp.googleLabel")} next="/onboarding" />

        <div className="auth-divider" role="separator" aria-label="or">
          <span>{t("signUp.or")}</span>
        </div>

        <form action={signUp} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="signup-email">
              {t("signUp.emailLabel")}
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
              {t("signUp.passwordLabel")}
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
            {/* PASSWORD_HINT is a hardcoded English literal (lib/auth/messages.ts),
                not wired through the locale layer — lang="en" so it isn't
                announced as Lithuanian; translating it is separate, fenced-off work. */}
            <p id="signup-password-hint" className="auth-hint" lang="en">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="auth-field">
            <label className="eyebrow" htmlFor="signup-confirm">
              {t("signUp.confirmPasswordLabel")}
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

          <AuthSubmit>{t("signUp.submit")}</AuthSubmit>
        </form>

        <p className="auth-foot">
          {t("signUp.footPrompt")}
          <Link href="/auth/sign-in">{t("signUp.footLink")}</Link>
        </p>
      </div>
    </main>
  );
}

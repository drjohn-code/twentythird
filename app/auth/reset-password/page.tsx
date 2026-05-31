import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { resetPassword } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { PASSWORD_HINT, MIN_PASSWORD_LENGTH } from "@/lib/auth/messages";

type SearchParams = Promise<{
  error?: string;
  code?: string;
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, code } = await searchParams;
  const t = await getTranslations("auth");

  // Defensive fallback: Supabase's /auth/v1/verify endpoint sometimes
  // ignores redirectTo and uses the project's Site URL instead, which
  // lands the user here with ?code=... unexchanged. Server Components
  // cannot write cookies, so we hand the code off to the recovery
  // route handler which exchanges it and sets the session cookies.
  if (code) {
    redirect(`/auth/callback/recovery?code=${encodeURIComponent(code)}`);
  }

  // We allow authenticated users here — they may be mid-recovery.
  // If there's no user at all the recovery link wasn't valid; show
  // the expired-link state with a way back to forgot-password.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-card glass">
          <h1 className="serif">
            {t("reset.expiredTitleBefore")}
            <em>{t("reset.expiredTitleItalic")}</em>
            {t("reset.expiredTitleAfter")}
          </h1>
          <p className="auth-lede">{t("errors.reset_link_expired")}</p>
          <p className="auth-foot">
            <Link href="/auth/forgot-password" className="auth-rowlink">
              {t("reset.requestNewLink")}<span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          {t("reset.titleBefore")}
          <em>{t("reset.titleItalic")}</em>
          {t("reset.titleAfter")}
        </h1>

        {error ? (
          <InlineError>
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")}
          </InlineError>
        ) : null}

        <form action={resetPassword} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="reset-password">
              {t("reset.newPasswordLabel")}
            </label>
            <input
              id="reset-password"
              name="password"
              type="password"
              required
              aria-required="true"
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              aria-describedby="reset-password-hint"
            />
            <p id="reset-password-hint" className="auth-hint">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="auth-field">
            <label className="eyebrow" htmlFor="reset-confirm">
              {t("reset.confirmPasswordLabel")}
            </label>
            <input
              id="reset-confirm"
              name="confirmPassword"
              type="password"
              required
              aria-required="true"
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          </div>

          <AuthSubmit>{t("reset.submit")}</AuthSubmit>
        </form>
      </div>
    </main>
  );
}

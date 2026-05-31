import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import InlineError from "@/components/ui/InlineError";
import AuthSubmit from "@/components/ui/AuthSubmit";
import { forgotPassword } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";

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
  const t = await getTranslations("auth");

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
          <div className="eyebrow">{t("success.resetSentEyebrow")}</div>
          <h1 className="serif">
            {t("success.resetSentHeadlineBefore")}
            <em>{t("success.resetSentHeadlineItalic")}</em>
            {t("success.resetSentHeadlineAfter")}
          </h1>
          <p className="auth-lede">{t("success.resetSentLede")}</p>
          <p className="auth-foot">
            <Link href="/auth/sign-in">{t("forgot.sentBackLink")}</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card glass">
        <h1 className="serif">
          {t("forgot.titleBefore")}
          <em>{t("forgot.titleItalic")}</em>
          {t("forgot.titleAfter")}
        </h1>
        <p className="auth-lede">{t("forgot.lede")}</p>

        {error ? (
          <InlineError>
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.generic")}
          </InlineError>
        ) : null}

        <form action={forgotPassword} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="eyebrow" htmlFor="forgot-email">
              {t("forgot.emailLabel")}
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

          <AuthSubmit>{t("forgot.submit")}</AuthSubmit>
        </form>

        <p className="auth-foot">
          {t("forgot.footPrompt")}
          <Link href="/auth/sign-in">{t("forgot.footLink")}</Link>
        </p>
      </div>
    </main>
  );
}

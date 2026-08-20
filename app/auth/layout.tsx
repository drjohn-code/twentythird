import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Every /auth/* screen (sign-up, sign-in, forgot-password, reset-password)
// renders its own <main className="auth-shell"> — there is no shared
// wrapper, which is how all four shipped with no way back to the legal
// pages or home. This layout adds one footer, shared across the whole
// route group, reusing the marketing.footer translation keys so no new
// copy is introduced.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("marketing.footer");
  return (
    <>
      {children}
      <footer className="auth-shell-foot">
        <Link href="/" className="auth-shell-foot-wordmark">
          TwentyThird
        </Link>
        <nav className="auth-shell-foot-links">
          <Link href="/legal/terms">{t("terms")}</Link>
          <Link href="/legal/privacy">{t("privacy")}</Link>
          <Link href="/legal/cookies">{t("cookies")}</Link>
        </nav>
      </footer>
    </>
  );
}

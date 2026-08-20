import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Every /auth/* screen renders its own <main className="auth-shell">.
// This layout adds one footer, shared across the whole route group,
// reusing the marketing.footer translation keys so no new copy is
// introduced. The .auth-page wrapper is a flex column so .auth-shell
// (flex:1) and this footer share the viewport instead of the shell
// claiming a full 100vh and pushing the footer below the fold.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("marketing.footer");
  return (
    <div className="auth-page">
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
    </div>
  );
}

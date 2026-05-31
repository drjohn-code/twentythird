import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Quiet landing after the invitee chooses "no, thank you". Nothing
// further is sent to the inviter beyond the changed status on the
// connections row.

export const dynamic = "force-dynamic";

export default async function InviteDeclinedPage() {
  const t = await getTranslations("invite");
  return (
    <main className="invite-shell">
      <header className="invite-shell-head">
        <Link href="/" className="invite-shell-wordmark">
          TwentyThird
        </Link>
      </header>
      <section className="invite-page invite-page-quiet">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="invite-page-h">
          {t.rich("declined.headline", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
        </h1>
        <p className="invite-page-lede">{t("declined.body")}</p>
      </section>
      <footer className="invite-shell-foot">{t("safetyFooter")}</footer>
    </main>
  );
}

import "server-only";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminClient } from "@/lib/supabase/admin";

// Quiet landing after the invitee chooses "no, thank you". Nothing
// further is sent to the inviter beyond the changed status on the
// connections row.
//
// Re-verifies the token against the connections row before showing
// the confirmation — a fabricated, mistyped, or stale token must not
// be told its decline was recorded when nothing was.

type Params = { token: string };

export const dynamic = "force-dynamic";

export default async function InviteDeclinedPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const admin = adminClient();
  const t = await getTranslations("invite");

  if (!admin) {
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
            {t.rich("notReady.headline", {
              it: (chunks) => <span className="it">{chunks}</span>,
            })}
          </h1>
          <p className="invite-page-lede">{t("notReady.body")}</p>
        </section>
        <footer className="invite-shell-foot">{t("safetyFooter")}</footer>
      </main>
    );
  }

  const { data: conn } = await admin
    .from("connections")
    .select("id, status")
    .eq("invite_token", token)
    .maybeSingle<{ id: string; status: string }>();

  if (!conn || conn.status !== "declined") {
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
            {t.rich("notFound.headline", {
              it: (chunks) => <span className="it">{chunks}</span>,
            })}
          </h1>
          <p className="invite-page-lede">{t("notFound.body")}</p>
        </section>
        <footer className="invite-shell-foot">{t("safetyFooter")}</footer>
      </main>
    );
  }

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

import "server-only";
import Link from "next/link";

// Quiet landing after the invitee chooses "no, thank you". Nothing
// further is sent to the inviter beyond the changed status on the
// connections row.

export const dynamic = "force-dynamic";

export default async function InviteDeclinedPage() {
  return (
    <main className="invite-shell">
      <header className="invite-shell-head">
        <Link href="/" className="invite-shell-wordmark">
          TwentyThird
        </Link>
      </header>
      <section className="invite-page invite-page-quiet">
        <p className="eyebrow">INVITE</p>
        <h1 className="invite-page-h">
          That is <span className="it">received.</span>
        </h1>
        <p className="invite-page-lede">
          Nothing further is needed from you. The invite is closed; the
          inviter sees the status change quietly. You can close this
          window.
        </p>
      </section>
      <footer className="invite-shell-foot">
        TwentyThird is not a substitute for clinical care. In crisis,
        contact your local emergency line.
      </footer>
    </main>
  );
}

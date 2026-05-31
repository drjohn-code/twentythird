import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import { effectiveConnectionsLimit } from "@/lib/connections";

// ────────────────────────────────────────────────────────────────────
// /subscribe/confirm
//
// The one and only file under app/(room) where the subscription price
// string is allowed to appear (€23.23). Pricing on a button is
// forbidden by the build prompt; here it is clinical context.
//
// Submits via a real <form method="POST"> so a bot or stale link
// cannot start a checkout — the user has to press the button.
// ────────────────────────────────────────────────────────────────────

type Search = { canceled?: string };

export default async function SubscribeConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const canceled = sp.canceled === "1";
  const subscriberLimit = effectiveConnectionsLimit(true);
  const t = await getTranslations("room");

  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>{t("subscribe.eyebrow")}</Eyebrow>
      <h1 className="consulting-offer-h">
        {t.rich("subscribe.title", {
          it: (chunks) => <span className="it">{chunks}</span>,
        })}
      </h1>
      <p className="consulting-offer-lede">
        {t("subscribe.ledePrice")}{" "}
        <span className="serif-i">€23.23 {t("subscribe.ledePerMonth")}</span>
        {t("subscribe.ledeIncludes", { count: subscriberLimit })}
      </p>
      <p className="consulting-offer-lede consulting-offer-lede-second">
        {t("subscribe.ledeBilling")}
      </p>

      {canceled ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          {t.rich("subscribe.canceled", {
            i: (chunks) => <span className="serif-i">{chunks}</span>,
          })}
        </p>
      ) : null}

      <form
        method="POST"
        action="/api/stripe/checkout"
        className="consulting-offer-cta"
      >
        <input type="hidden" name="kind" value="subscription" />
        <button type="submit" className="cta">
          <span>{t("subscribe.checkoutCta")}</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <RowLink href="/consulting" arrow="left">
          {t("subscribe.returnLink")}
        </RowLink>
      </form>
    </Reveal>
  );
}

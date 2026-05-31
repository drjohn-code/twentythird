import { getTranslations } from "next-intl/server";
import Eyebrow from "@/components/ui/Eyebrow";
import RowLink from "@/components/ui/RowLink";
import Reveal from "@/components/layout/Reveal";
import { createClient } from "@/lib/supabase/server";

// ────────────────────────────────────────────────────────────────────
// /reports/confirm
//
// The one and only file under app/(room) where the one-off report
// price string is allowed to appear (€11.11). Subscribers do not see
// this page — they get the report queued directly from /readings.
//
// If a subscribed user lands here anyway, point them at the readings
// page rather than charging them a second time.
// ────────────────────────────────────────────────────────────────────

type Search = { canceled?: string };

type SubscriptionRow = { status: string | null };
type UsersMetaRow = { reading_depth: number | null };

export default async function ReportsConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const canceled = sp.canceled === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // (room) layout has already guaranteed a session.
  if (!user) return null;

  const [subRes, metaRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>(),
    supabase
      .from("users_meta")
      .select("reading_depth")
      .eq("user_id", user.id)
      .maybeSingle<UsersMetaRow>(),
  ]);

  const isSubscribed = subRes.data?.status === "active";
  const depth = metaRes.data?.reading_depth ?? 0;
  const t = await getTranslations("room");

  if (isSubscribed) {
    return (
      <Reveal as="section" className="room-section consulting-offer">
        <Eyebrow>{t("reports.confirm.subscribedEyebrow")}</Eyebrow>
        <h1 className="consulting-offer-h">
          {t.rich("reports.confirm.subscribedTitle", {
            it: (chunks) => <span className="it">{chunks}</span>,
          })}
        </h1>
        <p className="consulting-offer-lede">
          {t("reports.confirm.subscribedLede")}
        </p>
        <div className="consulting-offer-cta">
          <RowLink href="/readings#clinical-report">
            {t("reports.confirm.returnLink")}
          </RowLink>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>{t("reports.confirm.eyebrow")}</Eyebrow>
      <h1 className="consulting-offer-h">
        {t.rich("reports.confirm.title", {
          it: (chunks) => <span className="it">{chunks}</span>,
        })}
      </h1>
      <p className="consulting-offer-lede">
        {t("reports.confirm.ledePrice")}{" "}
        <span className="serif-i">€11.11</span>
        {t("reports.confirm.ledeDossier")}
      </p>
      <p className="consulting-offer-lede consulting-offer-lede-second">
        {t("reports.confirm.ledeBilling")}
      </p>

      {depth < 0.5 ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          {t.rich("reports.confirm.depthNotice", {
            i: (chunks) => <span className="serif-i">{chunks}</span>,
          })}
        </p>
      ) : null}

      {canceled ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          {t.rich("reports.confirm.canceled", {
            i: (chunks) => <span className="serif-i">{chunks}</span>,
          })}
        </p>
      ) : null}

      <form
        method="POST"
        action="/api/stripe/checkout"
        className="consulting-offer-cta"
      >
        <input type="hidden" name="kind" value="report" />
        <button type="submit" className="cta">
          <span>{t("reports.confirm.checkoutCta")}</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <RowLink href="/readings#clinical-report" arrow="left">
          {t("reports.confirm.returnLink")}
        </RowLink>
      </form>
    </Reveal>
  );
}

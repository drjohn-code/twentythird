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

  if (isSubscribed) {
    return (
      <Reveal as="section" className="room-section consulting-offer">
        <Eyebrow>CLINICAL REPORT</Eyebrow>
        <h1 className="consulting-offer-h">
          Already <span className="it">included.</span>
        </h1>
        <p className="consulting-offer-lede">
          The subscription includes one clinical report each calendar
          month. Generate it from the bottom of the readings page — no
          payment is needed.
        </p>
        <div className="consulting-offer-cta">
          <RowLink href="/readings#clinical-report">
            return to the readings
          </RowLink>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal as="section" className="room-section consulting-offer">
      <Eyebrow>CLINICAL REPORT · CONFIRM</Eyebrow>
      <h1 className="consulting-offer-h">
        The clinical report<span className="it">.</span>
      </h1>
      <p className="consulting-offer-lede">
        A one-off clinical report is{" "}
        <span className="serif-i">€11.11</span>. A 12&ndash;18 page dossier
        of all twelve readings, in the language a clinician works in.
      </p>
      <p className="consulting-offer-lede consulting-offer-lede-second">
        Billing is handled by Stripe. Reports are regeneratable as the
        reading deepens; subscribers receive one each calendar month
        without a separate charge.
      </p>

      {depth < 0.5 ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          <span className="serif-i">
            the report will reflect the depth available.
          </span>{" "}
          it can be regenerated as the reading deepens.
        </p>
      ) : null}

      {canceled ? (
        <p className="consulting-offer-lede consulting-offer-lede-second">
          <span className="serif-i">checkout was closed.</span> nothing was
          charged.
        </p>
      ) : null}

      <form
        method="POST"
        action="/api/stripe/checkout"
        className="consulting-offer-cta"
      >
        <input type="hidden" name="kind" value="report" />
        <button type="submit" className="cta">
          <span>Continue to checkout</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </button>
        <RowLink href="/readings#clinical-report" arrow="left">
          return to the readings
        </RowLink>
      </form>
    </Reveal>
  );
}

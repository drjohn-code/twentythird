import Link from "next/link";
import Glass from "@/components/ui/Glass";

// SubscriptionCard — status surface on /settings.
// Glass shell, three states. The row-link at the foot is the only
// interactive element; the card body is informational. All card-level
// padding/radius/gap is inlined: this surface is single-use and does
// not earn a global className.

const SHELL_CLASS =
  "block rounded-[24px] p-[30px_34px] flex flex-col gap-[18px] " +
  "transition-[border-color] duration-[400ms] " +
  "hover:[border-color:var(--hair-strong)]";

const STATUS_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--fg-mute)",
};

const STATUS_VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--serif)",
  fontStyle: "italic",
  fontSize: 20,
  letterSpacing: "-0.01em",
};

const ROW_KEY_STYLE: React.CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--fg-mute)",
};

const ROW_VALUE_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--mono)",
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--fg)",
};

const NOTE_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--serif)",
  fontStyle: "italic",
  fontSize: 15,
  lineHeight: 1.55,
  color: "var(--fg-dim)",
};

const INVITE_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--serif)",
  fontSize: 17,
  lineHeight: 1.55,
  color: "var(--fg-dim)",
  maxWidth: 480,
};

export type SubscriptionCardRow = {
  status: string | null;
  current_period_end: string | null;
};

type Props = {
  subscription: SubscriptionCardRow | null;
};

export default function SubscriptionCard({ subscription }: Props) {
  const status = subscription?.status ?? null;
  if (status === "active") return <ActiveCard subscription={subscription!} />;
  if (status === "past_due") return <PastDueCard subscription={subscription!} />;
  return <NoneCard status={status} />;
}

function CardHead({
  label,
  value,
  dim,
}: {
  label: string;
  value: string;
  dim?: boolean;
}) {
  return (
    <header className="flex items-baseline justify-between gap-[18px]">
      <span style={STATUS_LABEL_STYLE}>{label}</span>
      <span
        style={{
          ...STATUS_VALUE_STYLE,
          color: dim ? "var(--fg-dim)" : "var(--fg)",
        }}
      >
        {value}
      </span>
    </header>
  );
}

function Rule() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full"
      style={{ background: "var(--hair)" }}
    />
  );
}

function KvRows({ renews }: { renews: string }) {
  return (
    <dl className="m-0 p-0 flex flex-col gap-[18px]">
      <div className="flex items-baseline justify-between gap-[18px] m-0">
        <dt style={ROW_KEY_STYLE}>RENEWS</dt>
        {/* TODO: lift to lib/date.ts */}
        <dd style={ROW_VALUE_STYLE}>{renews}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-[18px] m-0">
        <dt style={ROW_KEY_STYLE}>CARD</dt>
        {/* TODO: surface card brand + last4 from Stripe */}
        <dd style={ROW_VALUE_STYLE}>on file</dd>
      </div>
    </dl>
  );
}

function CardFoot({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex justify-end mt-[6px]">{children}</footer>
  );
}

function ActiveCard({ subscription }: { subscription: SubscriptionCardRow }) {
  const renews = subscription.current_period_end
    ? formatRenewalDate(subscription.current_period_end)
    : "—";
  return (
    <Glass as="article" className={SHELL_CLASS}>
      <CardHead label="STATUS" value="active" />
      <Rule />
      <KvRows renews={renews} />
      <CardFoot>
        <form action="/api/stripe/portal" method="post" className="m-0">
          <button type="submit" className="auth-rowlink auth-rowlink-button">
            <span>manage in billing portal</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </CardFoot>
    </Glass>
  );
}

function PastDueCard({ subscription }: { subscription: SubscriptionCardRow }) {
  const renews = subscription.current_period_end
    ? formatRenewalDate(subscription.current_period_end)
    : "—";
  return (
    <Glass as="article" className={SHELL_CLASS}>
      <CardHead label="STATUS" value="past due" dim />
      <Rule />
      <KvRows renews={renews} />
      <p style={NOTE_STYLE}>
        <em>the latest payment did not clear</em>
      </p>
      <CardFoot>
        <form action="/api/stripe/portal" method="post" className="m-0">
          <button type="submit" className="auth-rowlink auth-rowlink-button">
            <span>update payment in billing portal</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </CardFoot>
    </Glass>
  );
}

function NoneCard({ status }: { status: string | null }) {
  const isCanceled = status === "canceled";
  return (
    <Glass as="article" className={SHELL_CLASS}>
      <CardHead
        label="STATUS"
        value={isCanceled ? "canceled" : "not subscribed"}
        dim
      />
      <Rule />
      <p style={INVITE_STYLE}>
        The consulting room and a monthly clinical report sit behind the
        subscription.
      </p>
      <CardFoot>
        <Link href="/subscribe/confirm" className="auth-rowlink">
          <span>enter the consulting room</span>
          <span aria-hidden="true">→</span>
        </Link>
      </CardFoot>
    </Glass>
  );
}

// TODO: lift to lib/date.ts
function formatRenewalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

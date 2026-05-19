import Link from "next/link";
import type { ReactNode } from "react";

type Common = {
  children: ReactNode;
  className?: string;
  /** When true, suffixes a serif italic arrow that shifts on hover. */
  arrow?: boolean;
};

type AsLink = Common & {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: never;
};

type AsButton = Common & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  ariaBusy?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
};

type PillProps = AsLink | AsButton;

/** Inverted bg-fg/text-bg pill — the primary action. */
export default function Pill(props: PillProps) {
  const cls = ["pill", props.className].filter(Boolean).join(" ");
  const body = (
    <>
      <span>{props.children}</span>
      {props.arrow ? (
        <span aria-hidden="true" className="pill-arrow">
          →
        </span>
      ) : null}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {body}
      </Link>
    );
  }

  const btn = props as AsButton;
  return (
    <button
      type={btn.type ?? "button"}
      className={cls}
      disabled={btn.disabled}
      aria-busy={btn.ariaBusy || undefined}
      onClick={btn.onClick}
      formAction={btn.formAction}
    >
      {body}
    </button>
  );
}

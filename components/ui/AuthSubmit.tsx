"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
};

/**
 * Standard submit button for auth forms. Disables while the action is
 * in flight and appends a serif italic ellipsis after the label —
 * never spinners, never icons.
 */
export default function AuthSubmit({ children }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="auth-submit"
    >
      <span>{children}</span>
      {pending ? <em className="auth-submit-pending">…</em> : null}
    </button>
  );
}

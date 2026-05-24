"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";

// RowLink-styled control that signs the user out via POST /auth/sign-out
// and lands them on the marketing home (the route already redirects to "/").
// Lowercase, sans, hairline underline, +4px arrow shift on hover — mirrors
// the standard <RowLink>.

type Props = {
  children: ReactNode;
};

export default function SignOutLink({ children }: Props) {
  const [pending, startTransition] = useTransition();

  function go() {
    startTransition(async () => {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/auth/sign-out";
      document.body.appendChild(form);
      form.submit();
    });
  }

  return (
    <button
      type="button"
      className="auth-rowlink auth-rowlink-button"
      onClick={go}
      disabled={pending}
    >
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

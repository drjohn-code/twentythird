"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/auth/actions";

type Props = {
  /** Label shown inside the button. Defaults to "Sign out". */
  label?: string;
  className?: string;
};

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <span>{label}</span>
      {pending ? <em className="auth-submit-pending">…</em> : null}
    </>
  );
}

export default function SignOutButton({
  label = "Sign out",
  className,
}: Props) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={className ?? "auth-rowlink auth-rowlink-button"}
      >
        <Inner label={label} />
      </button>
    </form>
  );
}

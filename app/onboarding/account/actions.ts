"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { accountSchema } from "@/lib/onboarding/schema";
import { INTAKE_INTRO_PATH } from "@/lib/onboarding/routing";

function backToAccount(params: Record<string, string>): string {
  const sp = new URLSearchParams(params);
  return `/onboarding/account?${sp.toString()}`;
}

export async function initiateAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/onboarding/account");
  }

  const raw = {
    full_name: formData.get("full_name"),
    birth_year: formData.get("birth_year"),
    gender: formData.get("gender"),
    terms_accepted: formData.get("terms_accepted"),
  };

  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = (first?.path?.[0] as string | undefined) ?? "form";
    redirect(
      backToAccount({
        error: "invalid",
        field,
        full_name: typeof raw.full_name === "string" ? raw.full_name : "",
        birth_year: typeof raw.birth_year === "string" ? raw.birth_year : "",
        gender: typeof raw.gender === "string" ? raw.gender : "",
      }),
    );
  }

  const now = new Date().toISOString();

  // The handle_new_user trigger creates the row on signup, so an
  // update is the common path. We upsert anyway to recover from any
  // case where the trigger didn't fire (e.g. older auth.users rows).
  // email is sourced from auth.users.user.email so that the INSERT
  // branch of this upsert (which fires when the profiles row was never
  // created by the handle_new_user trigger — e.g. the row was deleted
  // and the auth.users row remained) still populates email correctly.
  // The trigger covers the normal new-signup path; this covers
  // late-creation paths. See migration 20260525160000.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: parsed.data.full_name,
        birth_year: parsed.data.birth_year,
        gender: parsed.data.gender,
        terms_accepted_at: now,
        account_initiated_at: now,
        onboarding_step: 0,
        intake_status: "in_progress",
      },
      { onConflict: "id" },
    );

  if (error) {
    redirect(
      backToAccount({
        error: "save_failed",
        full_name: parsed.data.full_name,
        birth_year: String(parsed.data.birth_year),
        gender: parsed.data.gender,
      }),
    );
  }

  revalidatePath("/onboarding", "layout");
  redirect(INTAKE_INTRO_PATH);
}

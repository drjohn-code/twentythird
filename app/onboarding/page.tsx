import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveForUser } from "@/lib/onboarding/routing";

// Entry point. Looks at the user's state and routes them to the right
// place inside the onboarding flow (or to /room if they're done).
export default async function OnboardingEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/onboarding");
  }

  const dest = await resolveForUser(supabase, user.id);
  redirect(dest);
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/layout/Reveal";
import Eyebrow from "@/components/ui/Eyebrow";
import Glass from "@/components/ui/Glass";
import AccountForm from "@/components/onboarding/AccountForm";
import { resolveForUser, ACCOUNT_PATH } from "@/lib/onboarding/routing";
import { getActiveLocale } from "@/lib/i18n/locale";

type SearchParams = Promise<{
  error?: string;
  field?: string;
  full_name?: string;
  birth_year?: string;
  gender?: string;
}>;

type ProfileRow = {
  account_initiated_at: string | null;
  full_name: string | null;
  birth_year: number | null;
  gender: string | null;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${ACCOUNT_PATH}`);
  }

  // If they've already initiated the account, send them onward.
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_initiated_at, full_name, birth_year, gender")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profile?.account_initiated_at) {
    const dest = await resolveForUser(supabase, user.id);
    if (dest !== ACCOUNT_PATH) redirect(dest);
  }

  const googleName =
    (user.user_metadata as { full_name?: string; name?: string } | null)
      ?.full_name ??
    (user.user_metadata as { name?: string } | null)?.name ??
    "";

  const prefilledFromGoogle = !profile?.full_name && Boolean(googleName);

  const defaultName =
    sp.full_name ?? profile?.full_name ?? googleName ?? "";
  const defaultBirthYear =
    sp.birth_year ??
    (profile?.birth_year ? String(profile.birth_year) : "");
  const defaultGender = sp.gender ?? profile?.gender ?? "";
  const defaultLocale = await getActiveLocale();
  const t = await getTranslations("onboarding");

  return (
    <main className="account-shell">
      <div className="account-shell-inner">
        <Reveal as="div" className="account-head">
          <Eyebrow>STEP 00 · {t("account.eyebrowLabel")}</Eyebrow>
          <h1 className="serif account-headline">
            {t("account.headlineBefore")} <em>{t("account.headlineItalic")}</em>.
          </h1>
          <p className="account-lede">
            {t("account.lede")}
          </p>
        </Reveal>
        <Reveal as="div" className="account-panel-wrap">
          <Glass className="account-panel">
            <AccountForm
              defaultName={defaultName}
              prefilledFromGoogle={prefilledFromGoogle}
              defaultBirthYear={defaultBirthYear}
              defaultGender={defaultGender}
              defaultLocale={defaultLocale}
              errorField={sp.field}
              errorKind={sp.error}
            />
          </Glass>
        </Reveal>
      </div>
    </main>
  );
}

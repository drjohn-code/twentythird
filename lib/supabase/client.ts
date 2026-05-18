import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function signInWithGoogle(next?: string) {
  const supabase = createClient();
  const redirectTo = next
    ? `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${location.origin}/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

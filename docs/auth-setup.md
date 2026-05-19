# Auth setup — Google OAuth + Supabase

This is a **one-time operator task**. The Google provider cannot be
enabled from code; it must be turned on in the Supabase dashboard.
Until then, the Google button returns
`{ "code": 400, "error_code": "validation_failed", "msg": "Unsupported provider: provider is not enabled" }`.

Run these steps in order. Total time: ~10 minutes.

---

## 1 · Google Cloud Console — create the OAuth client

1. Open <https://console.cloud.google.com/>. Create (or select) a
   project for TwentyThird.
2. **APIs & Services → OAuth consent screen.** User type **External**.
   App name: `TwentyThird`. Support email: your inbox. Add
   `day-23.com` (and any other production hostnames) under
   **Authorized domains**. Scopes: `openid`, `email`, `profile` are
   enough. Save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
   - Application type: **Web application**.
   - Name: `TwentyThird Web`.
   - **Authorized JavaScript origins** — add all:
     - `http://localhost:3000`
     - `https://day-23.com`
     - any preview/staging origin you use (e.g.
       `https://<branch>.vercel.app`)
   - **Authorized redirect URIs** — add the Supabase callback exactly:
     - `https://<project-ref>.supabase.co/auth/v1/callback`
     - Replace `<project-ref>` with the ref shown at
       Supabase → Project Settings → General.
4. Copy the generated **Client ID** and **Client Secret**.

## 2 · Supabase Dashboard — enable Google

1. **Authentication → Providers → Google.** Toggle **Enabled**.
2. Paste the **Client ID** and **Client Secret** from step 1.4. Save.

## 3 · Supabase Dashboard — URL configuration

**Authentication → URL Configuration.**

- **Site URL:** `https://day-23.com` (production) or
  `http://localhost:3000` (local dev — set whichever the project is
  pointed at).
- **Redirect URLs (allow-list)** — add every callback you'll use:
  - `http://localhost:3000/auth/callback`
  - `https://day-23.com/auth/callback`
  - any preview/staging callback you'll hit
- Also add `http://localhost:3000/auth/reset-password` and the
  production equivalent if you use password resets.

If a redirect URL is missing here, Supabase silently rewrites the
callback to the Site URL — which usually looks like "Google sign-in
sent me to the homepage with no session."

## 4 · `.env.local`

Confirm the following variables are set in `.env.local` (and in your
production host's environment):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from API Settings>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only, never expose>
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # or https://day-23.com in prod
```

`SUPABASE_SERVICE_ROLE_KEY` is **server-only**. It must not appear in
any `NEXT_PUBLIC_*` variable, any client component, or any log line.

## 5 · Run the schema migration

The `profiles` and `onboarding_responses` tables, RLS policies, and
the `handle_new_user` trigger live in
`supabase/migrations/20260519100000_profiles_and_onboarding.sql`.

Preferred:

```
supabase db push
```

The trigger this migration installs (`on_auth_user_created` on
`auth.users`) needs to execute with privileges the dashboard SQL
editor sometimes doesn't carry. If the migration fails at
`create trigger on_auth_user_created on auth.users` when you paste it
into the dashboard SQL editor, run it via `supabase db push`
instead — that path uses the project's migration credentials and
succeeds where the editor refuses.

The migration also includes a one-shot backfill that creates a
`profiles` row for every existing `auth.users` row, so users who
signed up before this migration will not 500 the onboarding flow.

## 6 · Smoke test

1. Restart `next dev` so the new env vars are picked up.
2. Visit `/auth/sign-up`. Click **Continue with Google**.
3. You should be redirected to Google's account picker (no
   `Unsupported provider` JSON). After consent you return to
   `/auth/callback?code=...` and then to `/onboarding`.
4. In Supabase → Table editor → `profiles`, a row exists with your
   `id`, `email`, `full_name`, `avatar_url`.

If you see the `Unsupported provider` error again, step 2 is
incomplete. If you see a redirect to the homepage with no session,
step 3 is incomplete (the callback URL isn't on the allow-list).

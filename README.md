# TwentyThird

Psychodynamic AI for self‑discovery. Root‑cause analysis grounded in the foundational insights of Sigmund Freud and Jacques Lacan's breakthroughs in linguistics, desire, and identity.

## Stack

- **Next.js 15** — App Router, React Server Components
- **React 19**
- **TypeScript** — strict mode
- **Tailwind CSS v4** — alongside the design's custom CSS tokens
- **Supabase** — auth via `@supabase/ssr` (server + browser clients, middleware session refresh)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in your Supabase keys
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command             | Purpose                       |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start the dev server          |
| `npm run build`     | Production build              |
| `npm run start`     | Serve the production build    |
| `npm run lint`      | ESLint                        |
| `npm run typecheck` | `tsc --noEmit`                |

## Environment variables

See [`.env.example`](.env.example). All values are read from `.env.local`.

| Variable                          | Description                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`        | Your Supabase project URL                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase anon (publishable) key                              |
| `NEXT_PUBLIC_SITE_URL`            | Public site origin (used for email confirmation redirects)   |

## Project layout

```
app/
  layout.tsx                  root layout, fonts via next/font, theme bootstrap
  page.tsx                    landing page (server component)
  landing-interactions.tsx    client-side effects (theme toggle, scroll, reveal)
  globals.css                 design tokens + Tailwind import
  auth/
    actions.ts                server actions: signIn, signUp, signOut
    callback/route.ts         email-confirmation code exchange
    sign-in/page.tsx
    sign-up/page.tsx
    sign-out/route.ts
lib/
  supabase/
    client.ts                 browser client (use inside "use client")
    server.ts                 server client (Server Components, Route Handlers, Server Actions)
    middleware.ts             session-refresh helper
middleware.ts                 invokes updateSession on every request
public/images/                Brain, Freud, Lacan portraits
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/dashboard) and copy the URL + anon key into `.env.local`.
2. In **Authentication → URL Configuration**, set the **Site URL** to `http://localhost:3000` (dev) or your production origin.
3. Add `http://localhost:3000/auth/callback` (and the prod equivalent) to **Redirect URLs**.
4. Email/password auth is enabled by default. Confirmation emails go through `/auth/callback`, which exchanges the code for a session.

### How the auth pieces fit

- **`lib/supabase/server.ts`** is the canonical way to read the session in Server Components and Server Actions.
- **`middleware.ts`** runs on every matched request and refreshes the auth token so cookies stay current.
- **`app/auth/actions.ts`** uses the server client to sign in / sign up / sign out, then `revalidatePath` + `redirect`.
- **`app/auth/callback/route.ts`** handles the email-confirmation flow (OAuth too, if you enable it later).

To sign a user out from any UI, POST to `/auth/sign-out`.

## Design notes

The landing page is a direct port of the Day 23 Claude Design prototype. The custom CSS lives in [`app/globals.css`](app/globals.css) and uses CSS variables for theme tokens (dark / light) plus a `data-theme` attribute on `<html>`. Theme preference is persisted in `localStorage` and applied pre-hydration via an inline script in the root layout to avoid FOUC.

Tailwind v4 is loaded via `@import "tailwindcss"` and is available for any new code; the prototype's bespoke CSS is left untouched on purpose so the page stays pixel-perfect to the design.

## License

Proprietary. © 2026 TwentyThird labs.

// Single source for every user-facing auth message. Imported by:
//   - app/auth/sign-in/page.tsx
//   - app/auth/sign-up/page.tsx
//   - app/auth/forgot-password/page.tsx
//   - app/auth/reset-password/page.tsx
//   - app/auth/callback/route.ts
//   - app/auth/actions.ts
//
// Voice: editorial-clinical. Short, certain. No icons, no colour.
// Headlines (when the message is a headline, not an inline error)
// carry exactly one italic phrase.

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Email or password doesn't match.",
  EMAIL_TAKEN: "That email is already registered. Try signing in.",
  WEAK_PASSWORD: "Use at least 8 characters.",
  PASSWORDS_DONT_MATCH: "Passwords don't match.",
  EMAIL_INVALID: "That doesn't look like a valid email.",
  RATE_LIMITED: "Too many attempts. Try again in a moment.",
  RATE_LIMITED_AFTER: (seconds: number) =>
    `Too many attempts. Try again in ${seconds}s.`,
  UNCONFIRMED_EMAIL: "Confirm your email first. Check your inbox.",
  RESET_LINK_EXPIRED: "That link has expired. Request a new one.",
  RESET_LINK_INVALID: "That link is no longer valid. Request a new one.",
  OAUTH_FAILED: "Couldn't reach Google. Try again.",
  CALLBACK_FAILED: "Could not complete sign-in.",
  GENERIC: "Something went wrong. Try again.",
  NO_SESSION: "Sign in to continue.",
} as const;

export const AUTH_SUCCESS = {
  CHECK_INBOX_EYEBROW: "CHECK YOUR INBOX",
  CONFIRMATION_HEADLINE_BEFORE: "We've sent a ",
  CONFIRMATION_HEADLINE_ITALIC: "confirmation link",
  CONFIRMATION_HEADLINE_AFTER: " to ",
  CONFIRMATION_LEDE: "Click it to finish creating your account.",

  RESET_SENT_EYEBROW: "CHECK YOUR INBOX",
  RESET_SENT_HEADLINE_BEFORE: "If that email is ",
  RESET_SENT_HEADLINE_ITALIC: "registered",
  RESET_SENT_HEADLINE_AFTER: ", we've sent a reset link.",
  RESET_SENT_LEDE:
    "The link works once and expires within the hour. No link arrived means no account.",

  PASSWORD_UPDATED: "Password updated. Signing you in.",
} as const;

// Stable auth-error codes. These travel in the `?error=` URL param and
// are resolved to localized copy on the page via the `auth.errors.<code>`
// catalog (English values mirror AUTH_ERRORS above). Never put error TEXT
// in the URL — it would be English inside a localized flow.
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_taken"
  | "weak_password"
  | "passwords_dont_match"
  | "email_invalid"
  | "rate_limited"
  | "unconfirmed_email"
  | "reset_link_expired"
  | "reset_link_invalid"
  | "oauth_failed"
  | "callback_failed"
  | "generic"
  | "no_session";

/**
 * Map a Supabase auth error message to a stable code. Supabase wording
 * shifts between versions, so we match on substrings and fall back to
 * "generic". The code is resolved to localized copy on the page.
 */
export function mapSupabaseAuthError(
  raw: string | undefined | null,
): AuthErrorCode {
  if (!raw) return "generic";
  const s = raw.toLowerCase();

  if (s.includes("invalid login") || s.includes("invalid credentials")) {
    return "invalid_credentials";
  }
  if (s.includes("email not confirmed") || s.includes("not confirmed")) {
    return "unconfirmed_email";
  }
  if (s.includes("already registered") || s.includes("user already")) {
    return "email_taken";
  }
  if (s.includes("rate limit") || s.includes("too many")) {
    return "rate_limited";
  }
  if (s.includes("password should be") || s.includes("weak password")) {
    return "weak_password";
  }
  if (s.includes("invalid email") || s.includes("email address")) {
    return "email_invalid";
  }
  if (s.includes("expired") && s.includes("link")) {
    return "reset_link_expired";
  }
  if (s.includes("token") && (s.includes("expired") || s.includes("invalid"))) {
    return "reset_link_invalid";
  }

  return "generic";
}

export const PASSWORD_HINT = "At least 8 characters.";
export const MIN_PASSWORD_LENGTH = 8 as const;

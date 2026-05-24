// Shared helpers for the connections feature.
//
// Role labels, expiry math, token generation, status checks. Pure
// functions only — no I/O. Used by the API route, email templates,
// settings UI, and invite landing.

export type ConnectionRole =
  | "partner"
  | "closest_friend"
  | "parent"
  | "sibling"
  | "co_parent";

export const CONNECTION_ROLES: ReadonlyArray<{
  value: ConnectionRole;
  label: string;
}> = [
  { value: "partner", label: "partner" },
  { value: "closest_friend", label: "closest friend" },
  { value: "parent", label: "parent" },
  { value: "sibling", label: "sibling" },
  { value: "co_parent", label: "co‑parent" },
];

const ROLE_LABEL: Record<ConnectionRole, string> = Object.fromEntries(
  CONNECTION_ROLES.map((r) => [r.value, r.label]),
) as Record<ConnectionRole, string>;

export function roleLabel(role: string): string {
  return (ROLE_LABEL as Record<string, string>)[role] ?? role;
}

export function isConnectionRole(v: unknown): v is ConnectionRole {
  return (
    typeof v === "string" &&
    Object.prototype.hasOwnProperty.call(ROLE_LABEL, v)
  );
}

export const MAX_ACTIVE_CONNECTIONS = 2;
export const INVITE_TTL_DAYS = 14;

export function inviteExpiryFromNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function daysUntil(target: string | Date, now: Date = new Date()): number {
  const t = target instanceof Date ? target : new Date(target);
  const ms = t.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function formatShortDate(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

// First-name extraction. Falls back to the email's local part if the
// inviter's display name is missing — we never render an empty subject.
export function firstNameFrom(full: string | null | undefined): string | null {
  if (!full) return null;
  const trimmed = full.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

export function firstNameOrEmailLocal(
  full: string | null | undefined,
  email: string,
): string {
  const fn = firstNameFrom(full);
  if (fn) return fn;
  const local = email.split("@")[0] ?? email;
  return local.replace(/[^A-Za-z'\-]/g, " ").trim() || email;
}

// Cryptographically secure URL-safe token.
//
// Used as the invite_token column value and as the URL parameter at
// /invite/<token>. 24 bytes -> 32-char base64url, no padding.
export function generateInviteToken(): string {
  // Node's webcrypto is present in the Next.js server runtime.
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function base64url(bytes: Uint8Array): string {
  // Avoid Buffer to keep this isomorphic for the route handler runtime.
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = typeof btoa === "function" ? btoa(bin) : "";
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Email validation — used both by the invite form and the API route.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isLikelyEmail(value: string): boolean {
  if (value.length > 254) return false;
  return EMAIL_RE.test(value);
}

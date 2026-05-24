import "server-only";
import { Resend } from "resend";

// Single Resend wrapper used by every connection email template.
//
// Reads RESEND_API_KEY at call time so the route handlers don't need to
// repeat the missing-key bail-out. Returns { ok: true } / { ok: false }
// — callers should treat a false as best-effort and continue.

// TODO: confirm day-23.com is verified in Resend; otherwise fall back
// to "TwentyThird <onboarding@resend.dev>" until verification lands.
export const FROM_EMAIL = "TwentyThird <noreply@day-23.com>";

export type SendInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY missing — skipping send.");
    return { ok: false, error: "no_api_key" };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [input.to],
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (error) {
      console.error("[email] Resend send error:", error);
      return { ok: false, error: error.message ?? "send_failed" };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    console.error("[email] Resend threw:", e);
    return { ok: false, error: "send_threw" };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Wraps an email body in TwentyThird's editorial-clinical email shell.
 * Plain inline styles only — no remote fonts, no images.
 */
export function brandEmailShell(args: {
  preheader: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html><body style="margin:0;padding:32px;background:#f5f5f3;color:#121214;font-family:Georgia,'EB Garamond',serif;font-size:16px;line-height:1.6">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(args.preheader)}</span>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:540px;margin:0 auto">
    <tr><td style="padding:0 0 28px 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8a8a90">TwentyThird</td></tr>
    ${args.bodyHtml}
    <tr><td style="padding:36px 0 0 0;border-top:1px solid rgba(0,0,0,0.08);font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.04em;color:#8a8a90;line-height:1.6">
      TwentyThird is not a substitute for clinical care. In crisis, contact your local emergency line.
    </td></tr>
  </table>
</body></html>`;
}

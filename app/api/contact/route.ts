import "server-only";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminClient } from "../../../lib/supabase/admin";

// TODO: confirm day-23.com is verified in Resend; otherwise fall back to
// "TwentyThird <onboarding@resend.dev>" until verification lands.
const FROM_EMAIL = "TwentyThird <noreply@day-23.com>";
const TO_EMAIL = "info@day-23.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return fail("Invalid request.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name) return fail("Please add your name.");
  if (name.length > 200) return fail("Name is too long.");
  if (!email || !EMAIL_RE.test(email)) return fail("Please check your email.");
  if (!message) return fail("Please add a message.");
  if (message.length > 5000) return fail("Message is too long.");

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const fwd = request.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]!.trim() : null;

  const supabase = adminClient();
  if (!supabase) {
    return fail("Server is not configured.", 500);
  }

  const { error: dbError } = await supabase
    .from("contact_submissions")
    .insert({
      name,
      email,
      message,
      user_agent: userAgent,
      ip,
    });

  if (dbError) {
    return fail("We couldn't save your message. Please try again.", 500);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const timestamp = new Date().toISOString();
    const plainText = [
      `Name: ${name}`,
      `Email: ${email}`,
      ``,
      `Message:`,
      message,
      ``,
      `—`,
      `Received: ${timestamp}`,
      `User agent: ${userAgent ?? "—"}`,
    ].join("\n");

    const html = `<!doctype html>
<html><body style="margin:0;padding:32px;background:#ffffff;color:#000000;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55">
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:560px">
    <tr><td style="padding-bottom:8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#000000">New contact</td></tr>
    <tr><td style="padding-bottom:24px;font-size:20px;color:#000000">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:14px 0;border-top:1px solid #000000;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#000000">Email</td></tr>
    <tr><td style="padding-bottom:18px;color:#000000">${escapeHtml(email)}</td></tr>
    <tr><td style="padding:14px 0;border-top:1px solid #000000;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#000000">Message</td></tr>
    <tr><td style="padding-bottom:18px;color:#000000;white-space:pre-wrap">${escapeHtml(message)}</td></tr>
    <tr><td style="padding:14px 0;border-top:1px solid #000000;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#000000">Received</td></tr>
    <tr><td style="padding-bottom:6px;color:#000000">${escapeHtml(timestamp)}</td></tr>
    <tr><td style="padding-bottom:18px;color:#000000;font-size:13px">${escapeHtml(userAgent ?? "—")}</td></tr>
  </table>
</body></html>`;

    try {
      const resend = new Resend(apiKey);
      const { error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        replyTo: email,
        subject: `New contact — ${name}`,
        text: plainText,
        html,
      });
      if (emailError) {
        console.error("[contact] Resend send error:", emailError);
      }
    } catch (e) {
      console.error("[contact] Resend threw:", e);
    }
  } else {
    console.error("[contact] RESEND_API_KEY missing — skipping email send.");
  }

  return NextResponse.json({ ok: true });
}

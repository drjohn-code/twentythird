import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "../../../lib/supabase/server";

const INQUIRY_TYPES = [
  "general",
  "clinical",
  "press",
  "partnership",
  "research",
] as const;
type InquiryType = (typeof INQUIRY_TYPES)[number];

type Payload = {
  name?: unknown;
  email?: unknown;
  inquiryType?: unknown;
  message?: unknown;
  company?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return fail("Invalid request.", 400);
  }

  if (typeof body.company === "string" && body.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const inquiryType =
    typeof body.inquiryType === "string" ? body.inquiryType.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 120) return fail("Please check your details.");
  if (!email || email.length > 254 || !EMAIL_RE.test(email))
    return fail("Please check your details.");
  if (!INQUIRY_TYPES.includes(inquiryType as InquiryType))
    return fail("Please check your details.");
  if (message.length < 10 || message.length > 4000)
    return fail("Please check your details.");

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const fwd = request.headers.get("x-forwarded-for");
  const ipHash = fwd
    ? createHash("sha256").update(fwd.split(",")[0]!.trim()).digest("hex")
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    inquiry_type: inquiryType,
    message,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (error) {
    return fail("We couldn't save your message. Please try again.", 500);
  }

  return NextResponse.json({ ok: true });
}

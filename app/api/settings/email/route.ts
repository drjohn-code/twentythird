import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/settings/email
//
// Merges the request body into users_meta.email_preferences. The
// schema lives in the migration (one jsonb column) so this handler
// only enforces shape — booleans for the four toggles, "HH:MM" for
// quiet-hours bounds. Anything else is rejected.

type Body = Partial<{
  weekly_catchup: boolean;
  consulting_session_reminder: boolean;
  connection_requests: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}>;

const BOOL_KEYS = [
  "weekly_catchup",
  "consulting_session_reminder",
  "connection_requests",
] as const;

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const key of BOOL_KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key];
  }
  if (typeof body.quiet_hours_start === "string") {
    if (!HHMM_RE.test(body.quiet_hours_start)) {
      return NextResponse.json({ error: "invalid_start" }, { status: 400 });
    }
    patch.quiet_hours_start = body.quiet_hours_start;
  }
  if (typeof body.quiet_hours_end === "string") {
    if (!HHMM_RE.test(body.quiet_hours_end)) {
      return NextResponse.json({ error: "invalid_end" }, { status: 400 });
    }
    patch.quiet_hours_end = body.quiet_hours_end;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  // Read current preferences, merge, write. We don't use a jsonb
  // operator because the SDK doesn't expose one and the column is
  // small enough that round-tripping is cheap.
  const { data: row } = await supabase
    .from("users_meta")
    .select("email_preferences")
    .eq("user_id", user.id)
    .maybeSingle<{ email_preferences: Record<string, unknown> | null }>();

  const merged = { ...(row?.email_preferences ?? {}), ...patch };

  const { error } = await supabase
    .from("users_meta")
    .update({ email_preferences: merged })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email_preferences: merged });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/settings/account
//
// Writes a single Account field — currently `name` (profiles.full_name)
// or `birth_year` (profiles.birth_year). Returns the canonical persisted
// value so the client can collapse back to resting state with whatever
// the database actually accepted.
//
// Email is intentionally not editable here. The user changes their
// email through the password-reset / account-recovery flow handled by
// /api/settings/reset-password.

type Field = "name" | "birth_year";
type Body = { field?: Field; value?: unknown };

const MAX_NAME_LENGTH = 80;
const MIN_BIRTH_YEAR = 1900;
// Maximum age cap matches the product rule (and the profiles.birth_year
// DB CHECK constraint): the user must be at least 13 years old. Computed
// at request time so the bound tracks the calendar.
const BIRTH_YEAR_MIN_AGE = 13;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid request" },
      { status: 400 },
    );
  }

  if (body.field === "name") {
    const raw = typeof body.value === "string" ? body.value : "";
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { ok: false, error: "name cannot be empty" },
        { status: 400 },
      );
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { ok: false, error: "name must be 80 characters or fewer" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "save failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, value: trimmed });
  }

  if (body.field === "birth_year") {
    const raw = typeof body.value === "string" ? body.value.trim() : "";
    const maxBirthYear = new Date().getUTCFullYear() - BIRTH_YEAR_MIN_AGE;
    const errorLine = `birth year must be between ${MIN_BIRTH_YEAR} and ${maxBirthYear}`;
    if (!/^\d{4}$/.test(raw)) {
      return NextResponse.json(
        { ok: false, error: errorLine },
        { status: 400 },
      );
    }
    const year = Number(raw);
    if (
      !Number.isInteger(year) ||
      year < MIN_BIRTH_YEAR ||
      year > maxBirthYear
    ) {
      return NextResponse.json(
        { ok: false, error: errorLine },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ birth_year: year })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "save failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, value: String(year) });
  }

  return NextResponse.json(
    { ok: false, error: "unknown field" },
    { status: 400 },
  );
}

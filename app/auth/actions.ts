"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveDestinationForUser } from "@/lib/auth/post-auth";
import {
  AUTH_ERRORS,
  MIN_PASSWORD_LENGTH,
  mapSupabaseAuthError,
} from "@/lib/auth/messages";

const emailSchema = z.string().trim().toLowerCase().email();

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const signUpSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(MIN_PASSWORD_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: AUTH_ERRORS.PASSWORDS_DONT_MATCH,
    path: ["confirmPassword"],
  });

const forgotSchema = z.object({ email: emailSchema });

const resetSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: AUTH_ERRORS.PASSWORDS_DONT_MATCH,
    path: ["confirmPassword"],
  });

async function siteOrigin(): Promise<string> {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get("origin") ??
    "http://localhost:3000"
  );
}

function firstZodMessage(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return AUTH_ERRORS.GENERIC;
  if (issue.path[0] === "email") return AUTH_ERRORS.EMAIL_INVALID;
  if (issue.path[0] === "password") return AUTH_ERRORS.WEAK_PASSWORD;
  if (issue.path[0] === "confirmPassword")
    return AUTH_ERRORS.PASSWORDS_DONT_MATCH;
  return issue.message || AUTH_ERRORS.GENERIC;
}

function backTo(path: string, params: Record<string, string>): string {
  const sp = new URLSearchParams(params);
  return `${path}?${sp.toString()}`;
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(
      backTo("/auth/sign-in", { error: firstZodMessage(parsed.error) }),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    redirect(
      backTo("/auth/sign-in", {
        error: mapSupabaseAuthError(error?.message),
        email: parsed.data.email,
      }),
    );
  }

  const destination = await resolveDestinationForUser(
    supabase,
    data.session.user.id,
    null,
  );

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(
      backTo("/auth/sign-up", { error: firstZodMessage(parsed.error) }),
    );
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect(
      backTo("/auth/sign-up", {
        error: mapSupabaseAuthError(error.message),
        email: parsed.data.email,
      }),
    );
  }

  // If email confirmation is disabled in the project, Supabase
  // returns a session immediately. Route through the helper.
  if (data.session) {
    const destination = await resolveDestinationForUser(
      supabase,
      data.session.user.id,
      null,
    );
    revalidatePath("/", "layout");
    redirect(destination);
  }

  // Confirmation-pending state.
  redirect(
    backTo("/auth/sign-up", {
      pending: "1",
      email: parsed.data.email,
    }),
  );
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    redirect(
      backTo("/auth/sign-up", { error: AUTH_ERRORS.EMAIL_INVALID }),
    );
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  // Always show the pending state regardless of whether the resend
  // succeeded — same anti-enumeration logic as forgot-password.
  redirect(
    backTo("/auth/sign-up", { pending: "1", email: parsed.data, resent: "1" }),
  );
}

export async function forgotPassword(formData: FormData) {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(
      backTo("/auth/forgot-password", {
        error: AUTH_ERRORS.EMAIL_INVALID,
      }),
    );
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  // Always-same success state regardless of whether the email is
  // registered. No enumeration.
  redirect(backTo("/auth/forgot-password", { sent: "1" }));
}

export async function resetPassword(formData: FormData) {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect(
      backTo("/auth/reset-password", {
        error: firstZodMessage(parsed.error),
      }),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      backTo("/auth/reset-password", {
        error: AUTH_ERRORS.RESET_LINK_INVALID,
      }),
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    redirect(
      backTo("/auth/reset-password", {
        error: mapSupabaseAuthError(error.message),
      }),
    );
  }

  const destination = await resolveDestinationForUser(supabase, user.id, null);
  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

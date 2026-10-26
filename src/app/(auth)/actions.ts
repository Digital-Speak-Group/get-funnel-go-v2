"use server";

import { z } from "zod";
import { supabaseAuthService } from "@/lib/auth/supabase";
import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { authMessages } from "./messages";

const EmailSchema = z.string().email("Email invalide");
const PasswordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

const SignInInput = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

const SignUpInput = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export async function signInAction(raw: unknown) {
  const parsed = SignInInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] || "Email ou mot de passe invalide" };
  }

  const { email, password } = parsed.data;
  const result = await supabaseAuthService.signIn(email, password);

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
}

export async function signUpAction(raw: unknown) {
  const parsed = SignUpInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] || "Données invalides" };
  }

  const { email, password } = parsed.data;
  const result = await supabaseAuthService.signUp(email, password);

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
}

export async function signOutAction() {
  await supabaseAuthService.signOut();
  redirect("/login");
}

export async function confirmEmailAction(raw: unknown) {
  const schema = z.object({ token: z.string().min(1) });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Token invalide" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token,
    type: "signup",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

const resetRequestLimiter = rateLimit({ interval: 15 * 60_000, limit: 3 });

/**
 * Sends the reset email. The answer never says whether the account exists: validation, rate
 * limit and delivery failures are reported, an unknown address looks like a success.
 */
export async function resetPasswordRequestAction(raw: unknown) {
  const schema = z.object({ email: EmailSchema });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: authMessages.validation.emailInvalid };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const limit = await resetRequestLimiter.check(email);
  if (!limit.success) {
    return { error: authMessages.forgot.rateLimited };
  }

  const result = await supabaseAuthService.resetPassword(email);

  if (result.error) {
    // Supabase's own text is English and may reveal internals; log it, show a generic line.
    logger.warn("Password reset email failed", { errorMessage: result.error });
    return { error: authMessages.forgot.error };
  }

  return { success: true };
}

export async function updatePasswordAction(raw: unknown) {
  const schema = z.object({ password: PasswordSchema });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.password?.[0] || "Mot de passe invalide" };
  }

  const result = await supabaseAuthService.updatePassword(parsed.data.password);

  if (result.error) {
    if (/different from the old/i.test(result.error)) {
      return { error: authMessages.reset.samePassword };
    }
    logger.warn("Password update failed", { errorMessage: result.error });
    return { error: authMessages.reset.error };
  }

  return { success: true };
}
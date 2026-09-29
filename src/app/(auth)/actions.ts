"use server";

import { z } from "zod";
import { supabaseAuthService } from "@/lib/auth/supabase";
import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { redirect } from "next/navigation";

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

export async function resetPasswordRequestAction(raw: unknown) {
  const schema = z.object({ email: EmailSchema });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Email invalide" };
  }

  const result = await supabaseAuthService.resetPassword(parsed.data.email);

  if (result.error) {
    return { error: result.error };
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
    return { error: result.error };
  }

  return { success: true };
}
"use server";

import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/auth/supabase";

const CreateOrgInput = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(60, "Le nom ne peut pas dépasser 60 caractères"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Identifiant invalide"),
});

export async function createOrgAction(raw: unknown) {
  // Verify the user is authenticated (using their session client)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "NON_AUTHENTIFIÉ" };
  }

  const parsed = CreateOrgInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] || "Données invalides" };
  }

  const { name, slug } = parsed.data;

  // Use service role for privileged writes (bypasses RLS)
  // This is safe because we've already verified auth above
  const admin = createSupabaseServiceRoleClient();

  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existingOrg) {
    return { error: "Cet identifiant est déjà pris" };
  }

  const { data: newOrg, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug, plan: "trial" })
    .select()
    .single();

  if (orgError) {
    console.error("[onboarding] org insert error:", orgError);
    return { error: `Erreur lors de la création de l'organisation: ${orgError.message}` };
  }

  // Create profile if it doesn't exist
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const { error: profileError } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
      });

    if (profileError) {
      console.error("[onboarding] profile insert error:", profileError);
    }
  }

  // Create owner membership
  const { error: memberError } = await admin
    .from("memberships")
    .insert({
      org_id: newOrg.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("[onboarding] membership insert error:", memberError);
  }

  return { success: true, orgId: newOrg.id };
}
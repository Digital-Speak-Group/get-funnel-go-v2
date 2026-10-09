"use server";

import { z } from "zod";
import { supabaseAuthService } from "@/lib/auth/supabase";
import { createOrganizationWithOwner } from "@/server/services/onboarding";

const CreateOrgInput = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(60, "Le nom ne peut pas dépasser 60 caractères"),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Identifiant invalide"),
});

export async function createOrgAction(raw: unknown) {
  const user = await supabaseAuthService.getUser();
  if (!user) {
    return { error: "NON_AUTHENTIFIÉ" };
  }

  const parsed = CreateOrgInput.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] || "Données invalides" };
  }

  try {
    const result = await createOrganizationWithOwner(parsed.data, user);
    if (!result.ok) {
      return { error: "Cet identifiant est déjà pris" };
    }
    return { success: true, orgId: result.orgId };
  } catch (err) {
    console.error("[onboarding] create organization failed:", err);
    return { error: "Erreur lors de la création de l'organisation" };
  }
}

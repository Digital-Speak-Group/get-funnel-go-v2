"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { updateProfile } from "@/lib/db/repositories/profiles";
import { updateOrganization } from "@/lib/db/repositories/organizations";
import { settingsMessages } from "./messages";

const UpdateProfileInput = z.object({
  fullName: z
    .string()
    .trim()
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional(),
  locale: z.enum(["fr"]).default("fr"),
});

export async function updateProfileAction(raw: unknown) {
  const session = await getSession();
  if (!session) {
    return { error: "Non authentifié" };
  }

  const parsed = UpdateProfileInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || settingsMessages.error;
    return { error: issue };
  }

  try {
    await updateProfile(session.userId, {
      fullName: parsed.data.fullName || null,
      locale: parsed.data.locale,
    });

    revalidatePath("/app/settings/profile");
    revalidatePath("/app");
    return { success: true };
  } catch (err) {
    console.error("[settings] updateProfile failed:", err);
    return { error: settingsMessages.error };
  }
}

const UpdateOrganizationInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit comporter au moins 2 caractères")
    .max(60, "Le nom ne peut pas dépasser 60 caractères"),
});

export async function updateOrganizationAction(raw: unknown) {
  const session = await getSession();
  if (!session) {
    return { error: "Non authentifié" };
  }

  if (session.role !== "owner" && session.role !== "admin") {
    return { error: settingsMessages.organization.noPermission };
  }

  const parsed = UpdateOrganizationInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || settingsMessages.error;
    return { error: issue };
  }

  try {
    await updateOrganization(
      { orgId: session.activeOrgId },
      { name: parsed.data.name }
    );

    revalidatePath("/app/settings/organization");
    revalidatePath("/app");
    return { success: true };
  } catch (err) {
    console.error("[settings] updateOrganization failed:", err);
    return { error: settingsMessages.error };
  }
}

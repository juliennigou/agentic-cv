"use server";

import { updateUserProfile } from "@agentic-cv/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";

import { identitySchema, preferencesSchema } from "./profile-schema";

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

/** Onglet « Profil » : enregistre l'identité & le contact (mise à jour partielle). */
export async function updateIdentity(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const parsed = identitySchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    location: formData.get("location")
  });

  if (!parsed.success) {
    return { status: "error", message: "Certains champs sont invalides ou trop longs." };
  }

  await updateUserProfile(user.id, parsed.data);
  revalidatePath("/compte/profil");

  return { status: "success", message: "Profil mis à jour." };
}

/** Onglet « Recherche » : enregistre les préférences (rôles & pays visés). */
export async function updatePreferences(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const parsed = preferencesSchema.safeParse({
    targetRoles: formData.get("targetRoles"),
    targetCountries: formData.get("targetCountries")
  });

  if (!parsed.success) {
    return { status: "error", message: "Certains champs sont invalides ou trop longs." };
  }

  await updateUserProfile(user.id, parsed.data);
  revalidatePath("/compte/recherche");

  return { status: "success", message: "Préférences enregistrées." };
}

"use server";

import { updateUserProfile } from "@agentic-cv/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";

import { profileFormSchema } from "./profile-schema";

type ProfileActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

export async function updateProfile(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const parsed = profileFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    location: formData.get("location"),
    targetRoles: formData.get("targetRoles"),
    targetCountries: formData.get("targetCountries"),
    skills: formData.get("skills"),
    languages: formData.get("languages")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Certains champs sont invalides ou trop longs."
    };
  }

  await updateUserProfile(user.id, parsed.data);
  revalidatePath("/compte");

  return {
    status: "success",
    message: "Profil mis à jour."
  };
}

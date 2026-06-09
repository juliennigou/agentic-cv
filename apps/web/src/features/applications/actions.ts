"use server";

import {
  createOrGetApplicationWorkspace,
  saveApplicationDraft as persistApplicationDraft,
  validateApplicationWorkspace
} from "@agentic-cv/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";
import { getSafeNextPath } from "@/features/auth/redirects";

import {
  applicationDraftSchema,
  applicationValidateSchema,
  prepareApplicationSchema,
  toArtifactInputs
} from "./application-schema";

/**
 * CTA « Préparer ma candidature » : connecte si besoin, crée/récupère le
 * workspace, puis redirige vers `/candidatures/[id]`.
 */
export async function prepareApplication(formData: FormData): Promise<void> {
  const parsed = prepareApplicationSchema.parse({
    jobOfferId: formData.get("jobOfferId"),
    returnTo: formData.get("returnTo")
  });
  const user = await getCurrentUser();

  if (!user) {
    const continueParams = new URLSearchParams({
      prepareJobOfferId: parsed.jobOfferId,
      returnTo: getSafeNextPath(parsed.returnTo)
    });
    redirect(
      `/connexion?next=${encodeURIComponent(`/auth/continue?${continueParams.toString()}`)}`
    );
  }

  const applicationId = await createOrGetApplicationWorkspace({
    userId: user.id,
    jobOfferId: parsed.jobOfferId
  });

  redirect(`/candidatures/${applicationId}`);
}

/** Enregistre un brouillon (contenus facultatifs) puis reste sur la page. */
export async function saveApplicationDraft(formData: FormData): Promise<void> {
  const parsed = applicationDraftSchema.parse({
    applicationId: formData.get("applicationId"),
    language: formData.get("language") ?? "fr",
    chatgptConversationUrl: formData.get("chatgptConversationUrl") ?? "",
    targetedResume: formData.get("targetedResume") ?? "",
    coverLetter: formData.get("coverLetter") ?? "",
    recruiterMessage: formData.get("recruiterMessage") ?? ""
  });
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  await persistApplicationDraft({
    userId: user.id,
    applicationId: parsed.applicationId,
    language: parsed.language,
    chatgptConversationUrl: parsed.chatgptConversationUrl || null,
    artifacts: toArtifactInputs(parsed)
  });

  revalidatePath(`/candidatures/${parsed.applicationId}`);
  revalidatePath("/mes-vie");
}

/** Valide le dossier : exige les trois contenus, persiste, puis fige la version. */
export async function validateApplicationDraft(formData: FormData): Promise<void> {
  const parsed = applicationValidateSchema.parse({
    applicationId: formData.get("applicationId"),
    language: formData.get("language") ?? "fr",
    chatgptConversationUrl: formData.get("chatgptConversationUrl") ?? "",
    targetedResume: formData.get("targetedResume") ?? "",
    coverLetter: formData.get("coverLetter") ?? "",
    recruiterMessage: formData.get("recruiterMessage") ?? ""
  });
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  await persistApplicationDraft({
    userId: user.id,
    applicationId: parsed.applicationId,
    language: parsed.language,
    chatgptConversationUrl: parsed.chatgptConversationUrl || null,
    artifacts: toArtifactInputs(parsed)
  });
  await validateApplicationWorkspace({
    userId: user.id,
    applicationId: parsed.applicationId,
    language: parsed.language
  });

  revalidatePath(`/candidatures/${parsed.applicationId}`);
  revalidatePath("/mes-vie");
}

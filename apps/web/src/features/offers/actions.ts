"use server";

import { removeSavedJobForUser, saveJobForUser, setUserJobApplicationStatus } from "@agentic-cv/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/current-user";
import { getSafeNextPath } from "@/features/auth/redirects";

import { TRACKED_OFFER_STATUSES } from "./status";

const favoriteActionSchema = z.object({
  jobOfferId: z.string().uuid(),
  intent: z.enum(["save", "remove"]),
  returnTo: z.string().default("/")
});

const statusActionSchema = z.object({
  jobOfferId: z.string().uuid(),
  status: z.enum(TRACKED_OFFER_STATUSES),
  returnTo: z.string().default("/mes-vie")
});

export async function toggleFavoriteJob(formData: FormData) {
  const parsed = favoriteActionSchema.parse({
    jobOfferId: formData.get("jobOfferId"),
    intent: formData.get("intent"),
    returnTo: formData.get("returnTo")
  });
  const returnTo = getSafeNextPath(parsed.returnTo);
  const user = await getCurrentUser();

  if (!user) {
    const continuePath = new URLSearchParams({
      favoriteJobOfferId: parsed.jobOfferId,
      returnTo
    });
    redirect(`/connexion?next=${encodeURIComponent(`/auth/continue?${continuePath.toString()}`)}`);
  }

  if (parsed.intent === "save") {
    await saveJobForUser(user.id, parsed.jobOfferId);
  } else {
    await removeSavedJobForUser(user.id, parsed.jobOfferId);
  }

  revalidatePath("/");
  revalidatePath("/offres");
  revalidatePath(`/offres/${parsed.jobOfferId}`);
  revalidatePath("/mes-vie");
  revalidatePath("/rapport");
  redirect(returnTo);
}

export async function updateJobApplicationStatus(formData: FormData) {
  const parsed = statusActionSchema.parse({
    jobOfferId: formData.get("jobOfferId"),
    status: formData.get("status"),
    returnTo: formData.get("returnTo")
  });
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(getSafeNextPath(parsed.returnTo))}`);
  }

  await setUserJobApplicationStatus({
    userId: user.id,
    jobOfferId: parsed.jobOfferId,
    status: parsed.status
  });

  revalidatePath(`/offres/${parsed.jobOfferId}`);
  revalidatePath("/mes-vie");
  redirect(getSafeNextPath(parsed.returnTo));
}

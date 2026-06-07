"use server";

import { createHash, randomUUID } from "node:crypto";

import { isResumeStructuringConfigured, structureResume } from "@agentic-cv/ai";
import { createUserDocument, saveUserResume } from "@agentic-cv/db";
import { EmptyPdfTextError, extractPdfText } from "@agentic-cv/documents";
import { resumeSchema, type Resume } from "@agentic-cv/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/current-user";
import {
  createAdminClient,
  isStorageConfigured,
  USER_DOCUMENTS_BUCKET
} from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type UploadResumeState = {
  // parsed       : texte extrait + CV structuré, prêt pour la relecture
  // uploaded      : fichier conservé mais parsing IA indisponible
  // error         : refus (fichier invalide) ou échec d'extraction
  status: "idle" | "error" | "parsed" | "uploaded";
  message: string | null;
  resume: Resume | null;
};

const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Aucun fichier reçu." })
    .refine((file) => file.size > 0, "Le fichier est vide.")
    .refine((file) => file.size <= MAX_FILE_BYTES, "Le PDF dépasse 5 Mo.")
    .refine((file) => file.type === "application/pdf", "Seuls les fichiers PDF sont acceptés.")
});

/**
 * Dépose un CV PDF : conserve le fichier (Supabase Storage) si possible, extrait
 * le texte en local (gratuit) puis le structure via LiteLLM. Ne touche PAS au
 * profil : renvoie le CV structuré au client pour relecture avant enregistrement.
 */
export async function uploadResume(
  _state: UploadResumeState,
  formData: FormData
): Promise<UploadResumeState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const parsed = uploadSchema.safeParse({ file: formData.get("file") });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Fichier invalide.",
      resume: null
    };
  }

  const file = parsed.data.file;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (isStorageConfigured()) {
    try {
      await persistResumeFile(user.id, file, bytes);
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? `Échec de l'enregistrement du fichier : ${error.message}`
            : "Échec de l'enregistrement du fichier.",
        resume: null
      };
    }
  }

  let rawText: string;
  try {
    rawText = await extractPdfText(bytes);
  } catch (error) {
    if (error instanceof EmptyPdfTextError) {
      return {
        status: "error",
        message: `${error.message} Renseigne ton profil manuellement ou dépose un PDF texte.`,
        resume: null
      };
    }
    return {
      status: "error",
      message: "Impossible de lire le PDF. Vérifie le fichier et réessaie.",
      resume: null
    };
  }

  if (!isResumeStructuringConfigured()) {
    return {
      status: "uploaded",
      message:
        "CV enregistré. Le parsing automatique est indisponible (IA non configurée) : complète ton profil manuellement.",
      resume: null
    };
  }

  try {
    const resume = await structureResume(rawText);
    return {
      status: "parsed",
      message: "CV analysé. Vérifie les informations ci-dessous avant d'enregistrer.",
      resume
    };
  } catch {
    return {
      status: "error",
      message:
        "L'analyse automatique du CV a échoué. Réessaie ou complète ton profil manuellement.",
      resume: null
    };
  }
}

export type SaveResumeState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

/** Aplati le CV vers les champs `skills[]`/`languages[]` du profil. */
function flattenSkills(resume: Resume): string[] {
  return Array.from(
    new Set([...resume.skills, ...resume.tools].map((s) => s.trim()).filter(Boolean))
  );
}

function flattenLanguages(resume: Resume): string[] {
  return resume.languages
    .map((entry) => (entry.level ? `${entry.language} ${entry.level}` : entry.language))
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Enregistre le profil à partir du CV relu/corrigé par l'utilisateur. Reçoit le
 * CV sérialisé (JSON) depuis le formulaire de relecture, le revalide, puis écrit
 * `resumeData` + synchronise les champs plats (skills/languages, contact).
 */
export async function saveResumeProfile(
  _state: SaveResumeState,
  formData: FormData
): Promise<SaveResumeState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const raw = formData.get("resume");

  if (typeof raw !== "string") {
    return { status: "error", message: "Données du CV manquantes." };
  }

  let resume: Resume;
  try {
    resume = resumeSchema.parse(JSON.parse(raw));
  } catch {
    return { status: "error", message: "Données du CV invalides." };
  }

  const contact = resume.contact ?? {};

  await saveUserResume(user.id, {
    resume,
    skills: flattenSkills(resume),
    languages: flattenLanguages(resume),
    firstName: contact.firstName ?? undefined,
    lastName: contact.lastName ?? undefined,
    phone: contact.phone ?? undefined,
    location: contact.location ?? undefined
  });

  revalidatePath("/compte");

  return { status: "success", message: "Profil mis à jour depuis ton CV." };
}

/** Upload du PDF dans le bucket privé + trace en base (`user_documents`). */
async function persistResumeFile(userId: string, file: File, bytes: Uint8Array): Promise<void> {
  const admin = createAdminClient();
  const storagePath = `${userId}/${randomUUID()}.pdf`;

  const { error } = await admin.storage.from(USER_DOCUMENTS_BUCKET).upload(storagePath, bytes, {
    contentType: "application/pdf",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  const checksum = createHash("sha256").update(bytes).digest("hex");

  await createUserDocument({
    userId,
    type: "base_resume",
    fileName: file.name,
    storagePath,
    mimeType: "application/pdf",
    sizeBytes: file.size,
    checksum
  });
}

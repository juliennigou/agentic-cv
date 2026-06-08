import type {
  ApplicationArtifactKind,
  ApplicationArtifactStatus,
  ApplicationStatus
} from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateUserProfile } from "./user-profile-repository";

/** Les trois documents préparés pour une candidature. */
export const APPLICATION_ARTIFACT_KINDS = [
  "targeted_resume",
  "cover_letter",
  "recruiter_message"
] as const satisfies readonly ApplicationArtifactKind[];

const workspaceOfferSelect = {
  id: true,
  title: true,
  companyName: true,
  country: true,
  city: true,
  contractType: true,
  durationMonths: true,
  description: true,
  companyDescription: true,
  requirements: true,
  sourceUrl: true
} as const;

export type ApplicationWorkspaceArtifact = {
  contentText: string | null;
  status: ApplicationArtifactStatus;
  validatedAt: Date | null;
};

export type ApplicationWorkspace = {
  id: string;
  status: ApplicationStatus;
  chatgptConversationUrl: string | null;
  validatedAt: Date | null;
  offer: {
    id: string;
    title: string;
    companyName: string | null;
    country: string | null;
    city: string | null;
    contractType: string | null;
    durationMonths: number | null;
    description: string;
    companyDescription: string | null;
    requirements: string | null;
    sourceUrl: string;
  };
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    location: string | null;
    targetRoles: string[];
    targetCountries: string[];
    skills: string[];
    languages: string[];
    resumeData: unknown;
  };
  artifacts: Record<ApplicationArtifactKind, ApplicationWorkspaceArtifact>;
};

export type SaveApplicationDraftInput = {
  userId: string;
  applicationId: string;
  chatgptConversationUrl?: string | null;
  artifacts: Array<{ kind: ApplicationArtifactKind; contentText: string }>;
};

export type ValidateApplicationWorkspaceInput = {
  userId: string;
  applicationId: string;
};

/**
 * Point d'entrée du parcours « Préparer ma candidature » : garantit le profil,
 * sauvegarde l'offre en favori, puis crée/récupère la candidature. L'`upsert`
 * ne touche pas au `status` existant (axe pipeline unique) ; on le passe à
 * `in_progress` seulement à la création. Renvoie l'`applicationId`.
 */
export async function createOrGetApplicationWorkspace(input: {
  userId: string;
  jobOfferId: string;
}): Promise<string> {
  const { userId, jobOfferId } = input;
  await getOrCreateUserProfile({ userId });

  const [, application] = await prisma.$transaction([
    prisma.savedJob.upsert({
      where: { userId_jobOfferId: { userId, jobOfferId } },
      update: {},
      create: { userId, jobOfferId }
    }),
    prisma.application.upsert({
      where: { userId_jobOfferId: { userId, jobOfferId } },
      update: {},
      create: { userId, jobOfferId, status: "in_progress" },
      select: { id: true }
    })
  ]);

  return application.id;
}

/**
 * Charge le workspace d'une candidature appartenant à l'utilisateur (offre,
 * profil, artefacts). Renvoie `null` si la candidature n'existe pas ou n'est pas
 * la sienne (la route répond alors `notFound()`).
 */
export async function getApplicationWorkspace(input: {
  userId: string;
  applicationId: string;
}): Promise<ApplicationWorkspace | null> {
  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, userId: input.userId },
    select: {
      id: true,
      status: true,
      chatgptConversationUrl: true,
      validatedAt: true,
      jobOffer: { select: workspaceOfferSelect },
      artifacts: {
        select: { kind: true, contentText: true, status: true, validatedAt: true }
      }
    }
  });

  if (!application) {
    return null;
  }

  const profile = await getOrCreateUserProfile({ userId: input.userId });

  const artifactByKind = new Map(
    application.artifacts.map((artifact) => [artifact.kind, artifact])
  );
  const artifacts = Object.fromEntries(
    APPLICATION_ARTIFACT_KINDS.map((kind) => {
      const artifact = artifactByKind.get(kind);
      return [
        kind,
        {
          contentText: artifact?.contentText ?? null,
          status: artifact?.status ?? "draft",
          validatedAt: artifact?.validatedAt ?? null
        } satisfies ApplicationWorkspaceArtifact
      ];
    })
  ) as Record<ApplicationArtifactKind, ApplicationWorkspaceArtifact>;

  return {
    id: application.id,
    status: application.status,
    chatgptConversationUrl: application.chatgptConversationUrl,
    validatedAt: application.validatedAt,
    offer: application.jobOffer,
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      location: profile.location,
      targetRoles: profile.targetRoles,
      targetCountries: profile.targetCountries,
      skills: profile.skills,
      languages: profile.languages,
      resumeData: profile.resumeData
    },
    artifacts
  };
}

/**
 * Enregistre un brouillon : URL ChatGPT + contenu des trois artefacts. Un
 * artefact non vide passe en `pasted`, vide en `draft`. Vérifie l'appartenance.
 */
export async function saveApplicationDraft(input: SaveApplicationDraftInput): Promise<void> {
  await assertApplicationOwnership(input.userId, input.applicationId);

  await prisma.$transaction([
    prisma.application.update({
      where: { id: input.applicationId },
      data: { chatgptConversationUrl: input.chatgptConversationUrl ?? null }
    }),
    ...input.artifacts.map((artifact) => {
      const trimmed = artifact.contentText.trim();
      const status: ApplicationArtifactStatus = trimmed.length > 0 ? "pasted" : "draft";
      return prisma.applicationArtifact.upsert({
        where: {
          applicationId_kind: { applicationId: input.applicationId, kind: artifact.kind }
        },
        update: { contentText: trimmed, status },
        create: {
          applicationId: input.applicationId,
          kind: artifact.kind,
          contentText: trimmed,
          status
        }
      });
    })
  ]);
}

/**
 * Valide le dossier : exige les trois contenus non vides, passe la candidature
 * en `completed` + `validatedAt`, et marque chaque artefact `validated`.
 */
export async function validateApplicationWorkspace(
  input: ValidateApplicationWorkspaceInput
): Promise<void> {
  await assertApplicationOwnership(input.userId, input.applicationId);

  const artifacts = await prisma.applicationArtifact.findMany({
    where: { applicationId: input.applicationId },
    select: { kind: true, contentText: true }
  });
  const filledKinds = new Set(
    artifacts
      .filter((artifact) => (artifact.contentText ?? "").trim().length > 0)
      .map((artifact) => artifact.kind)
  );
  const missing = APPLICATION_ARTIFACT_KINDS.filter((kind) => !filledKinds.has(kind));
  if (missing.length > 0) {
    throw new Error(`Validation impossible : artefacts manquants (${missing.join(", ")}).`);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.application.update({
      where: { id: input.applicationId },
      data: { status: "completed", validatedAt: now }
    }),
    prisma.applicationArtifact.updateMany({
      where: { applicationId: input.applicationId },
      data: { status: "validated", validatedAt: now }
    })
  ]);
}

async function assertApplicationOwnership(userId: string, applicationId: string): Promise<void> {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    select: { id: true }
  });
  if (!application) {
    throw new Error("Candidature introuvable ou non autorisée.");
  }
}

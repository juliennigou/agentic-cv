import { embedTexts, isEmbeddingConfigured } from "@agentic-cv/ai";
import {
  listProfilesNeedingEmbedding,
  setProfileEmbedding,
  upsertJobOfferMatches,
  type ProfileNeedingEmbedding
} from "@agentic-cv/db";
import { resumeSchema } from "@agentic-cv/shared";

export type MatchJobOffersOptions = {
  /** Nombre de profils par appel batch d'embedding. */
  batchSize?: number;
  /** Plafond de profils embarqués sur ce run (utile pour tester). */
  maxProfiles?: number;
  log?: (message: string) => void;
};

export type MatchJobOffersResult = {
  status: "success" | "skipped" | "partial_success" | "failed";
  profilesEmbedded: number;
  matchesCreated: number;
  errors: string[];
};

const DEFAULT_BATCH_SIZE = 50;

type EmbeddingField = {
  label: string;
  value: string | null | undefined;
};

function formatEmbeddingField({ label, value }: EmbeddingField): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? `${label}: ${trimmed}` : null;
}

function joinList(values: string[]): string {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .join(", ");
}

/**
 * Texte indexé pour un profil : aspirations (rôles/pays visés), compétences et
 * synthèse du CV. On garde les intitulés d'expériences/formations (signal métier)
 * sans recopier les descriptions pour ne pas noyer le vecteur.
 */
function buildProfileEmbeddingText(profile: ProfileNeedingEmbedding): string {
  // Le CV est une donnée externe stockée en Json : on revalide à la frontière.
  const resume = resumeSchema.parse(profile.resumeData ?? {});

  const experiences = resume.experiences
    .map((experience) => [experience.title, experience.company].filter(Boolean).join(" — "))
    .filter((line) => line.length > 0)
    .join(" ; ");
  const education = resume.education
    .map((entry) => [entry.degree, entry.field, entry.school].filter(Boolean).join(" — "))
    .filter((line) => line.length > 0)
    .join(" ; ");

  return [
    { label: "Rôles visés", value: joinList(profile.targetRoles) },
    { label: "Pays visés", value: joinList(profile.targetCountries) },
    { label: "Localisation", value: profile.location },
    { label: "Compétences", value: joinList(profile.skills) },
    { label: "Langues", value: joinList(profile.languages) },
    { label: "Profil", value: resume.summary },
    { label: "Expériences", value: experiences },
    { label: "Formations", value: education }
  ]
    .map(formatEmbeddingField)
    .filter((part): part is string => part !== null)
    .join("\n");
}

async function embedPendingProfiles(
  options: MatchJobOffersOptions,
  result: MatchJobOffersResult
): Promise<void> {
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

  for (;;) {
    const remaining =
      options.maxProfiles !== undefined
        ? options.maxProfiles - result.profilesEmbedded
        : Number.POSITIVE_INFINITY;
    if (remaining <= 0) {
      break;
    }

    const limit = Math.min(batchSize, remaining);
    const profiles = await listProfilesNeedingEmbedding(limit);
    if (profiles.length === 0) {
      options.log?.("[match] no profile pending embedding");
      break;
    }

    try {
      options.log?.(`[match] embedding ${profiles.length} profiles`);
      const embeddings = await embedTexts(profiles.map(buildProfileEmbeddingText), {
        taskType: "RETRIEVAL_DOCUMENT"
      });

      for (let index = 0; index < profiles.length; index += 1) {
        await setProfileEmbedding(profiles[index].userId, embeddings[index]);
      }

      result.profilesEmbedded += profiles.length;
    } catch (error) {
      // On stoppe au premier échec de lot pour ne pas marteler l'API ;
      // les profils restent à embarquer et seront retentés au prochain run.
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.status = "partial_success";
      options.log?.(`[match] profile embedding failed for ${profiles.length} profiles`);
      break;
    }
  }
}

/**
 * Passe de matching : embarque les profils en attente puis calcule (set-based)
 * les matchs des nouvelles offres pour chaque profil embarqué.
 *
 * Idempotente, dégrade proprement si LiteLLM n'est pas configuré. Un échec ici
 * ne doit jamais faire échouer l'ingestion (intégré après l'embedding).
 */
export async function runMatchJobOffers(
  options: MatchJobOffersOptions = {}
): Promise<MatchJobOffersResult> {
  const result: MatchJobOffersResult = {
    status: "success",
    profilesEmbedded: 0,
    matchesCreated: 0,
    errors: []
  };

  if (!isEmbeddingConfigured()) {
    result.status = "skipped";
    result.errors.push("LITELLM_BASE_URL ou LITELLM_API_KEY absent ; passe de matching ignorée.");
    options.log?.("[match] skipped: LiteLLM non configuré");
    return result;
  }

  options.log?.("[match] started");
  await embedPendingProfiles(options, result);

  try {
    result.matchesCreated = await upsertJobOfferMatches();
    options.log?.(`[match] upserted ${result.matchesCreated} matches`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.status = result.profilesEmbedded > 0 ? "partial_success" : "failed";
    options.log?.("[match] match computation failed");
  }

  options.log?.(
    `[match] done: status=${result.status}, profilesEmbedded=${result.profilesEmbedded}, matchesCreated=${result.matchesCreated}, errors=${result.errors.length}`
  );

  return result;
}

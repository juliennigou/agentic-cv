import { prisma } from "../client";

/**
 * Accès à la colonne vectorielle `user_profiles.embedding`.
 *
 * Prisma ne type pas `vector`, donc ces opérations passent par des requêtes
 * brutes — encapsulées ici pour respecter la règle « accès DB via repository ».
 */

export type ProfileNeedingEmbedding = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  location: string | null;
  targetRoles: string[];
  targetCountries: string[];
  skills: string[];
  languages: string[];
  // CV structuré brut ; validé via `resumeSchema` côté runner avant usage.
  resumeData: unknown;
};

/**
 * Profils à (ré)embarquer : jamais embarqués ou modifiés depuis le dernier
 * embedding (`updated_at > embedding_updated_at`).
 */
export async function listProfilesNeedingEmbedding(
  limit: number
): Promise<ProfileNeedingEmbedding[]> {
  return prisma.$queryRaw<ProfileNeedingEmbedding[]>`
    SELECT
      user_id::text AS "userId",
      first_name AS "firstName",
      last_name AS "lastName",
      location,
      target_roles AS "targetRoles",
      target_countries AS "targetCountries",
      skills,
      languages,
      resume_data AS "resumeData"
    FROM user_profiles
    WHERE embedding IS NULL
      OR embedding_updated_at IS NULL
      OR updated_at > embedding_updated_at
    ORDER BY updated_at ASC
    LIMIT ${limit}
  `;
}

/** Écrit l'embedding d'un profil et marque l'horodatage de calcul. */
export async function setProfileEmbedding(userId: string, embedding: number[]): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE user_profiles
    SET embedding = ${vectorLiteral}::vector,
        embedding_updated_at = now()
    WHERE user_id = ${userId}::uuid
  `;
}

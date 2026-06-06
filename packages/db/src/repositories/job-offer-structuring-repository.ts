import { prisma } from "../client";

/**
 * Accès aux offres pour la passe de structuration LLM (mission ↔ entreprise).
 *
 * `setOfferStructured` remet aussi `embedding = NULL` : une offre restructurée
 * doit être ré-embeddée sur son texte nettoyé. Le passage par $executeRaw est
 * nécessaire car Prisma ne type pas la colonne `vector`.
 */

export type OfferNeedingStructuring = {
  id: string;
  title: string;
  companyName: string | null;
  description: string;
  companyDescription: string | null;
};

/** Offres actives en attente de structuration (`structured_at IS NULL`). */
export async function listOffersNeedingStructuring(
  limit: number
): Promise<OfferNeedingStructuring[]> {
  return prisma.$queryRaw<OfferNeedingStructuring[]>`
    SELECT
      id::text AS id,
      title,
      company_name AS "companyName",
      description,
      company_description AS "companyDescription"
    FROM job_offers
    WHERE structured_at IS NULL
      AND is_active = true
    ORDER BY first_seen_at ASC
    LIMIT ${limit}
  `;
}

/**
 * Écrit les champs structurés d'une offre, l'horodate et invalide son embedding
 * (qui sera recalculé par la passe d'embedding sur le texte nettoyé).
 */
export async function setOfferStructured(
  id: string,
  fields: {
    description: string;
    companyDescription: string | null;
    companyDescriptionGenerated: boolean;
  }
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE job_offers
    SET description = ${fields.description},
        company_description = ${fields.companyDescription},
        company_description_generated = ${fields.companyDescriptionGenerated},
        structured_at = now(),
        embedding = NULL
    WHERE id = ${id}::uuid
  `;
}

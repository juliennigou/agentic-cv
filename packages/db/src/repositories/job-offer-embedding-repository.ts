import { prisma } from "../client";

/**
 * Accès à la colonne vectorielle `job_offers.embedding`.
 *
 * Prisma ne type pas `vector`, donc ces opérations passent par des requêtes
 * brutes — encapsulées ici pour respecter la règle « accès DB via repository ».
 */

export type OfferNeedingEmbedding = {
  id: string;
  title: string;
  companyName: string | null;
  city: string | null;
  country: string | null;
  description: string;
};

/** Offres actives en attente d'embedding (sert au flux quotidien comme au backfill). */
export async function listOffersNeedingEmbedding(limit: number): Promise<OfferNeedingEmbedding[]> {
  return prisma.$queryRaw<OfferNeedingEmbedding[]>`
    SELECT
      id::text AS id,
      title,
      company_name AS "companyName",
      city,
      country,
      description
    FROM job_offers
    WHERE embedding IS NULL
      AND is_active = true
    ORDER BY first_seen_at ASC
    LIMIT ${limit}
  `;
}

/** Nombre d'offres actives restant à embedder (pour le reporting). */
export async function countOffersNeedingEmbedding(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM job_offers
    WHERE embedding IS NULL
      AND is_active = true
  `;

  return Number(rows[0]?.count ?? 0);
}

/** Écrit l'embedding d'une offre. */
export async function setOfferEmbedding(id: string, embedding: number[]): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE job_offers
    SET embedding = ${vectorLiteral}::vector
    WHERE id = ${id}::uuid
  `;
}

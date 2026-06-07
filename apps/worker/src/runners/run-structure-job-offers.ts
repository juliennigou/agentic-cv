import { isStructuringConfigured, structureOffers } from "@agentic-cv/ai";
import {
  listOffersNeedingStructuring,
  setOfferStructured,
  type OfferNeedingStructuring
} from "@agentic-cv/db";

export type StructureJobOffersOptions = {
  /** Nombre d'offres par appel LLM. */
  batchSize?: number;
  /** Plafond d'offres traitées sur ce run (utile pour tester). */
  maxOffers?: number;
  log?: (message: string) => void;
};

export type StructureJobOffersResult = {
  status: "success" | "skipped" | "partial_success" | "failed";
  structured: number;
  batches: number;
  failed: number;
  errors: string[];
};

const DEFAULT_BATCH_SIZE = 5;

/**
 * Passe de structuration : sépare mission ↔ entreprise sur les offres dont
 * `structured_at IS NULL`. Invalide l'embedding (via le repository) pour qu'il
 * soit recalculé sur le texte nettoyé.
 *
 * Idempotente et découplée du scraping — calquée sur la passe d'embedding :
 * un échec LLM laisse l'offre non structurée, retentée au prochain run.
 */
export async function runStructureJobOffers(
  options: StructureJobOffersOptions = {}
): Promise<StructureJobOffersResult> {
  const result: StructureJobOffersResult = {
    status: "success",
    structured: 0,
    batches: 0,
    failed: 0,
    errors: []
  };

  if (!isStructuringConfigured()) {
    result.status = "skipped";
    result.errors.push(
      "LITELLM_BASE_URL ou LITELLM_API_KEY absent ; passe de structuration ignorée."
    );
    options.log?.("[structure] skipped: LiteLLM non configuré");
    return result;
  }

  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  options.log?.(`[structure] started: batchSize=${batchSize}`);

  for (;;) {
    const remaining =
      options.maxOffers !== undefined
        ? options.maxOffers - result.structured
        : Number.POSITIVE_INFINITY;
    if (remaining <= 0) {
      break;
    }

    const limit = Math.min(batchSize, remaining);
    const offers: OfferNeedingStructuring[] = await listOffersNeedingStructuring(limit);
    if (offers.length === 0) {
      options.log?.("[structure] no pending offers");
      break;
    }

    try {
      options.log?.(`[structure] batch ${result.batches + 1}: processing ${offers.length} offers`);
      const structured = await structureOffers(
        offers.map((offer) => ({
          id: offer.id,
          title: offer.title,
          companyName: offer.companyName,
          description: offer.description,
          companyDescription: offer.companyDescription
        }))
      );

      for (const item of structured) {
        await setOfferStructured(item.id, {
          description: item.description,
          companyDescription: item.companyDescription,
          companyDescriptionGenerated: item.companyDescriptionGenerated
        });
      }

      result.structured += structured.length;
      result.batches += 1;
      options.log?.(
        `[structure] batch ${result.batches}: structured=${structured.length}, total=${result.structured}`
      );
    } catch (error) {
      // On stoppe au premier échec de lot pour ne pas marteler l'API ;
      // les offres restent non structurées et seront retentées au prochain run.
      result.failed += offers.length;
      result.errors.push(error instanceof Error ? error.message : String(error));
      options.log?.(`[structure] failed: batch=${result.batches + 1}, offers=${offers.length}`);
      break;
    }
  }

  if (result.failed > 0) {
    result.status = result.structured > 0 ? "partial_success" : "failed";
  }
  options.log?.(
    `[structure] done: status=${result.status}, structured=${result.structured}, batches=${result.batches}, failed=${result.failed}`
  );

  return result;
}

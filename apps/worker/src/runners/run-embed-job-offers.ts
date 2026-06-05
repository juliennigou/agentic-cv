import { embedTexts, isEmbeddingConfigured } from "@agentic-cv/ai";
import {
  listOffersNeedingEmbedding,
  setOfferEmbedding,
  type OfferNeedingEmbedding
} from "@agentic-cv/db";

export type EmbedJobOffersOptions = {
  /** Nombre d'offres par appel batch Gemini. */
  batchSize?: number;
  /** Plafond d'offres traitées sur ce run (utile pour tester). */
  maxOffers?: number;
};

export type EmbedJobOffersResult = {
  status: "success" | "skipped" | "partial_success" | "failed";
  embedded: number;
  batches: number;
  failed: number;
  errors: string[];
};

const DEFAULT_BATCH_SIZE = 100;

/** Texte indexé pour une offre : titre, entreprise, localisation, description. */
function buildOfferEmbeddingText(offer: OfferNeedingEmbedding): string {
  const location = [offer.city, offer.country].filter(Boolean).join(" ");

  return [offer.title, offer.companyName, location, offer.description]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(". ");
}

/**
 * Passe d'embedding : traite par lots les offres dont `embedding IS NULL`.
 *
 * Idempotente — couvre à la fois les nouvelles offres et le backfill initial.
 * Découplée du scraping : un échec Gemini n'impacte jamais l'ingestion.
 */
export async function runEmbedJobOffers(
  options: EmbedJobOffersOptions = {}
): Promise<EmbedJobOffersResult> {
  const result: EmbedJobOffersResult = {
    status: "success",
    embedded: 0,
    batches: 0,
    failed: 0,
    errors: []
  };

  if (!isEmbeddingConfigured()) {
    result.status = "skipped";
    result.errors.push("GOOGLE_AI_API_KEY absente ; passe d'embedding ignorée.");
    return result;
  }

  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

  for (;;) {
    const remaining =
      options.maxOffers !== undefined
        ? options.maxOffers - result.embedded
        : Number.POSITIVE_INFINITY;
    if (remaining <= 0) {
      break;
    }

    const limit = Math.min(batchSize, remaining);
    const offers = await listOffersNeedingEmbedding(limit);
    if (offers.length === 0) {
      break;
    }

    try {
      const embeddings = await embedTexts(offers.map(buildOfferEmbeddingText), {
        taskType: "RETRIEVAL_DOCUMENT"
      });

      for (let index = 0; index < offers.length; index += 1) {
        await setOfferEmbedding(offers[index].id, embeddings[index]);
      }

      result.embedded += offers.length;
      result.batches += 1;
    } catch (error) {
      // On stoppe au premier échec de lot pour ne pas marteler l'API ;
      // les offres restent NULL et seront retentées au prochain run.
      result.failed += offers.length;
      result.errors.push(error instanceof Error ? error.message : String(error));
      break;
    }
  }

  if (result.failed > 0) {
    result.status = result.embedded > 0 ? "partial_success" : "failed";
  }

  return result;
}

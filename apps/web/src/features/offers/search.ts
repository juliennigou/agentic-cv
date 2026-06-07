import "server-only";

import { embedQuery } from "@agentic-cv/ai";
import { searchJobOffers, type JobOfferSearchResult } from "@agentic-cv/db";
import { isRegionKey, regionCountryCodes, type RegionKey } from "@agentic-cv/shared";

import type { OfferListItem } from "./offer-view";
import { withUserOfferStates } from "./user-offer-state";

/** Filtres de recherche normalisés depuis les query params. */
export type OfferSearchCriteria = {
  query: string;
  region: RegionKey | null;
  country: string | null;
};

const PAGE_SIZE = 50;

/** Normalise les `searchParams` bruts (toujours string | string[] | undefined). */
export function parseSearchCriteria(
  params: Record<string, string | string[] | undefined>
): OfferSearchCriteria {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const query = first(params.q).trim();
  const regionRaw = first(params.region).trim();
  const country = first(params.country).trim().toUpperCase();

  return {
    query,
    region: isRegionKey(regionRaw) ? regionRaw : null,
    country: country.length > 0 ? country : null
  };
}

/**
 * Résout les codes pays à filtrer : un pays précis prime sur la région ;
 * sinon on prend tous les pays de la région ; sinon aucun filtre (tous pays).
 */
function resolveCountryCodes(criteria: OfferSearchCriteria): string[] {
  if (criteria.country) {
    return [criteria.country];
  }
  if (criteria.region) {
    return regionCountryCodes(criteria.region);
  }
  return [];
}

/** Exécute la recherche hybride à partir des critères normalisés. */
export async function runOfferSearch(
  criteria: OfferSearchCriteria,
  userId?: string | null
): Promise<OfferListItem[]> {
  const queryVector = criteria.query.length > 0 ? await embedQuery(criteria.query) : null;

  const offers: JobOfferSearchResult[] = await searchJobOffers({
    query: criteria.query,
    countryCodes: resolveCountryCodes(criteria),
    queryVector,
    limit: PAGE_SIZE
  });

  return withUserOfferStates(offers, userId);
}

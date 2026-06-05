import type { JobScraper, RawJobOffer, ScraperExtractOptions } from "@agentic-cv/scraper-core";

import { mapBusinessFranceJob } from "./business-france-mapper";
import type {
  BusinessFranceApiOfferDetail,
  BusinessFranceApiOfferSummary,
  BusinessFranceSearchPayload,
  BusinessFranceSearchResponse
} from "./business-france-types";

const DEFAULT_API_BASE_URL = "https://civiweb-api-prd.azurewebsites.net";
const DEFAULT_PUBLIC_BASE_URL = "https://mon-vie-via.businessfrance.fr/en/offres";
const DEFAULT_LIMIT = 50;
const DEFAULT_DELAY_MS = 250;
const DEFAULT_TIMEOUT_MS = 30_000;

export type BusinessFranceScraperConfig = {
  apiBaseUrl?: string;
  publicBaseUrl?: string;
  pageSize?: number;
  timeoutMs?: number;
};

export class BusinessFranceScraper implements JobScraper {
  readonly source = "business_france_vie" as const;

  private readonly apiBaseUrl: string;
  private readonly publicBaseUrl: string;
  private readonly pageSize: number;
  private readonly timeoutMs: number;

  constructor(config: BusinessFranceScraperConfig = {}) {
    this.apiBaseUrl = trimTrailingSlash(config.apiBaseUrl ?? DEFAULT_API_BASE_URL);
    this.publicBaseUrl = trimTrailingSlash(config.publicBaseUrl ?? DEFAULT_PUBLIC_BASE_URL);
    this.pageSize = config.pageSize ?? DEFAULT_LIMIT;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async extract(options: ScraperExtractOptions = {}): Promise<RawJobOffer[]> {
    const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
    const maxOffers = options.maxOffers ?? Number.POSITIVE_INFINITY;
    const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
    const scrapedAt = new Date();
    const rawOffers: RawJobOffer[] = [];

    let skip = 0;
    let total: number | undefined;

    for (let pageIndex = 0; pageIndex < maxPages && rawOffers.length < maxOffers; pageIndex += 1) {
      const searchPage = await this.searchOffers(this.pageSize, skip);
      const items = searchPage.result ?? [];
      total = searchPage.count ?? total;

      if (items.length === 0) {
        break;
      }

      for (const item of items) {
        if (rawOffers.length >= maxOffers) {
          break;
        }

        const offerId = item.id;
        if (!offerId) {
          continue;
        }

        const detail = await this.getOfferDetail(offerId, item);
        rawOffers.push({
          source: this.source,
          sourceUrl: this.buildSourceUrl(offerId),
          externalId: String(offerId),
          raw: detail,
          scrapedAt
        });

        await sleep(delayMs);
      }

      skip += items.length;
      if (total !== undefined && skip >= total) {
        break;
      }
    }

    return rawOffers;
  }

  async normalize(raw: RawJobOffer) {
    return mapBusinessFranceJob(raw);
  }

  private async searchOffers(limit: number, skip: number): Promise<BusinessFranceSearchResponse> {
    return this.fetchJson<BusinessFranceSearchResponse>("/api/Offers/search", {
      method: "POST",
      body: JSON.stringify(buildSearchPayload(limit, skip))
    });
  }

  private async getOfferDetail(
    offerId: number,
    rawSearchItem: BusinessFranceApiOfferSummary
  ): Promise<BusinessFranceApiOfferDetail> {
    const detail = await this.fetchJson<BusinessFranceApiOfferDetail>(`/api/Offers/details/${offerId}`);
    return { ...detail, rawSearchItem };
  }

  private async fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.apiBaseUrl}${path}`, {
        ...init,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...init.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Business France API ${response.status} ${response.statusText} on ${path}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildSourceUrl(offerId: number): string {
    return `${this.publicBaseUrl}/${offerId}`;
  }
}

function buildSearchPayload(limit: number, skip: number): BusinessFranceSearchPayload {
  return {
    limit,
    skip,
    activitySectorId: [],
    missionsTypesIds: [],
    missionsDurations: [],
    geographicZones: [],
    countriesIds: [],
    studiesLevelId: [],
    companiesSizes: [],
    specializationsIds: [],
    entreprisesIds: [0],
    missionStartDate: null,
    query: null
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

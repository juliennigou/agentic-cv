export type ScraperSource = "business_france_vie";

export type ScrapeRunStatus = "running" | "skipped" | "success" | "partial_success" | "failed";

export type RawJobOffer = {
  source: ScraperSource;
  sourceUrl: string;
  externalId?: string;
  raw: unknown;
  scrapedAt: Date;
};

export type NormalizedJobOffer = {
  source: ScraperSource;
  sourceUrl: string;
  externalId?: string;
  title: string;
  companyName?: string;
  country?: string;
  city?: string;
  contractType?: string;
  durationMonths?: number;
  salary?: string;
  description: string;
  companyDescription?: string;
  requirements?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  scrapedAt: Date;
  rawData: unknown;
};

export type PersistedOfferCounts = {
  found: number;
  created: number;
  updated: number;
  unchanged: number;
  deactivated: number;
  failed: number;
};

export type ScrapeRunResult = PersistedOfferCounts & {
  source: ScraperSource;
  status: ScrapeRunStatus;
  errors: string[];
};

export interface JobScraper {
  source: ScraperSource;
  extract(options?: ScraperExtractOptions): Promise<RawJobOffer[]>;
  normalize(raw: RawJobOffer): Promise<NormalizedJobOffer>;
}

export type ScraperExtractOptions = {
  maxPages?: number;
  maxOffers?: number;
  delayMs?: number;
};

export type JobOfferRepository = {
  upsertOffer(
    offer: NormalizedJobOffer & { contentHash: string }
  ): Promise<"created" | "updated" | "unchanged">;
  markMissingOffersInactive?(
    source: ScraperSource,
    seenExternalIds: string[],
    observedAt: Date
  ): Promise<number>;
};

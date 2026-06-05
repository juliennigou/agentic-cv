import { computeJobOfferContentHash } from "../dedupe/content-hash";
import { validateNormalizedJobOffer } from "../normalizers/validate-job-offer";
import type { JobOfferRepository, JobScraper, ScrapeRunResult, ScraperExtractOptions } from "../types";

export type RunJobScraperOptions = ScraperExtractOptions & {
  dryRun?: boolean;
  deactivateMissing?: boolean;
};

export async function runJobScraper(
  scraper: JobScraper,
  repository: JobOfferRepository,
  options: RunJobScraperOptions = {}
): Promise<ScrapeRunResult> {
  const rawOffers = await scraper.extract(options);
  const result: ScrapeRunResult = {
    source: scraper.source,
    status: "success",
    found: rawOffers.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    deactivated: 0,
    failed: 0,
    errors: []
  };
  const seenExternalIds = new Set<string>();
  const observedAt = new Date();

  for (const rawOffer of rawOffers) {
    try {
      const normalizedOffer = await scraper.normalize(rawOffer);
      validateNormalizedJobOffer(normalizedOffer);
      if (normalizedOffer.externalId) {
        seenExternalIds.add(normalizedOffer.externalId);
      }

      if (options.dryRun) {
        result.unchanged += 1;
        continue;
      }

      const contentHash = computeJobOfferContentHash(normalizedOffer);
      const persistedState = await repository.upsertOffer({ ...normalizedOffer, contentHash });
      result[persistedState] += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (result.failed > 0) {
    result.status = result.failed === result.found ? "failed" : "partial_success";
  }

  if (
    options.deactivateMissing &&
    !options.dryRun &&
    result.status === "success" &&
    repository.markMissingOffersInactive
  ) {
    result.deactivated = await repository.markMissingOffersInactive(scraper.source, [...seenExternalIds], observedAt);
  }

  return result;
}

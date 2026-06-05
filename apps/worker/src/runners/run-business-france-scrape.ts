import {
  PrismaJobOfferRepository,
  acquireScrapeLock,
  completeScrapeRun,
  createScrapeRun,
  releaseScrapeLock
} from "@agentic-cv/db";
import { BusinessFranceScraper } from "@agentic-cv/scraper-business-france";
import { runJobScraper, type JobOfferRepository, type ScrapeRunResult } from "@agentic-cv/scraper-core";

export type BusinessFranceScrapeOptions = {
  dryRun?: boolean;
  maxPages?: number;
  maxOffers?: number;
  delayMs?: number;
  deactivateMissing?: boolean;
  lockTtlMs?: number;
};

const DEFAULT_LOCK_TTL_MS = 6 * 60 * 60 * 1000;

export async function runBusinessFranceScrape(options: BusinessFranceScrapeOptions = {}) {
  const scraper = new BusinessFranceScraper();

  if (options.dryRun) {
    return runJobScraper(scraper, createDryRunRepository(), {
      dryRun: true,
      maxPages: options.maxPages,
      maxOffers: options.maxOffers,
      delayMs: options.delayMs,
      deactivateMissing: false
    });
  }

  const scrapeRunId = await createScrapeRun(scraper.source);
  const lockAcquired = await acquireScrapeLock(scraper.source, {
    runId: scrapeRunId,
    ttlMs: options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS
  });

  if (!lockAcquired) {
    const skippedResult = createSkippedResult(scraper.source, "A scrape is already running for this source.");
    await completeScrapeRun(scrapeRunId, skippedResult);
    return skippedResult;
  }

  try {
    const repository = new PrismaJobOfferRepository();
    let result: ScrapeRunResult;
    const canDeactivateMissing =
      (options.deactivateMissing ?? true) &&
      options.maxPages === undefined &&
      options.maxOffers === undefined;

    try {
      result = await runJobScraper(scraper, repository, {
        dryRun: options.dryRun,
        maxPages: options.maxPages,
        maxOffers: options.maxOffers,
        delayMs: options.delayMs,
        deactivateMissing: canDeactivateMissing
      });
    } catch (error) {
      result = createFailedResult(
        scraper.source,
        error instanceof Error ? error.message : String(error)
      );
    }

    await completeScrapeRun(scrapeRunId, result);
    return result;
  } finally {
    await releaseScrapeLock(scraper.source, scrapeRunId);
  }
}

function createDryRunRepository(): JobOfferRepository {
  return {
    async upsertOffer() {
      return "unchanged";
    }
  };
}

function createSkippedResult(source: "business_france_vie", message: string): ScrapeRunResult {
  return {
    source,
    status: "skipped",
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    deactivated: 0,
    failed: 0,
    errors: [message]
  };
}

function createFailedResult(source: "business_france_vie", message: string): ScrapeRunResult {
  return {
    source,
    status: "failed",
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    deactivated: 0,
    failed: 0,
    errors: [message]
  };
}
